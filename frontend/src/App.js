import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import Lenis from "lenis";
import axios from "axios";
import { Toaster } from "sonner";
import "@/App.css";
import { translations } from "@/i18n";
import { SiteContext, useSite } from "@/lib/site";
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

function Landing() {
  const { t, lang } = useSite();
  const [images, setImages] = useState({});

  useEffect(() => {
    const lenis = new Lenis({ autoRaf: true });
    return () => lenis.destroy();
  }, []);

  useEffect(() => {
    axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/site-images`).then((res) => setImages(res.data)).catch((e) => console.error(e));
    document.title = "Kalamà — Fish Street Food · Malaga & Malta";
  }, []);

  return (
    <div className="App font-body bg-cream text-ink pb-16 lg:pb-0">
      <Navbar />
      <main>
        <Hero t={t} image={images.hero} />
        <Ticker t={t} />
        <About t={t} image={images.about} />
        <MenuSection t={t} lang={lang} />
        <Locations t={t} lang={lang} images={images} />
        <Gallery t={t} images={images.gallery} />
        <Reviews t={t} />
        <Franchising t={t} />
        <Contact t={t} />
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
  const [lang, setLangState] = useState(() => localStorage.getItem("kalama_lang") || "it");
  const [site, setSiteState] = useState(() => localStorage.getItem("kalama_site") || "");
  const [bookingOpen, setBookingOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);

  const setLang = (l) => { localStorage.setItem("kalama_lang", l); setLangState(l); };
  const setSite = (s) => { localStorage.setItem("kalama_site", s); setSiteState(s); };

  const ctx = {
    t: translations[lang], lang, setLang, site, setSite, bookingOpen, chatOpen, setChatOpen,
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
