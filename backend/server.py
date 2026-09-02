from fastapi import FastAPI, APIRouter
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
from pydantic import BaseModel
from typing import Optional
import uuid
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

U = "https://images.unsplash.com/"
TF = "https://cdn.thefork.com/tf-lab/image/upload/w_640,c_fill,q_auto,f_auto/restaurant/8d038508-d588-47fb-a095-fd0e9d912f32/"
MG = "https://images.myguide-cdn.com/malaga/companies/kalama-malaga-seafood-bar/large/"


def u(photo_id):
    return f"{U}{photo_id}?q=80&w=800&auto=format&fit=crop"


MENU_SEED = [
    {"id": "melanzane", "category": "cucina", "name_it": "Melanzane alla Parmigiana", "name_en": "Eggplant Parmigiana", "desc_it": "Melanzane, salsa di pomodoro, basilico, mozzarella, provola e parmigiano.", "desc_en": "Aubergine, tomato sauce, basil, mozzarella, provola and parmesan.", "price": 12.0, "tag_it": "", "tag_en": "", "image": u("photo-1534080564583-6be75777b70a")},
    {"id": "polpo-luciana", "category": "cucina", "name_it": "Polpo alla Luciana", "name_en": "Octopus Luciana Style", "desc_it": "Polpo, vino bianco, pomodorini, olive, capperi e prezzemolo su letto di patate saltate.", "desc_en": "Octopus, white wine, cherry tomatoes, olives, capers and parsley over sautéed potatoes.", "price": 18.0, "tag_it": "", "tag_en": "", "image": u("photo-1467003909585-2f8a72700288")},
    {"id": "scialatielli", "category": "pasta", "name_it": "Scialatielli Puttanesca e Pesce", "name_en": "Scialatielli Puttanesca & Fresh Fish", "desc_it": "Pasta fatta in casa, pesce fresco, pomodorini, olive, capperi, prezzemolo e aglio.", "desc_en": "Homemade pasta, fresh fish, cherry tomatoes, olives, capers, parsley and garlic.", "price": 15.0, "tag_it": "", "tag_en": "", "image": u("photo-1473093295043-cdd812d0e601")},
    {"id": "orecchiette", "category": "pasta", "name_it": "Orecchiette Broccoli e Alici", "name_en": "Orecchiette with Broccoli & Anchovies", "desc_it": "Pasta fresca, broccoli, alici sott'olio, aglio, prezzemolo, olio EVO.", "desc_en": "Fresh pasta, broccoli, anchovies in oil, garlic, parsley, EVO oil.", "price": 14.5, "tag_it": "", "tag_en": "", "image": u("photo-1551183053-bf91a1d81141")},
    {"id": "strozzapreti", "category": "pasta", "name_it": "Strozzapreti Gamberi e Zucchine", "name_en": "Strozzapreti with Prawns & Zucchini", "desc_it": "Pasta fresca con gamberi e zucchine.", "desc_en": "Fresh pasta with prawns and zucchini.", "price": 16.0, "tag_it": "", "tag_en": "", "image": u("photo-1621996346565-e3dbc646d9a9")},
    {"id": "calamari-piccolo", "category": "fritti", "name_it": "Calamari Fritti Piccolo (150g)", "name_en": "Fried Calamari Small (150g)", "desc_it": "Anelli di calamaro freschissimo in pastella leggera.", "desc_en": "Super-fresh squid rings in a light batter.", "price": 11.0, "tag_it": "", "tag_en": "", "image": MG + "kalama-malaga-seafood-bar-2-7495722.jpg"},
    {"id": "calamari-grande", "category": "fritti", "name_it": "Calamari Fritti Grande (250g)", "name_en": "Fried Calamari Large (250g)", "desc_it": "La porzione grande per i veri affamati.", "desc_en": "The large portion for the truly hungry.", "price": 14.0, "tag_it": "", "tag_en": "", "image": TF + "4a45016f-eeb4-4c62-b24d-7ee8ecfc46b8.png"},
    {"id": "calamari-zucchine", "category": "fritti", "name_it": "Calamari e Zucchine", "name_en": "Calamari & Zucchini", "desc_it": "Calamari fritti con zucchine croccanti.", "desc_en": "Fried calamari with crispy zucchini.", "price": 14.0, "tag_it": "", "tag_en": "", "image": TF + "5b6ddc1e-6ea8-4a24-9283-bc18ccc9ce0c.png"},
    {"id": "calamari-gamberi", "category": "fritti", "name_it": "Calamari Fritti e Gamberi", "name_en": "Fried Calamari & Prawns", "desc_it": "Il fritto perfetto per i più golosi.", "desc_en": "The perfect fry for the greediest.", "price": 16.0, "tag_it": "", "tag_en": "", "image": u("photo-1559847844-5315695dadae")},
    {"id": "gamberi-fritti", "category": "fritti", "name_it": "Gamberi Fritti (8 pz)", "name_en": "Fried Prawns (8 pcs)", "desc_it": "Otto gamberi dorati e croccanti.", "desc_en": "Eight golden, crispy prawns.", "price": 18.0, "tag_it": "", "tag_en": "", "image": TF + "ec864289-8335-49ea-ad30-157c7f207b5e.png"},
    {"id": "gran-fritto", "category": "fritti", "name_it": "Gran Fritto Misto", "name_en": "Grand Mixed Fry", "desc_it": "Calamari, zucchine, gamberi, baccalà, neonata, polpo e rosada.", "desc_en": "Calamari, zucchini, prawns, cod, neonata, octopus and rosada.", "price": 32.0, "tag_it": "Da condividere", "tag_en": "To share", "image": TF + "b0bd03e5-a835-4645-85c3-1ec8c5ec9058.png"},
    {"id": "crocchette", "category": "fritti", "name_it": "Crocchette di Baccalà (5 pz)", "name_en": "Cod Croquettes (5 pcs)", "desc_it": "Crocchette dorate di baccalà e patate.", "desc_en": "Golden cod and potato croquettes.", "price": 10.0, "tag_it": "", "tag_en": "", "image": TF + "747086b1-0a2c-4b72-99f6-970f01b4b9a0.png"},
    {"id": "fish-chips", "category": "fritti", "name_it": "Fish & Chips (Baccalà)", "name_en": "Fish & Chips (Cod)", "desc_it": "Baccalà in pastella con patatine fritte.", "desc_en": "Battered cod with fries.", "price": 14.0, "tag_it": "", "tag_en": "", "image": u("photo-1579208030886-b937da0925dc")},
    {"id": "pinchos-calamari", "category": "grill", "name_it": "Spiedini di Calamari (3 pz)", "name_en": "Calamari Skewers (3 pcs)", "desc_it": "Tre spiedini di calamari alla griglia.", "desc_en": "Three grilled calamari skewers.", "price": 13.0, "tag_it": "", "tag_en": "", "image": u("photo-1559742811-822873691df8")},
    {"id": "rosada", "category": "grill", "name_it": "Rosada alla Griglia", "name_en": "Grilled Rosada", "desc_it": "Con patatine fritte e insalata.", "desc_en": "With fries and salad.", "price": 18.0, "tag_it": "", "tag_en": "", "image": u("photo-1615141982883-c7ad0e69fd62")},
    {"id": "salmone", "category": "grill", "name_it": "Salmone alla Griglia", "name_en": "Grilled Salmon", "desc_it": "Con patatine fritte e insalata.", "desc_en": "With fries and salad.", "price": 18.0, "tag_it": "", "tag_en": "", "image": MG + "kalama-malaga-seafood-bar-4-7495724.jpg"},
    {"id": "insalata-mista", "category": "insalate", "name_it": "Insalata Mista", "name_en": "Mixed Salad", "desc_it": "Insalata verde, pomodorini, rucola, olive verdi, cipolla rossa.", "desc_en": "Green salad, cherry tomatoes, arugula, green olives, red onion.", "price": 5.0, "tag_it": "", "tag_en": "", "image": u("photo-1625944230945-1b7dd3b949ab")},
    {"id": "insalata-russa", "category": "insalate", "name_it": "Insalata Russa all'Italiana", "name_en": "Italian-Style Russian Salad", "desc_it": "Gamberetti, gamberi, tonno, cetrioli e piselli.", "desc_en": "Shrimps, prawns, tuna, cucumbers and peas.", "price": 12.0, "tag_it": "", "tag_en": "", "image": TF + "0baa8f03-0cc8-4296-9776-05381fcb6e62.png"},
    {"id": "insalata-catalana", "category": "insalate", "name_it": "Insalata Catalana", "name_en": "Catalan Salad", "desc_it": "Polpo tenero, gamberi, calamari, pomodorini, cipolla rossa, patate, basilico, sedano, carota, olio EVO e limone.", "desc_en": "Tender octopus, prawns, calamari, cherry tomatoes, red onion, potatoes, basil, celery, carrot, EVO oil and lemon.", "price": 18.0, "tag_it": "", "tag_en": "", "image": u("photo-1546069901-ba9599a7e63c")},
    {"id": "insalata-polpo", "category": "insalate", "name_it": "Insalata di Polpo", "name_en": "Octopus Salad", "desc_it": "Polpo tenero bollito, patate, prezzemolo, aglio, pomodori secchi, sedano, citronette.", "desc_en": "Tender boiled octopus, potatoes, parsley, garlic, sun-dried tomatoes, celery, citronette.", "price": 16.0, "tag_it": "", "tag_en": "", "image": u("photo-1565680018434-b513d5e5fd47")},
    {"id": "comino", "category": "panini", "name_it": "Comino Sandwich", "name_en": "Comino Sandwich", "desc_it": "Tonno fresco alla griglia, peperoni arrosto, pomodorini caramellati, rucola, salsa della casa.", "desc_en": "Grilled fresh tuna, roasted peppers, caramelised cherry tomatoes, arugula, house sauce.", "price": 15.0, "tag_it": "", "tag_en": "", "image": TF + "da7c05ce-7bd0-4b49-b8b3-572178668d08.png"},
    {"id": "gozo", "category": "panini", "name_it": "Gozo Sandwich", "name_en": "Gozo Sandwich", "desc_it": "Polpo tenero alla griglia, pomodori secchi, stracciatella, rucola, salsa della casa.", "desc_en": "Grilled tender octopus, sun-dried tomatoes, stracciatella, arugula, house sauce.", "price": 15.0, "tag_it": "Più amato", "tag_en": "Best seller", "image": MG + "kalama-malaga-seafood-bar-1-7495721.jpg"},
    {"id": "capri", "category": "panini", "name_it": "Capri Sandwich", "name_en": "Capri Sandwich", "desc_it": "Calamari alla griglia, melanzane grigliate, philadelphia, hummus, insalata.", "desc_en": "Grilled calamari, grilled aubergine, philadelphia, hummus, salad.", "price": 15.0, "tag_it": "", "tag_en": "", "image": TF + "8f4295b4-bd0a-4795-9fe1-0ce99150127e.png"},
    {"id": "tiramisu", "category": "dolci", "name_it": "Tiramisù Classico", "name_en": "Classic Tiramisù", "desc_it": "Il dolce italiano per eccellenza.", "desc_en": "The quintessential Italian dessert.", "price": 5.0, "tag_it": "", "tag_en": "", "image": u("photo-1571877227200-a0d98ea607e9")},
    {"id": "spritz", "category": "dolci", "name_it": "Spritz", "name_en": "Spritz", "desc_it": "L'aperitivo che profuma d'estate.", "desc_en": "The aperitif that tastes like summer.", "price": 7.0, "tag_it": "", "tag_en": "", "image": u("photo-1514362545857-3bc16c4c7d1b")},
    {"id": "mojito", "category": "dolci", "name_it": "Mojito", "name_en": "Mojito", "desc_it": "Menta, lime e soda: freschezza cubana.", "desc_en": "Mint, lime and soda: Cuban freshness.", "price": 7.0, "tag_it": "", "tag_en": "", "image": u("photo-1551538827-9c037cb4f32a")},
]


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


async def notify_owner(subject: str, rows: list[tuple[str, str]]):
    if not (NOTIFY_EMAIL and EMAIL_KEY):
        return
    try:
        body_rows = "".join(
            f'<p style="margin:8px 0"><strong>{escape(k)}:</strong> {escape(v)}</p>' for k, v in rows if v
        )
        html = (
            '<table role="presentation" width="100%"><tr><td style="padding:24px;font-family:Arial,sans-serif">'
            f'<h2 style="color:#0A192F;margin:0 0 16px">{escape(subject)}</h2>'
            f"{body_rows}"
            '<p style="font-size:12px;color:#888;margin-top:24px">Inviato automaticamente dal sito kalama.eu</p>'
            "</td></tr></table>"
        )
        await send_email(to=NOTIFY_EMAIL, subject=subject, html=html)
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
    category: str
    name_it: str
    name_en: str
    desc_it: str = ""
    desc_en: str = ""
    price: float
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
    if await db.menu_items.count_documents({}) == 0:
        await db.menu_items.insert_many(MENU_SEED)


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
