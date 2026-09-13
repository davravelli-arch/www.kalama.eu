from fastapi import FastAPI, APIRouter, UploadFile, File
from fastapi.responses import Response, StreamingResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import re
import ipaddress
import logging
import httpx
from html import escape
from html.parser import HTMLParser
from urllib.parse import urlparse
from pathlib import Path
from pydantic import BaseModel, Field
import asyncio
from typing import Optional, Union
import uuid
from menu_data import MENU_SEED, MENU_VERSION
from booking import SITES, TableRequestIn, TableRequest, StatusUpdate, ChatIn, request_rows, whatsapp_url, time_slots, build_system_prompt, guest_email, reminder_email
from zoneinfo import ZoneInfo
from emergentintegrations.llm.chat import LlmChat, UserMessage, TextDelta, StreamDone
import json
import hmac
import jwt
from datetime import datetime, timezone, timedelta
from fastapi import HTTPException, Request

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")

# Emergent managed email proxy — constant on purpose, never from env
EMAIL_BASE_URL = "https://integrations.emergentagent.com"
EMAIL_KEY = os.environ.get("EMERGENT_EMAIL_KEY")
EMAIL_FROM_NAME = os.environ["EMAIL_FROM_NAME"]
EMAIL_REPLY_TO = os.environ.get("EMAIL_REPLY_TO")
NOTIFY_EMAIL = os.environ.get("NOTIFY_EMAIL")

class ContactMessage(BaseModel):
    name: str
    email: str
    message: str


class FranchiseInquiry(BaseModel):
    name: str
    email: str
    phone: str
    city: str
    message: Optional[str] = ""


# --- Email guardrail gate (G2/G3) ---
_SHORTENERS = ("bit.ly", "tinyurl.com", "t.co", "is.gd", "cutt.ly", "goo.gl", "rebrand.ly")
_CRED_ASK = ("reply with your password", "reply with the code", "send your password", "cvv",
             "send us your password", "enter your password below", "confirm your card number",
             "your full card number", "seed phrase", "recovery phrase", "verify your card",
             "social security number", "confirm your bank details")
_HOSTISH = re.compile(r"\b(?:https?://)?((?:[a-z0-9-]+\.)+[a-z]{2,})", re.I)


def _host_ok(host: str) -> bool:
    if not host or "xn--" in host:
        return False
    try:
        ipaddress.ip_address(host)
        return False
    except ValueError:
        pass
    return not any(host == s or host.endswith("." + s) for s in _SHORTENERS)


def _same_site(shown: str, real: str) -> bool:
    return shown == real or real.endswith("." + shown) or shown.endswith("." + real)


class _EmailScan(HTMLParser):
    def __init__(self):
        super().__init__()
        self.tags, self.urls, self.anchors = set(), [], []
        self._href, self._text = None, []

    def handle_starttag(self, tag, attrs):
        self.tags.add(tag.lower())
        self.urls += [v for k, v in attrs if k.lower() in ("href", "src") and v]
        if tag.lower() == "a":
            self._href = dict((k.lower(), v) for k, v in attrs).get("href")
            self._text = []

    def handle_data(self, data):
        if self._href is not None:
            self._text.append(data)

    def handle_endtag(self, tag):
        if tag.lower() == "a" and self._href is not None:
            self.anchors.append((self._href, "".join(self._text)))
            self._href, self._text = None, []


def _assert_safe_email(subject: str, html: str) -> None:
    scan = _EmailScan()
    scan.feed(html)
    if scan.tags & {"form", "input", "textarea", "select"}:
        raise ValueError("No forms or input fields in email (G2)")
    body = f"{subject}\n{html}".lower()
    for p in _CRED_ASK:
        if p in body:
            raise ValueError(f"Email asks the recipient for credentials: {p!r} (G2)")
    for url in scan.urls:
        low = url.strip().lower()
        if low.startswith(("mailto:", "tel:", "cid:", "#")):
            continue
        if not low.startswith("https://"):
            raise ValueError(f"Email links/assets must be absolute https: {url!r} (G3)")
        host = urlparse(low).hostname or ""
        if not _host_ok(host) or urlparse(low).username is not None:
            raise ValueError(f"Shortened, numeric-host or credential-bearing URL: {url!r} (G3)")
    for href, text in scan.anchors:
        real = urlparse(href.strip().lower()).hostname or ""
        if not real:
            continue
        for m in _HOSTISH.finditer(text):
            if not _same_site(m.group(1).lower(), real):
                raise ValueError(f"Anchor text {m.group(1)!r} != real link host {real!r} (G3)")


