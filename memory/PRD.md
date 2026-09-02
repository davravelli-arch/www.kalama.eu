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
- [x] DATI REALI: Kalamà Malaga (Calle Trinidad Grund 7, Soho, 29001 Málaga · +34 610 755 695 · info@kalama.eu · Mar–Dom 12:00–23:30) e Kalamà Sliema (111 Triq ix-Xatt, Sliema SLM 3210, Malta · +356 7990 0819 · kalama.international@gmail.com · ogni giorno 12:00–23:00) + Food Truck Qawra/Buġibba
- [x] Sezione "Le Sedi" con card numerate, telefoni/email cliccabili, Google Maps, TheFork + Glovo (Malaga), Bolt Food (Sliema)
- [x] Foto reali (CDN myguide Malaga): hero panino al polpo, About, gallery, menu (Panino al Polpo, Shrimp Burger, Calamari, Salmone)
- [x] Social: Facebook facebook.com/therealfishstreetfood (verificato); Instagram kalama.seafood (DA CONFERMARE)
- [x] Rebrand KALAMA → KALAMÀ ovunque
- [x] Design award-level: hero cinetico (masked line reveal + parallasse + badge circolare rotante), manifesto numerato 01/02/03, marquee editoriale lento ink/lemon, KineticLines su tutti i titoli
- [x] Navbar sticky glassmorphism + switch lingua IT/EN + CTA "Ordina Ora" (→ #sedi)
- [x] Menu da DB (12 piatti, prezzi, tag, filtri categoria) — GET /api/menu
- [x] Franchising: pitch + benefit + form → POST /api/franchising (salvato in Mongo)
- [x] Contatti: quick-contact per entrambe le sedi + form → POST /api/contact (salvato in Mongo)
- [x] Verificato: curl menu OK, screenshot hero/about/menu/sedi/contatti OK

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
