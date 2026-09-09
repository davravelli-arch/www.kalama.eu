from datetime import date, datetime, timezone
from typing import Optional
from urllib.parse import quote
import uuid

from pydantic import BaseModel, Field, field_validator

SITES = {
    "malaga": {
        "name": "Kalamà Málaga", "address": "Calle Trinidad Grund 7, Soho, 29001 Málaga", "email": "info@kalama.eu",
        "phone": "+34 610 755 695", "whatsapp": "34610755695", "hours": "Mar–Dom 12:00–23:30 (lunedì chiuso)",
        "closed_weekdays": [0], "lunch": ("12:00", "15:30"), "dinner": ("19:00", "22:30"),
        "delivery": "Glovo", "booking": "TheFork: https://www.thefork.es/restaurante/kalama-malaga-r866671",
        "maps": "https://maps.google.com/?cid=12800882317661358537", "menu_lang": "it",
    },
    "malta": {
        "name": "Kalamà Sliema", "address": "111 Triq ix-Xatt, Sliema SLM 3210, Malta", "email": "kalama.international@gmail.com",
        "phone": "+356 7990 0819", "whatsapp": "35679900819", "hours": "Tutti i giorni 12:00–23:00",
        "closed_weekdays": [], "lunch": ("12:00", "15:30"), "dinner": ("18:30", "22:00"),
        "delivery": "Bolt Food", "booking": "", "maps": "https://www.google.com/maps/search/?api=1&query=111+Triq+ix-Xatt+Sliema+Malta",
        "menu_lang": "en",
    },
}
ZONES = {"any", "indoor", "outdoor"}
OCCASIONS = {"couple", "friends", "family", "celebration", "group"}
STATUSES = {"new", "confirmed", "declined"}


class TableRequestIn(BaseModel):
    site: str
    date: str
    time: str
    guests: int = Field(ge=1, le=20)
    zone: str = "any"
    occasion: str = ""
    accessibility: bool = False
    name: str = Field(min_length=2, max_length=80)
    email: str = Field(min_length=5, max_length=120)
    phone: str = Field(default="", max_length=30)
    notes: str = Field(default="", max_length=500)
    lang: str = "it"

    @field_validator("site")
    @classmethod
    def _site(cls, v):
        if v not in SITES:
            raise ValueError("Sede non valida")
        return v

    @field_validator("date")
    @classmethod
    def _date(cls, v):
        d = date.fromisoformat(v)
        if d < date.today():
            raise ValueError("La data deve essere futura")
        return v

    @field_validator("time")
    @classmethod
    def _time(cls, v):
        datetime.strptime(v, "%H:%M")
        return v

    @field_validator("zone")
    @classmethod
    def _zone(cls, v):
        if v not in ZONES:
            raise ValueError("Zona non valida")
        return v

    @field_validator("occasion")
    @classmethod
    def _occasion(cls, v):
        if v and v not in OCCASIONS:
            raise ValueError("Occasione non valida")
        return v

    @field_validator("email")
    @classmethod
    def _email(cls, v):
        if "@" not in v or "." not in v.split("@")[-1]:
            raise ValueError("Email non valida")
        return v.strip()


class TableRequest(TableRequestIn):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    status: str = "new"
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


ZONE_LABEL = {"any": "Nessuna preferenza", "indoor": "Interno", "outdoor": "Esterno"}
OCCASION_LABEL = {"couple": "In coppia", "friends": "Con amici", "family": "In famiglia", "celebration": "Celebrazione", "group": "Gruppo", "": ""}


def request_rows(r: TableRequest) -> list[tuple[str, str]]:
    return [
        ("Sede", SITES[r.site]["name"]), ("Data", r.date), ("Ora", r.time), ("Coperti", str(r.guests)),
        ("Zona", ZONE_LABEL[r.zone]), ("Occasione", OCCASION_LABEL[r.occasion]),
        ("Accesso agevolato", "Sì" if r.accessibility else ""), ("Nome", r.name), ("Email", r.email),
        ("Telefono", r.phone), ("Note", r.notes), ("Lingua", r.lang), ("ID richiesta", r.id),
    ]