async def send_email(*, to: str, subject: str, html: str, reply_to: str | None = None):
    _assert_safe_email(subject, html)
    payload = {"to": [to], "subject": subject, "html": html, "from_name": EMAIL_FROM_NAME}
    if reply_to or EMAIL_REPLY_TO:
        payload["contact_email"] = reply_to or EMAIL_REPLY_TO
    async with httpx.AsyncClient(timeout=30) as http:
        resp = await http.post(
            f"{EMAIL_BASE_URL}/api/v1/email/send",
            headers={"X-Email-Key": EMAIL_KEY},
            json=payload,
        )
    resp.raise_for_status()
    return resp.json().get("id")


async def notify_owner(subject: str, rows: list[tuple[str, str]], to: str | None = None):
    recipient = to or NOTIFY_EMAIL
    if not (recipient and EMAIL_KEY):
        return
    try:
        body_rows = "".join(
            f'<p style="margin:8px 0"><strong>{escape(k)}:</strong> {escape(v)}</p>' for k, v in rows if v
        )
        html = (
            '<table role="presentation" width="100%"><tr><td style="padding:24px;font-family:Arial,sans-serif">'
            f'<h2 style="color:#1D1D1B;margin:0 0 16px">{escape(subject)}</h2>'
            f"{body_rows}"
            '<p style="font-size:12px;color:#888;margin-top:24px">Inviato automaticamente dal sito kalama.eu</p>'
            "</td></tr></table>"
        )
        await send_email(to=recipient, subject=subject, html=html)
    except Exception as e:
        logger.error(f"Email notification failed: {e}")


@api_router.get("/")
async def root():
    return {"message": "Kalamà API", "status": "ok"}


@api_router.get("/menu")
async def get_menu():
    return await db.menu_items.find({}, {"_id": 0}).to_list(200)


@api_router.post("/contact")
async def create_contact(msg: ContactMessage):
    doc = msg.model_dump()
    doc.update({"id": str(uuid.uuid4()), "type": "contact",
                "created_at": datetime.now(timezone.utc).isoformat()})
    await db.messages.insert_one(doc)
    await notify_owner("Nuovo messaggio dal sito Kalamà", [
        ("Nome", msg.name), ("Email", msg.email), ("Messaggio", msg.message)])
    return {"ok": True, "id": doc["id"]}


@api_router.post("/franchising")
async def create_franchise(inq: FranchiseInquiry):
    doc = inq.model_dump()
    doc.update({"id": str(uuid.uuid4()), "type": "franchising",
                "created_at": datetime.now(timezone.utc).isoformat()})
    await db.messages.insert_one(doc)
    await notify_owner("Nuova richiesta Franchising Kalamà", [
        ("Nome", inq.name), ("Email", inq.email), ("Telefono", inq.phone),
        ("Città", inq.city), ("Messaggio", inq.message or "")])
    return {"ok": True, "id": doc["id"]}


# --- Admin auth & menu management ---
JWT_SECRET = os.environ["JWT_SECRET"]
ADMIN_PASSWORD = os.environ["ADMIN_PASSWORD"]
JWT_ALGORITHM = "HS256"
LOCKOUT_AFTER = 5
LOCKOUT_MINUTES = 15


class AdminLogin(BaseModel):
    password: str


class MenuItem(BaseModel):
    id: str
    location: str = "malaga"
    category: str
    name_it: str
    name_en: str
    desc_it: str = ""
    desc_en: str = ""
    price: float
    price_max: Optional[float] = None
    tag_it: str = ""
    tag_en: str = ""
    image: str = ""


def create_admin_token() -> str:
    payload = {"sub": "admin", "type": "admin",
               "exp": datetime.now(timezone.utc) + timedelta(hours=12)}
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def require_admin(request: Request):
    auth = request.headers.get("Authorization", "")
    token = auth[7:] if auth.startswith("Bearer ") else None
    if not token:
        raise HTTPException(status_code=401, detail="Non autenticato")
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "admin":
            raise HTTPException(status_code=401, detail="Token non valido")
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Sessione scaduta, rifai il login")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Token non valido")


