# PRD — Kalama.eu

## Original Problem Statement
"Vorrei creare il mio sito web. Www.kalama.eu"
Chiarimenti utente: Kalama è un ristorante di pesce fast food e take away. Sezioni richieste: Chi siamo, Servizi/Prodotti, Galleria foto, Modulo di contatto, Franchising. Stile: colorato e vivace. Lingua: multilingue.

## Architecture
- Frontend: React (CRA + craco), Tailwind, shadcn/ui, framer-motion, react-fast-marquee, lenis — /app/frontend
- Backend: FastAPI + Motor (MongoDB async) — /app/backend/server.py
- DB: MongoDB via MONGO_URL/DB_NAME — collections: menu_items (12 piatti seed, campi IT/EN), messages (type: contact | franchising)

## User Personas
- Cliente finale: consulta menu, chiama per take away, scrive dal form contatti
- Potenziale franchisee: legge i vantaggi e invia richiesta dal form dedicato
- Visitatore internazionale: cambia lingua IT/EN dal selettore

## Core Requirements (statici)
1. Sito vetrina one-page multilingue (IT default, EN)
2. Menu dinamico con filtri per categoria (Poké, Fish Burger, Fritti, Dal Mare)
3. Galleria fotografica in marquee
4. Sezione Franchising con form di richiesta
5. Form contatti + mappa + CTA telefonica take away
6. Stile "Vibrant Play": coral #FF6B6B, ocean #0055FF, lemon #FFD166, Bebas Neue + Outfit, bordi 2px ink, hard shadow

## Implemented (2026-07)
- [x] Navbar sticky glassmorphism + switch lingua IT/EN + CTA "Ordina Ora" (tel:)
- [x] Hero full-screen con tipografia gigante e CTA
- [x] Ticker marquee "Pesce fresco • Fast food • Take away"
- [x] Chi Siamo asimmetrico con stat pill animate
- [x] Menu da DB (12 piatti, prezzi, tag, filtri categoria) — GET /api/menu
- [x] Galleria marquee con 8 foto coerenti col brand
- [x] Franchising: pitch + benefit + form → POST /api/franchising (salvato in Mongo)
- [x] Contatti: info, mappa OpenStreetMap, form → POST /api/contact (salvato in Mongo)
- [x] Footer con brand typography gigante + social
- [x] Smooth scrolling (lenis), animazioni framer-motion, toast sonner
- [x] Verificato: API health/menu/contact/franchising via curl; screenshot di tutte le sezioni; switch EN; submit contatto con toast; filtro menu

## Backlog
### P0
- Dati reali: indirizzo, telefono, email, orari, foto reali del locale (ora placeholder: Via del Porto 21 Trieste, +39 040 123 4567)
### P1
- Notifica email (Resend) su ogni richiesta contatto/franchising
- Più lingue (DE/FR) — l'utente ha chiesto "multilingue"
- Pannello admin: gestione menu (CRUD) e lettura messaggi ricevuti
### P2
- Pulsante ordine WhatsApp
- Ordini take away online con pagamento (Stripe)
- SEO: meta OG, sitemap, collegamento dominio kalama.eu

## Next Tasks
1. Sostituire contatti/foto placeholder con contenuti reali del ristorante
2. Integrazione Resend per notifiche email form
3. Aggiungere DE/FR al language switcher
4. Admin panel menu + inbox messaggi
