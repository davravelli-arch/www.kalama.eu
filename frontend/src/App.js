import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Lenis from "lenis";
import axios from "axios";
import { Toaster } from "sonner";
import "@/App.css";
import { translations } from "@/i18n";
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
import Admin from "@/components/Admin";
import ReviewsPage from "@/components/ReviewsPage";
import { Reviews } from "@/components/Reviews";

function Landing({ t, lang, setLang }) {
  const [images, setImages] = useState({});

  useEffect(() => {
    const lenis = new Lenis({ autoRaf: true });
    return () => lenis.destroy();
  }, []);

  useEffect(() => {
    axios
      .get(`${process.env.REACT_APP_BACKEND_URL}/api/site-images`)
      .then((res) => setImages(res.data))
      .catch((e) => console.error(e));
  }, []);

  useEffect(() => {
    document.title = "Kalamà — Fish Street Food · Malaga & Malta";
  }, []);

  return (
    <div className="App font-body bg-cream text-ink">
      <Navbar t={t} lang={lang} setLang={setLang} />
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
      <WhatsAppFloat t={t} />
    </div>
  );
}

function App() {
  const [lang, setLangState] = useState(() => localStorage.getItem("kalama_lang") || "it");
  const setLang = (l) => { localStorage.setItem("kalama_lang", l); setLangState(l); };
  const t = translations[lang];
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing t={t} lang={lang} setLang={setLang} />} />
        <Route path="/recensioni" element={<ReviewsPage t={t} lang={lang} setLang={setLang} />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
      <Toaster position="bottom-left" richColors />
    </BrowserRouter>
  );
}

export default App;