@api_router.post("/admin/login")
async def admin_login(body: AdminLogin, request: Request):
    ip = request.client.host if request.client else "unknown"
    key = f"admin:{ip}"
    attempt = await db.login_attempts.find_one({"_id": key})
    if attempt:
        locked_until = attempt.get("locked_until", "")
        if locked_until and datetime.fromisoformat(locked_until) <= datetime.now(timezone.utc):
            await db.login_attempts.delete_one({"_id": key})
            attempt = None
    if attempt and attempt.get("count", 0) >= LOCKOUT_AFTER:
        raise HTTPException(status_code=429, detail="Troppi tentativi. Riprova tra 15 minuti.")
    if not hmac.compare_digest(body.password.encode("utf-8"), ADMIN_PASSWORD.encode("utf-8")):
        await db.login_attempts.update_one(
            {"_id": key},
            {"$inc": {"count": 1},
             "$set": {"locked_until": (datetime.now(timezone.utc) + timedelta(minutes=LOCKOUT_MINUTES)).isoformat()}},
            upsert=True,
        )
        raise HTTPException(status_code=401, detail="Password errata")
    await db.login_attempts.delete_one({"_id": key})
    return {"token": create_admin_token()}


@api_router.get("/admin/menu")
async def admin_list_menu(request: Request):
    require_admin(request)
    return await db.menu_items.find({}, {"_id": 0}).to_list(500)


@api_router.post("/admin/menu")
async def admin_create_menu(item: MenuItem, request: Request):
    require_admin(request)
    if await db.menu_items.find_one({"id": item.id}):
        raise HTTPException(status_code=409, detail="ID piatto già esistente")
    await db.menu_items.insert_one(item.model_dump())
    return {"ok": True, "id": item.id}


@api_router.put("/admin/menu/{item_id}")
async def admin_update_menu(item_id: str, item: MenuItem, request: Request):
    require_admin(request)
    result = await db.menu_items.update_one({"id": item_id}, {"$set": item.model_dump()})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Piatto non trovato")
    return {"ok": True}


