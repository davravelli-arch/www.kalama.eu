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
- P2: Link diretto Glovo Málaga (ora punta alla home Glovo Málaga, listing diretto non trovato pubblicamente)
- P2: Il titolare carica dal pannello /admin → Foto del sito le foto reali per Chi Siamo, sede Málaga, sede Sliema, food truck (ora fallback foto Kalamà da myguide)
- P2: Il titolare carica dal pannello /admin → Menu le foto dei piatti mancanti (ora placeholder con logo)
- P1: Ricevere GOOGLE_PLACES_API_KEY dall'utente → aggiungere a backend/.env, restart backend, impostare Place ID dal pannello
- P1: L'utente inserisce le prime recensioni curate dal pannello (DB reviews vuoto)
- P2: Modifica orari/sedi anche dal pannello admin (ora solo menu)
- P3: SEO multilingua (hreflang, meta per lingua), sitemap

## Aggiornamento 02/06/2026 — Menù reali per sede, logo ufficiale, upload foto
- Menu riseedato da PDF/immagine ufficiali forniti dal titolare: 105 voci (Málaga 61 in italiano, Malta/Sliema 44 in inglese) con campo `location`, `price_max` per calice/bottiglia, categorie cucina/pasta/fritti/grill/insalate/panini/dolci/salse/bevande/birre/vini/cocktail/caffe. Seed versionato con `MENU_VERSION` in `/app/backend/menu_data.py` (cambiare versione = reseed completo, attenzione: cancella modifiche admin).
- Sezione Menu: selettore Málaga / Malta, filtri dinamici per sede, bevande in liste compatte, piatti senza foto mostrano placeholder con logo (foto stock Unsplash rimosse su richiesta: "le foto sono tutte sbagliate").
- Logo ufficiale estratto dal PDF vettoriale in SVG: `/frontend/public/brand/logo-dark.svg`, `logo-yellow.svg`, `mark-dark.svg`, `mark-yellow.svg`, favicon. Colori esatti: giallo #FCC617, nero #1D1D1B; accento blu #2F6F9F (scelta utente), CTA ambra #F5A800.
- Upload foto (Emergent Object Storage): `POST /api/admin/upload` → `/api/files/{path}` pubblico con cache; pannello admin con tab "Menu" (foto per piatto, sede, 2° prezzo) e "Foto del sito" (hero, chi siamo, sedi, food truck, galleria). Collection `site_images`, `files`. Frontend ridimensiona lato client a max 1600px prima dell'upload.
- Foto reali già caricate dal cliente: cono di calamari fritti (hero + Calamari fritti grandi in entrambe le sedi + galleria), calamari e gamberi alla griglia (spiedini calamari e gamberi + galleria).
- Test: iteration_2 → 28 test backend + E2E frontend tutti verdi (/app/test_reports/iteration_2.json).
- Nota: il video CCTV caricato (2024-08-25-15-43-14.mp4) non è stato usato, sembra un upload accidentale.

## Aggiornamento 04/06/2026 — Recensioni clienti
- Sezione "Dicono di noi" in home (nascosta finché non ci sono recensioni; mostra fino a 6 "in evidenza") + pagina `/recensioni` con tutte le recensioni e filtro per sede. Link "Recensioni" in navbar (route); gli anchor della navbar diventano `/#sezione` fuori dalla home. Lingua ora globale in App con persistenza `localStorage.kalama_lang`.
- Admin tab "Recensioni": CRUD recensioni curate (autore, stelle, testo, sede, fonte Google/TripAdvisor/TheFork/Facebook/altro, data, in evidenza). Collection `reviews`.
- Google Reviews automatiche (Places API New): endpoint `GET /api/reviews/google?lang=` con cache in memoria 30 min, attivo solo se `GOOGLE_PLACES_API_KEY` è in backend/.env e i Place ID sono salvati dal pannello (sezione "Google Reviews (automatiche)", con ricerca Place ID). Limite Google: 5 recensioni per sede in ordine di rilevanza. Card con attribuzione autore, link Google Maps e "Segnala" come richiesto dalle policy Google. STATO: chiave NON ancora fornita dall'utente → sezione Google disattivata (enabled:false), il resto funziona.
- Test: iteration_4 → 24 test backend + E2E frontend/admin tutti verdi.
- Login admin: aggiunti toggle mostra/nascondi password e trim (iteration_3 verde); l'utente aveva sbagliato la digitazione.
