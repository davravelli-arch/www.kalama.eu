from datetime import date, datetime, timezone
from html import escape
from typing import Optional
from urllib.parse import quote
import uuid

from pydantic import BaseModel, Field, field_validator

SITES = {
    "malaga": {
        "name": "Kalamà Málaga", "address": "Calle Trinidad Grund 7, Soho, 29001 Málaga", "email": "info@kalama.eu",
        "phone": "+34 610 755 695", "whatsapp": "34610755695", "hours": "Mar–Dom 12:00–16:00 e 20:00–23:30 (lunedì chiuso)",
        "closed_weekdays": [0], "lunch": ("12:00", "15:30"), "dinner": ("20:00", "23:00"),
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


def whatsapp_url(r: TableRequest, site: dict | None = None) -> str:
    site = site or SITES[r.site]
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


GUEST_MAIL = {
    "it": dict(confirmed_subject="Tavolo confermato · {site}", confirmed="Ciao {name}, il tuo tavolo è confermato!", declined_subject="Richiesta tavolo · {site}", declined="Ciao {name}, purtroppo non possiamo confermare il tavolo richiesto.", details="Dettagli della richiesta", date="Data", time="Ora", guests="Coperti", notes="Note", alt="Scrivici su WhatsApp per trovare insieme un'alternativa:", see="Ti aspettiamo! Indicazioni:", footer="Kalamà · The real fish street food"),
    "en": dict(confirmed_subject="Table confirmed · {site}", confirmed="Hi {name}, your table is confirmed!", declined_subject="Table request · {site}", declined="Hi {name}, unfortunately we can't confirm the requested table.", details="Request details", date="Date", time="Time", guests="Guests", notes="Notes", alt="Message us on WhatsApp to find an alternative together:", see="See you soon! Directions:", footer="Kalamà · The real fish street food"),
    "es": dict(confirmed_subject="Mesa confirmada · {site}", confirmed="Hola {name}, ¡tu mesa está confirmada!", declined_subject="Solicitud de mesa · {site}", declined="Hola {name}, lamentablemente no podemos confirmar la mesa solicitada.", details="Detalles de la solicitud", date="Fecha", time="Hora", guests="Comensales", notes="Notas", alt="Escríbenos por WhatsApp para buscar juntos una alternativa:", see="¡Te esperamos! Cómo llegar:", footer="Kalamà · The real fish street food"),
    "de": dict(confirmed_subject="Tisch bestätigt · {site}", confirmed="Hallo {name}, dein Tisch ist bestätigt!", declined_subject="Tischanfrage · {site}", declined="Hallo {name}, leider können wir den angefragten Tisch nicht bestätigen.", details="Details der Anfrage", date="Datum", time="Uhrzeit", guests="Personen", notes="Hinweise", alt="Schreib uns per WhatsApp, um gemeinsam eine Alternative zu finden:", see="Wir freuen uns auf dich! Anfahrt:", footer="Kalamà · The real fish street food"),
    "fr": dict(confirmed_subject="Table confirmée · {site}", confirmed="Bonjour {name}, votre table est confirmée !", declined_subject="Demande de table · {site}", declined="Bonjour {name}, malheureusement nous ne pouvons pas confirmer la table demandée.", details="Détails de la demande", date="Date", time="Heure", guests="Couverts", notes="Notes", alt="Écrivez-nous sur WhatsApp pour trouver une alternative ensemble :", see="À très vite ! Itinéraire :", footer="Kalamà · The real fish street food"),
    "pt": dict(confirmed_subject="Mesa confirmada · {site}", confirmed="Olá {name}, a tua mesa está confirmada!", declined_subject="Pedido de mesa · {site}", declined="Olá {name}, infelizmente não conseguimos confirmar a mesa pedida.", details="Detalhes do pedido", date="Data", time="Hora", guests="Pessoas", notes="Notas", alt="Escreve-nos no WhatsApp para encontrarmos juntos uma alternativa:", see="Até já! Como chegar:", footer="Kalamà · The real fish street food"),
}


def guest_email(r: dict, status: str) -> tuple[str, str]:
    m = GUEST_MAIL.get(r.get("lang"), GUEST_MAIL["en"])
    site = SITES[r["site"]]
    subject = m[f"{status}_subject"].format(site=site["name"])
    intro = m[status].format(name=escape(r["name"]))
    rows = [(m["date"], r["date"]), (m["time"], r["time"]), (m["guests"], str(r["guests"]))]
    if r.get("notes"):
        rows.append((m["notes"], r["notes"]))
    rows_html = "".join(f'<tr><td style="padding:6px 12px 6px 0;color:#666">{escape(k)}</td><td style="padding:6px 0;font-weight:bold">{escape(v)}</td></tr>' for k, v in rows)
    wa = f"https://wa.me/{site['whatsapp']}"
    cta = (f'<p style="margin:20px 0 6px">{m["see"]}</p><a href="{site["maps"]}" style="display:inline-block;background:#FCC617;color:#1D1D1B;font-weight:bold;padding:12px 22px;border-radius:999px;text-decoration:none;border:2px solid #1D1D1B">{escape(site["address"])}</a>'
           if status == "confirmed" else
           f'<p style="margin:20px 0 6px">{m["alt"]}</p><a href="{wa}" style="display:inline-block;background:#25D366;color:#fff;font-weight:bold;padding:12px 22px;border-radius:999px;text-decoration:none;border:2px solid #1D1D1B">WhatsApp {escape(site["phone"])}</a>')
    html = (
        '<table role="presentation" width="100%" style="font-family:Arial,sans-serif;color:#1D1D1B"><tr><td style="padding:28px">'
        f'<h2 style="margin:0 0 6px;color:#1D1D1B">{escape(site["name"])}</h2>'
        f'<p style="font-size:18px;margin:0 0 18px">{intro}</p>'
        f'<p style="font-size:12px;text-transform:uppercase;letter-spacing:.1em;color:#888;margin:0 0 4px">{m["details"]}</p>'
        f'<table style="border-collapse:collapse">{rows_html}</table>{cta}'
        f'<p style="font-size:12px;color:#888;margin-top:28px">{m["footer"]} · {escape(site["address"])} · {escape(site["phone"])}</p>'
        "</td></tr></table>"
    )
    return subject, html


REMINDER = {
    "it": ("Promemoria: oggi il tuo tavolo · {site}", "Ciao {name}, ti ricordiamo il tuo tavolo di oggi alle {time} per {guests} persone. Ti aspettiamo!", "Per qualsiasi cambio scrivici su WhatsApp:"),
    "en": ("Reminder: your table today · {site}", "Hi {name}, a quick reminder of your table today at {time} for {guests} guests. See you soon!", "For any change, message us on WhatsApp:"),
    "es": ("Recordatorio: hoy tu mesa · {site}", "Hola {name}, te recordamos tu mesa de hoy a las {time} para {guests} personas. ¡Te esperamos!", "Para cualquier cambio, escríbenos por WhatsApp:"),
    "de": ("Erinnerung: heute dein Tisch · {site}", "Hallo {name}, kleine Erinnerung an deinen Tisch heute um {time} für {guests} Personen. Bis bald!", "Bei Änderungen schreib uns per WhatsApp:"),
    "fr": ("Rappel : votre table aujourd'hui · {site}", "Bonjour {name}, petit rappel de votre table aujourd'hui à {time} pour {guests} personnes. À très vite !", "Pour tout changement, écrivez-nous sur WhatsApp :"),
    "pt": ("Lembrete: a tua mesa hoje · {site}", "Olá {name}, lembramos a tua mesa de hoje às {time} para {guests} pessoas. Até já!", "Para qualquer alteração, escreve-nos no WhatsApp:"),
}


def reminder_email(r: dict) -> tuple[str, str]:
    subj, intro, wa_txt = REMINDER.get(r.get("lang"), REMINDER["en"])
    m = GUEST_MAIL.get(r.get("lang"), GUEST_MAIL["en"])
    site = SITES[r["site"]]
    html = (
        '<table role="presentation" width="100%" style="font-family:Arial,sans-serif;color:#1D1D1B"><tr><td style="padding:28px">'
        f'<h2 style="margin:0 0 6px;color:#1D1D1B">{escape(site["name"])}</h2>'
        f'<p style="font-size:18px;margin:0 0 18px">{escape(intro.format(name=r["name"], time=r["time"], guests=r["guests"]))}</p>'
        f'<p style="margin:0 0 6px">{m["see"]}</p>'
        f'<a href="{site["maps"]}" style="display:inline-block;background:#FCC617;color:#1D1D1B;font-weight:bold;padding:12px 22px;border-radius:999px;text-decoration:none;border:2px solid #1D1D1B">{escape(site["address"])}</a>'
        f'<p style="margin:20px 0 6px">{escape(wa_txt)}</p>'
        f'<a href="https://wa.me/{site["whatsapp"]}" style="display:inline-block;background:#25D366;color:#fff;font-weight:bold;padding:12px 22px;border-radius:999px;text-decoration:none;border:2px solid #1D1D1B">WhatsApp {escape(site["phone"])}</a>'
        f'<p style="font-size:12px;color:#888;margin-top:28px">{m["footer"]} · {escape(site["address"])} · {escape(site["phone"])}</p>'
        "</td></tr></table>"
    )
    return subj.format(site=site["name"]), html


class ChatIn(BaseModel):
    session_id: str = Field(min_length=8, max_length=80)
    message: str = Field(min_length=1, max_length=1000)
    site: str = "malaga"
    lang: str = "it"


LANG_NAMES = {"it": "italiano", "en": "English", "es": "español", "de": "Deutsch", "fr": "français", "pt": "português"}


def build_system_prompt(site: str, lang: str, menu_items: list[dict], reviews_hint: str = "", sites: dict | None = None) -> str:
    sites = sites or SITES
    s = sites[site]
    other = sites["malta" if site == "malaga" else "malaga"]
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
