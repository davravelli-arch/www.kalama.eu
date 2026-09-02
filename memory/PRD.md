# PRD — Kalamà Fish Street Food (kalama.eu)

## Problema originale
Sito web colorato e vivace per "Kalamà", seafood fast food / takeaway / ristorante con sedi a Málaga (Calle Trinidad Grund 7, Soho — +34 610 755 695, info@kalama.eu, Mar–Dom 12:00–23:30) e Sliema, Malta (111 Triq ix-Xatt — +356 7990 0819, kalama.international@gmail.com, tutti i giorni 12:00–23:00), più food truck a Qawra/Buġibba. Sezioni: Chi Siamo, Menu, Sedi, Galleria, Franchising, Contatti. Multilingua: IT, EN, ES, DE, FR, PT. Notifiche form a info@kalama.eu. Pulsante WhatsApp. Pannello admin con password per gestione contenuti in autonomia.

## Personas
- Cliente/turista che vuole vedere menu, sedi, ordinare via WhatsApp/Glovo/Bolt/TheFork
- Potenziale franchisee che invia richiesta
- Titolare (admin) che aggiorna menu e prezzi dal pannello

## Architettura
- Frontend: React 19 + Tailwind + Framer Motion + Lenis + react-fast-marquee; router con route `/` (landing) e `/admin` (pannello)
- Backend: FastAPI + MongoDB (motor), route sotto `/api`
- Design: "Vibrant Play" — coral/ocean/lemon, Bebas Neue + Outfit, stile neo-brutalist (bordi ink, shadow-hard)
- i18n: file `/app/frontend/src/i18n.js` con 6 lingue complete; dati sedi in `/app/frontend/src/locations.js` (fallback EN per kind/hours)
- Email: proxy gestito Emergent (EMERGENT_EMAIL_KEY in backend/.env), notifiche a NOTIFY_EMAIL=info@kalama.eu
- Auth admin: password singola in .env (ADMIN_PASSWORD), JWT 12h (JWT_SECRET), lockout 5 tentativi/15 min per IP

## Implementato
- 2026-09: Landing completa 6 lingue (IT/EN/ES/DE/FR/PT) con switcher in navbar
- 2026-09: Menu reale TheFork 2026 — 26 piatti, 7 categorie (cucina, pasta, fritti, grill, insalate, panini, dolci), nomi IT + descrizioni IT/EN (fallback EN per altre lingue, scelta utente)
- 2026-09: Notifiche email a info@kalama.eu per form Contatti e Franchising (verificato HTTP 202 dal servizio; consegna inbox non verificabile dai test)
- 2026-09: Pulsante WhatsApp flottante con scelta sede → wa.me/34610755695 (Málaga) e wa.me/35679900819 (Sliema)
- 2026-09: Pannello admin `/admin` con password: lista piatti, crea/modifica/elimina, anteprima immagine; link "Area Admin" nel footer
- 2026-09: Sedi reali con foto vere, telefono, Maps, TheFork, Glovo, Bolt Food; card food truck
- Test: suite pytest backend (13 test) + E2E frontend completi, tutto verde

## Credenziali
- Admin: password `KalamaMare2026!` su /admin (vedi /app/memory/test_credentials.md)

## Backlog prioritizzato
- P1: Verifica da parte del titolare che le email arrivino davvero nella casella info@kalama.eu (inviare un form di test e controllare)
- P1: Il titolare valida prezzi/piatti del menu reale (fonte pubblica TheFork 2026)
- P2: Link diretto Glovo Málaga (ora punta alla home Glovo Málaga, listing diretto non trovato pubblicamente)
- P2: Foto reali anche per Sliema/food truck (ora immagini stock)
- P2: Modifica orari/sedi anche dal pannello admin (ora solo menu)
- P3: SEO multilingua (hreflang, meta per lingua), sitemap