@api_router.delete("/admin/menu/{item_id}")
async def admin_delete_menu(item_id: str, request: Request):
    require_admin(request)
    result = await db.menu_items.delete_one({"id": item_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Piatto non trovato")
    return {"ok": True}


@app.on_event("startup")
async def seed_menu():
    meta = await db.meta.find_one({"_id": "menu_version"})
    if await db.menu_items.count_documents({}) == 0 or not meta or meta.get("version") != MENU_VERSION:
        await db.menu_items.delete_many({})
        await db.menu_items.insert_many([dict(i) for i in MENU_SEED])
        await db.meta.update_one({"_id": "menu_version"}, {"$set": {"version": MENU_VERSION}}, upsert=True)
    try:
        await init_storage()
    except Exception as e:
        logger.error(f"Storage init failed: {e}")
    asyncio.create_task(reminder_loop())


# --- Object storage (Emergent managed) & site images ---
STORAGE_BASE = (os.environ.get("INTEGRATION_PROXY_URL") or "").strip() or "https://integrations.emergentagent.com"
STORAGE_URL = STORAGE_BASE.rstrip("/") + "/objstore/api/v1/storage"
EMERGENT_KEY = os.environ.get("EMERGENT_LLM_KEY")
APP_NAME = "kalama"
MAX_UPLOAD = 8 * 1024 * 1024
MAX_VIDEO_UPLOAD = 40 * 1024 * 1024
IMAGE_TYPES = {"image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif"}
VIDEO_TYPES = {"video/mp4": "mp4", "video/webm": "webm", "video/quicktime": "mov"}
SITE_IMAGE_KEYS = {"hero", "hero-malaga", "hero-malta", "about", "location-malaga", "location-sliema", "foodtruck", "gallery", "hero-video-malaga", "hero-video-malta", "bg-malaga", "bg-malta"}
_storage_key: Optional[str] = None


async def init_storage(force: bool = False) -> str:
    global _storage_key
    if _storage_key and not force:
        return _storage_key
    async with httpx.AsyncClient(timeout=30) as http:
        resp = await http.post(f"{STORAGE_URL}/init", json={"emergent_key": EMERGENT_KEY})
    resp.raise_for_status()
    _storage_key = resp.json()["storage_key"]
    return _storage_key


async def put_object(path: str, data: bytes, content_type: str) -> dict:
    key = await init_storage()
    async with httpx.AsyncClient(timeout=120) as http:
        resp = await http.put(f"{STORAGE_URL}/objects/{path}",
                              headers={"X-Storage-Key": key, "Content-Type": content_type}, content=data)
        if resp.status_code == 404:
            key = await init_storage(force=True)
            resp = await http.put(f"{STORAGE_URL}/objects/{path}",
                                  headers={"X-Storage-Key": key, "Content-Type": content_type}, content=data)
    resp.raise_for_status()
    return resp.json()


async def get_object(path: str) -> tuple[bytes, str]:
    key = await init_storage()
    async with httpx.AsyncClient(timeout=60) as http:
        resp = await http.get(f"{STORAGE_URL}/objects/{path}", headers={"X-Storage-Key": key})
    resp.raise_for_status()
    return resp.content, resp.headers.get("Content-Type", "application/octet-stream")


async def store_image(data: bytes, content_type: str, original_name: str) -> str:
    is_video = content_type in VIDEO_TYPES
    ext = VIDEO_TYPES[content_type] if is_video else IMAGE_TYPES[content_type]
    path = f"{APP_NAME}/{'videos' if is_video else 'uploads'}/{uuid.uuid4()}.{ext}"
    result = await put_object(path, data, content_type)
    await db.files.insert_one({
        "id": str(uuid.uuid4()), "storage_path": result["path"], "original_filename": original_name,
        "content_type": content_type, "size": result.get("size", len(data)), "is_deleted": False,
        "created_at": datetime.now(timezone.utc).isoformat(),
    })
    return f"/api/files/{result['path']}"


@api_router.post("/admin/upload")
async def admin_upload(request: Request, file: UploadFile = File(...)):
    require_admin(request)
    is_video = file.content_type in VIDEO_TYPES
    if not is_video and file.content_type not in IMAGE_TYPES:
        raise HTTPException(status_code=415, detail="Formato non supportato: usa JPG, PNG, WebP o video MP4/WebM")
    data = await file.read()
    if len(data) > (MAX_VIDEO_UPLOAD if is_video else MAX_UPLOAD):
        raise HTTPException(status_code=413, detail="File troppo grande (max 40 MB video, 8 MB immagini)")
    try:
        url = await store_image(data, file.content_type, file.filename or "upload")
    except httpx.HTTPStatusError as e:
        logger.error(f"Upload failed: {e}")
        raise HTTPException(status_code=502, detail="Caricamento sul cloud non riuscito, riprova")
    return {"url": url}


@api_router.get("/files/{path:path}")
async def serve_file(path: str, request: Request):
    record = await db.files.find_one({"storage_path": path, "is_deleted": False})
    if not record:
        raise HTTPException(status_code=404, detail="File non trovato")
    try:
        data, content_type = await get_object(path)
    except httpx.HTTPStatusError:
        raise HTTPException(status_code=404, detail="File non trovato")
    media_type = record.get("content_type", content_type)
    headers = {"Cache-Control": "public, max-age=31536000, immutable", "Accept-Ranges": "bytes"}
    range_header = request.headers.get("range")
    if range_header and range_header.startswith("bytes="):
        start_s, _, end_s = range_header[6:].partition("-")
        start = int(start_s or 0)
        end = min(int(end_s) if end_s else len(data) - 1, len(data) - 1)
        if start > end or start >= len(data):
            raise HTTPException(status_code=416, detail="Range non valido")
        headers["Content-Range"] = f"bytes {start}-{end}/{len(data)}"
        return Response(content=data[start:end + 1], status_code=206, media_type=media_type, headers=headers)
    return Response(content=data, media_type=media_type, headers=headers)


class SiteImageUpdate(BaseModel):
    value: Union[str, list[str]]


@api_router.get("/site-images")
async def get_site_images():
    docs = await db.site_images.find({}, {"_id": 0}).to_list(50)
    return {d["key"]: d["value"] for d in docs}


@api_router.put("/admin/site-images/{key}")
async def set_site_image(key: str, body: SiteImageUpdate, request: Request):
    require_admin(request)
    if key not in SITE_IMAGE_KEYS:
        raise HTTPException(status_code=404, detail="Chiave immagine non valida")
    if (key == "gallery") != isinstance(body.value, list):
        raise HTTPException(status_code=422, detail="Tipo valore non valido per questa chiave")
    await db.site_images.update_one({"key": key}, {"$set": {"key": key, "value": body.value}}, upsert=True)
    return {"ok": True}


# --- Reviews: admin-curated + Google Places (live, optional) ---
REVIEW_SOURCES = {"google", "tripadvisor", "thefork", "facebook", "other"}
GOOGLE_KEY = (os.environ.get("GOOGLE_PLACES_API_KEY") or "").strip()
GOOGLE_FIELDS = "id,displayName,rating,userRatingCount,googleMapsUri,reviews.rating,reviews.text,reviews.originalText,reviews.relativePublishTimeDescription,reviews.authorAttribution,reviews.googleMapsUri,reviews.flagContentUri"
GOOGLE_TTL = timedelta(minutes=30)
_google_cache: dict[str, tuple[datetime, dict]] = {}


class Review(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    author: str
    rating: int = Field(ge=1, le=5)
    text: str
    location: str = "malaga"
    source: str = "google"
    date: str = ""
    featured: bool = False
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class ReviewIn(BaseModel):
    author: str
    rating: int = Field(ge=1, le=5)
    text: str
    location: str = "malaga"
    source: str = "google"
    date: str = ""
    featured: bool = False


def validate_review(body: ReviewIn):
    if body.location not in {"malaga", "malta"}:
        raise HTTPException(status_code=422, detail="Sede non valida")
    if body.source not in REVIEW_SOURCES:
        raise HTTPException(status_code=422, detail="Fonte non valida")
    if not body.author.strip() or not body.text.strip():
        raise HTTPException(status_code=422, detail="Autore e testo sono obbligatori")


@api_router.get("/reviews", response_model=list[Review])
async def list_reviews():
    docs = await db.reviews.find({}, {"_id": 0}).sort([("featured", -1), ("created_at", -1)]).to_list(500)
    return docs


@api_router.post("/admin/reviews", response_model=Review)
async def create_review(body: ReviewIn, request: Request):
    require_admin(request)
    validate_review(body)
    review = Review(**body.model_dump())
    await db.reviews.insert_one(review.model_dump())
    return review


@api_router.put("/admin/reviews/{review_id}", response_model=Review)
async def update_review(review_id: str, body: ReviewIn, request: Request):
    require_admin(request)
    validate_review(body)
    existing = await db.reviews.find_one({"id": review_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Recensione non trovata")
    updated = Review(**{**existing, **body.model_dump()})
    await db.reviews.replace_one({"id": review_id}, updated.model_dump())
    return updated


@api_router.delete("/admin/reviews/{review_id}")
async def delete_review(review_id: str, request: Request):
    require_admin(request)
    result = await db.reviews.delete_one({"id": review_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Recensione non trovata")
    return {"ok": True}


class GooglePlaces(BaseModel):
    malaga: str = ""
    malta: str = ""


async def google_place_ids() -> dict:
    doc = await db.settings.find_one({"_id": "google_places"}, {"_id": 0})
    return doc or {"malaga": "", "malta": ""}


def normalize_google(place: dict, location: str) -> dict:
    return {
        "location": location,
        "name": (place.get("displayName") or {}).get("text"),
        "rating": place.get("rating"),
        "count": place.get("userRatingCount", 0),
        "mapsUri": place.get("googleMapsUri"),
        "reviews": [
            {
                "rating": r.get("rating"),
                "text": (r.get("text") or r.get("originalText") or {}).get("text", ""),
                "relativeTime": r.get("relativePublishTimeDescription"),
                "author": (r.get("authorAttribution") or {}).get("displayName"),
                "authorPhoto": (r.get("authorAttribution") or {}).get("photoUri"),
                "authorUri": (r.get("authorAttribution") or {}).get("uri"),
                "mapsUri": r.get("googleMapsUri"),
                "flagUri": r.get("flagContentUri"),
            }
            for r in place.get("reviews", [])
        ],
    }


async def fetch_google_place(place_id: str, location: str, lang: str) -> Optional[dict]:
    cache_key = f"{place_id}:{lang}"
    cached = _google_cache.get(cache_key)
    if cached and datetime.now(timezone.utc) - cached[0] < GOOGLE_TTL:
        return cached[1]
    async with httpx.AsyncClient(timeout=10) as http:
        resp = await http.get(f"https://places.googleapis.com/v1/places/{place_id}",
                              headers={"X-Goog-Api-Key": GOOGLE_KEY, "X-Goog-FieldMask": GOOGLE_FIELDS},
                              params={"languageCode": lang})
    if resp.status_code >= 400:
        logger.error(f"Google Places error {resp.status_code} for {location}")
        return None
    data = normalize_google(resp.json(), location)
    _google_cache[cache_key] = (datetime.now(timezone.utc), data)
    return data


@api_router.get("/reviews/google")
async def google_reviews(lang: str = "it"):
    ids = await google_place_ids()
    configured = {k: v for k, v in ids.items() if v}
    if not GOOGLE_KEY or not configured:
        return {"enabled": False, "places": []}
    lang = lang if lang in {"it", "en", "es", "de", "fr", "pt"} else "it"
    results = await asyncio.gather(*[fetch_google_place(pid, loc, lang) for loc, pid in configured.items()])
    return {"enabled": True, "places": [r for r in results if r]}


@api_router.get("/admin/google-places")
async def get_google_places(request: Request):
    require_admin(request)
    return {"hasKey": bool(GOOGLE_KEY), "placeIds": await google_place_ids()}


@api_router.put("/admin/google-places")
async def set_google_places(body: GooglePlaces, request: Request):
    require_admin(request)
    await db.settings.update_one({"_id": "google_places"}, {"$set": body.model_dump()}, upsert=True)
    _google_cache.clear()
    return {"ok": True}


class PlaceSearch(BaseModel):
    query: str


@api_router.post("/admin/google-places/search")
async def search_google_places(body: PlaceSearch, request: Request):
    require_admin(request)
    if not GOOGLE_KEY:
        raise HTTPException(status_code=409, detail="Chiave Google Places non configurata sul server")
    async with httpx.AsyncClient(timeout=10) as http:
        resp = await http.post("https://places.googleapis.com/v1/places:searchText",
                               headers={"X-Goog-Api-Key": GOOGLE_KEY, "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress"},
                               json={"textQuery": body.query})
    if resp.status_code >= 400:
        raise HTTPException(status_code=502, detail="Ricerca Google non riuscita: verifica chiave e API abilitata")
    return [{"id": p["id"], "name": (p.get("displayName") or {}).get("text"), "address": p.get("formattedAddress")} for p in resp.json().get("places", [])]


# --- Table requests ---
@api_router.get("/table-requests/slots")
async def get_slots(site: str, date: str):
    if site not in SITES:
        raise HTTPException(status_code=422, detail="Sede non valida")
    try:
        return time_slots(site, date)
    except ValueError:
        raise HTTPException(status_code=422, detail="Data non valida")


@api_router.post("/table-requests")
async def create_table_request(body: TableRequestIn):
    req = TableRequest(**body.model_dump())
    await db.table_requests.insert_one(req.model_dump())
    site = SITES[req.site]
    asyncio.create_task(notify_owner(
        f"Richiesta tavolo {site['name']} — {req.date} {req.time} · {req.guests} pers.",
        request_rows(req), to=site["email"],
    ))
    return {"id": req.id, "whatsapp_url": whatsapp_url(req), "site_email": site["email"]}


@api_router.get("/admin/table-requests")
async def list_table_requests(request: Request):
    require_admin(request)
    return await db.table_requests.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)


@api_router.patch("/admin/table-requests/{req_id}")
async def update_table_request(req_id: str, body: StatusUpdate, request: Request):
    require_admin(request)
    req = await db.table_requests.find_one({"id": req_id}, {"_id": 0})
    if not req:
        raise HTTPException(status_code=404, detail="Richiesta non trovata")
    update = {"status": body.status}
    notified = False
    if body.status in {"confirmed", "declined"} and EMAIL_KEY:
        subject, html = guest_email(req, body.status)
        try:
            await send_email(to=req["email"], subject=subject, html=html, reply_to=SITES[req["site"]]["email"])
            update["guest_notified_at"] = datetime.now(timezone.utc).isoformat()
            update["guest_notified_status"] = body.status
            notified = True
        except Exception as e:
            logger.error(f"Guest email failed: {e}")
    await db.table_requests.update_one({"id": req_id}, {"$set": update})
    return {"ok": True, "guest_notified": notified}


@api_router.delete("/admin/table-requests/{req_id}")
async def delete_table_request(req_id: str, request: Request):
    require_admin(request)
    result = await db.table_requests.delete_one({"id": req_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Richiesta non trovata")
    return {"ok": True}


# --- Reminder emails (morning of a confirmed table) ---
LOCAL_TZ = ZoneInfo("Europe/Madrid")
REMINDER_HOUR = 9


async def send_reminder(req: dict) -> bool:
    if not EMAIL_KEY:
        return False
    subject, html = reminder_email(req)
    try:
        await send_email(to=req["email"], subject=subject, html=html, reply_to=SITES[req["site"]]["email"])
    except Exception as e:
        logger.error(f"Reminder email failed for {req['id']}: {e}")
        return False
    await db.table_requests.update_one({"id": req["id"]}, {"$set": {"reminder_sent_at": datetime.now(timezone.utc).isoformat()}})
    return True


async def run_reminders() -> int:
    now = datetime.now(LOCAL_TZ)
    if now.hour < REMINDER_HOUR:
        return 0
    due = await db.table_requests.find(
        {"status": "confirmed", "date": now.date().isoformat(), "reminder_sent_at": {"$exists": False}}, {"_id": 0}
    ).to_list(200)
    sent = 0
    for req in due:
        sent += await send_reminder(req)
    return sent


async def reminder_loop():
    while True:
        try:
            await run_reminders()
        except Exception as e:
            logger.error(f"Reminder loop error: {e}")
        await asyncio.sleep(15 * 60)


@api_router.post("/admin/table-requests/run-reminders")
async def trigger_reminders(request: Request):
    require_admin(request)
    return {"sent": await run_reminders()}


@api_router.post("/admin/table-requests/{req_id}/remind")
async def remind_one(req_id: str, request: Request):
    require_admin(request)
    req = await db.table_requests.find_one({"id": req_id}, {"_id": 0})
    if not req:
        raise HTTPException(status_code=404, detail="Richiesta non trovata")
    if req["status"] != "confirmed":
        raise HTTPException(status_code=409, detail="Solo le richieste confermate ricevono il promemoria")
    return {"sent": await send_reminder(req)}


# --- AI assistant (GPT-5.4 mini via Emergent LLM key) ---
CHAT_MODEL = ("openai", "gpt-5.4-mini")
CHAT_HISTORY_LIMIT = 16


@api_router.post("/chat")
async def chat(body: ChatIn):
    if body.site not in SITES:
        raise HTTPException(status_code=422, detail="Sede non valida")
    if not EMERGENT_KEY:
        raise HTTPException(status_code=503, detail="Assistente non disponibile")
    menu_items = await db.menu_items.find({"location": body.site}, {"_id": 0}).to_list(300)
    history_docs = await db.chat_messages.find({"session_id": body.session_id}, {"_id": 0, "role": 1, "content": 1}) \
        .sort("created_at", -1).limit(CHAT_HISTORY_LIMIT).to_list(CHAT_HISTORY_LIMIT)
    history = [{"role": d["role"], "content": d["content"]} for d in reversed(history_docs)]
    system = build_system_prompt(body.site, body.lang, menu_items)
    llm = LlmChat(api_key=EMERGENT_KEY, session_id=body.session_id, system_message=system,
                  initial_messages=[{"role": "system", "content": system}, *history]).with_model(*CHAT_MODEL)
    now = datetime.now(timezone.utc).isoformat()
    await db.chat_messages.insert_one({"id": str(uuid.uuid4()), "session_id": body.session_id, "role": "user",
                                       "content": body.message, "site": body.site, "created_at": now})

    async def stream():
        full = []
        try:
            async for ev in llm.stream_message(UserMessage(text=body.message)):
                if isinstance(ev, TextDelta):
                    full.append(ev.content)
                    yield f"data: {json.dumps({'delta': ev.content})}\n\n"
                elif isinstance(ev, StreamDone):
                    break
        except Exception as e:
            logger.error(f"Chat stream failed: {e}")
            yield f"data: {json.dumps({'error': 'assistant_unavailable'})}\n\n"
        text = "".join(full)
        if text:
            await db.chat_messages.insert_one({"id": str(uuid.uuid4()), "session_id": body.session_id, "role": "assistant",
                                               "content": text, "site": body.site, "created_at": datetime.now(timezone.utc).isoformat()})
        yield "data: [DONE]\n\n"

    return StreamingResponse(stream(), media_type="text/event-stream",
                             headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"})


@api_router.get("/chat/{session_id}")
async def chat_history(session_id: str):
    docs = await db.chat_messages.find({"session_id": session_id}, {"_id": 0, "role": 1, "content": 1, "created_at": 1}) \
        .sort("created_at", 1).to_list(200)
    return docs


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO,
                    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
