import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import Lenis from "lenis";
import axios from "axios";
import { Toaster } from "sonner";
import "@/App.css";
import { translations } from "@/i18n";
import { SiteContext, useSite } from "@/lib/site";
import { applySettings } from "@/lib/settings";
import { getInitialLanguage } from "@/lib/language";
import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { Ticker } from "@/components/Ticker";
import { About } from "@/components/About";
import { MenuSection } from "@/components/MenuSection";
import { Locations } from "@/components/Locations";
import { Gallery } from "@/components/Gallery";
import { Franchising } from "@/components/Franchising";
import { Contact } from "@/components/Contact";
import { Footer } from "@/components/Footer";
import { WhatsAppFloat } from "@/components/WhatsAppFloat";
import { LocationGate } from "@/components/LocationGate";
import { BottomBar } from "@/components/BottomBar";
import { CookieBanner } from "@/components/CookieBanner";
import { ChatAssistant } from "@/components/ChatAssistant";
import { TableRequest } from "@/components/booking/TableRequest";
import { Reviews } from "@/components/Reviews";
import Admin from "@/components/Admin";
import ReviewsPage from "@/components/ReviewsPage";

const SEO = {
  it: { title: "Kalamà — Fish Street Food a Málaga e Sliema", description: "Pesce fresco, calamari fritti, panini di mare e pasta a Málaga e Sliema. Scopri menu, orari, delivery e prenotazioni Kalamà." },
  en: { title: "Kalamà — Fish Street Food in Málaga & Sliema", description: "Fresh fish, fried calamari, seafood sandwiches and pasta in Málaga and Sliema. Explore Kalamà menus, opening hours, delivery and table requests." },
  es: { title: "Kalamà — Fish Street Food en Málaga y Sliema", description: "Pescado fresco, calamares fritos, bocadillos de mar y pasta en Málaga y Sliema. Consulta menús, horarios, delivery y reservas Kalamà." },
  de: { title: "Kalamà — Fish Street Food in Málaga und Sliema", description: "Frischer Fisch, frittierte Calamari, Seafood-Sandwiches und Pasta in Málaga und Sliema. Menüs, Öffnungszeiten, Lieferung und Tischanfragen." },
  fr: { title: "Kalamà — Fish Street Food à Málaga et Sliema", description: "Poisson frais, calamars frits, sandwichs de la mer et pâtes à Málaga et Sliema. Menus, horaires, livraison et demandes de table Kalamà." },
  pt: { title: "Kalamà — Fish Street Food em Málaga e Sliema", description: "Peixe fresco, lulas fritas, sanduíches do mar e massa em Málaga e Sliema. Menus, horários, entrega e pedidos de mesa Kalamà." },
};

function Landing() {
  const { t, lang, site } = useSite();
  const [images, setImages] = useState({});
  const heroVideo = images[`hero-video-${site}`] || "";

  useEffect(() => {
    const lenis = new Lenis({ autoRaf: true });
    return () => lenis.destroy();
  }, []);

  useEffect(() => {
    axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/site-images`).then((res) => setImages(res.data)).catch((e) => console.error(e));
  }, []);

  return (
    <div className="App font-body bg-cream text-ink pb-16 lg:pb-0">
      <Navbar />
      <main>
        <Hero t={t} image={images[`hero-${site}`] || images.hero} video={heroVideo} />
        <Ticker t={t} />
        <About t={t} image={images.about} images={images} />
        <MenuSection t={t} lang={lang} siteImages={images} />
        <Locations t={t} lang={lang} images={images} />
        <Gallery t={t} images={images.gallery} siteImages={images} />
        <Reviews t={t} siteImages={images} />
        <Franchising t={t} images={images} />
        <Contact t={t} images={images} />
      </main>
      <Footer t={t} />
    </div>
  );
}

function PublicShell({ children }) {
  const { t, site } = useSite();
  return (
    <>
      {children}
      <AnimatePresence>{!site && <LocationGate />}</AnimatePresence>
      {site && (
        <>
          <BottomBar />
          <WhatsAppFloat t={t} />
          <ChatAssistant />
          <TableRequest />
          <CookieBanner />
        </>
      )}
    </>
  );
}

function App() {
  const [lang, setLangState] = useState(getInitialLanguage);
  const [site, setSiteState] = useState(() => localStorage.getItem("kalama_site") || "");
  const [bookingOpen, setBookingOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/site-settings`).then((r) => { applySettings(r.data); setSettings(r.data); }).catch(() => setSettings({}));
  }, []);

  useEffect(() => {
    const seo = SEO[lang] || SEO.en;
    document.documentElement.lang = lang;
    document.title = seo.title;
    document.querySelector('meta[name="description"]')?.setAttribute("content", seo.description);
    document.querySelector('meta[property="og:title"]')?.setAttribute("content", seo.title);
    document.querySelector('meta[property="og:description"]')?.setAttribute("content", seo.description);
  }, [lang]);

  const setLang = (l) => { localStorage.setItem("kalama_lang", l); setLangState(l); };
  const setSite = (s) => { localStorage.setItem("kalama_site", s); setSiteState(s); };

  const ctx = {
    t: translations[lang], lang, setLang, site, setSite, bookingOpen, chatOpen, setChatOpen, settings,
    openBooking: () => setBookingOpen(true), closeBooking: () => setBookingOpen(false),
  };

  return (
    <SiteContext.Provider value={ctx}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<PublicShell><Landing /></PublicShell>} />
          <Route path="/recensioni" element={<PublicShell><ReviewsPage t={ctx.t} lang={lang} setLang={setLang} /></PublicShell>} />
          <Route path="/admin" element={<Admin />} />
        </Routes>
        <Toaster position="bottom-left" richColors />
      </BrowserRouter>
    </SiteContext.Provider>
  );
}

export default App;