def whatsapp_url(r: TableRequest) -> str:
    site = SITES[r.site]
    lines = [f"Ciao {site['name']}! Richiesta tavolo dal sito:", f"📅 {r.date} ⏰ {r.time} 👥 {r.guests}",
             f"Zona: {ZONE_LABEL[r.zone]}" + (f" · {OCCASION_LABEL[r.occasion]}" if r.occasion else ""),
             f"Nome: {r.name}"]
    if r.notes:
        lines.append(f"Note: {r.notes}")
    lines.append(f"Rif. {r.id[:8]}")
    return f"https://wa.me/{site['whatsapp']}?text={quote(chr(10).join(lines))}"


def time_slots(site: str, day: str) -> dict:
    s = SITES[site]
    d = date.fromisoformat(day)
    if d.weekday() in s["closed_weekdays"]:
        return {"closed": True, "lunch": [], "dinner": []}

    def rng(a, b):
        h, m = map(int, a.split(":"))
        eh, em = map(int, b.split(":"))
        out = []
        while (h, m) <= (eh, em):
            out.append(f"{h:02d}:{m:02d}")
            m += 30
            if m == 60:
                h, m = h + 1, 0
        return out
    return {"closed": False, "lunch": rng(*s["lunch"]), "dinner": rng(*s["dinner"])}


class StatusUpdate(BaseModel):
    status: str

    @field_validator("status")
    @classmethod
    def _status(cls, v):
        if v not in STATUSES:
            raise ValueError("Stato non valido")
        return v


class ChatIn(BaseModel):
    session_id: str = Field(min_length=8, max_length=80)
    message: str = Field(min_length=1, max_length=1000)
    site: str = "malaga"
    lang: str = "it"


LANG_NAMES = {"it": "italiano", "en": "English", "es": "español", "de": "Deutsch", "fr": "français", "pt": "português"}


def build_system_prompt(site: str, lang: str, menu_items: list[dict], reviews_hint: str = "") -> str:
    s = SITES[site]
    other = SITES["malta" if site == "malaga" else "malaga"]
    by_cat: dict[str, list[str]] = {}
    for it in menu_items:
        name = it.get("name_it") if s["menu_lang"] == "it" else it.get("name_en")
        price = f"€{it['price']:.2f}" + (f"/€{it['price_max']:.2f}" if it.get("price_max") else "")
        by_cat.setdefault(it["category"], []).append(f"{name} {price}")
    menu_txt = "\n".join(f"- {cat}: " + "; ".join(v) for cat, v in by_cat.items())
    return f"""Sei "Kalamà ti aiuta", l'assistente virtuale del ristorante {s['name']} (fish street food italiano: calamari fritti, panini di mare, pasta, griglia).
Rispondi SEMPRE nella lingua dell'utente (lingua interfaccia: {LANG_NAMES.get(lang, 'italiano')}), in modo breve, caloroso e concreto (max 3-4 frasi). Niente markdown pesante: solo testo semplice, eventualmente elenchi brevi.

SEDE ATTUALE: {s['name']} — {s['address']}. Tel/WhatsApp {s['phone']}. Orari: {s['hours']}. Delivery: {s['delivery']}. {('Prenotazioni anche su ' + s['booking']) if s['booking'] else ''}
Mappa: {s['maps']}
ALTRA SEDE: {other['name']} — {other['address']}, orari {other['hours']}. Food truck Kalamà a Qawra/Buġibba (Malta).
Email: info@kalama.eu. Franchising: modulo sul sito, sezione Franchising.

MENU {s['name']} (prezzi in euro; una salsa inclusa con ogni piatto a Málaga):
{menu_txt}

REGOLE:
- Per prenotare un tavolo NON raccogliere tu i dati: invita a usare il pulsante "Richiedi un tavolo" (serve data, ora, numero di persone) e spiega che il team conferma via email/WhatsApp.
- Non inventare piatti, prezzi, orari o promozioni non presenti qui. Se non sai, dillo e suggerisci WhatsApp {s['phone']}.
- Allergie/intolleranze: invita a segnalarle nella richiesta tavolo o al personale; il menù è a base di pesce, fritti in olio e contiene glutine/latticini in molti piatti.
- Se chiedono l'altra sede, rispondi con le sue info e suggerisci di cambiare sede dal menu del sito.
{reviews_hint}"""
