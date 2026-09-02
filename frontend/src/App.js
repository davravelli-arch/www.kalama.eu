import { useEffect, useState } from "react";
import Lenis from "lenis";
import { Toaster } from "sonner";
import "@/App.css";
import { translations } from "@/i18n";
import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { Ticker } from "@/components/Ticker";
import { About } from "@/components/About";
import { MenuSection } from "@/components/MenuSection";
import { Gallery } from "@/components/Gallery";
import { Franchising } from "@/components/Franchising";
import { Contact } from "@/components/Contact";
import { Footer } from "@/components/Footer";

function App() {
  const [lang, setLang] = useState("it");
  const t = translations[lang];

  useEffect(() => {
    const lenis = new Lenis({ autoRaf: true });
    return () => lenis.destroy();
  }, []);

  useEffect(() => {
    document.title = "Kalama — Fish Fast Food & Take Away";
  }, []);

  return (
    <div className="App font-body bg-cream text-ink">
      <Navbar t={t} lang={lang} setLang={setLang} />
      <main>
        <Hero t={t} />
        <Ticker t={t} />
        <About t={t} />
        <MenuSection t={t} lang={lang} />
        <Gallery t={t} />
        <Franchising t={t} />
        <Contact t={t} />
      </main>
      <Footer t={t} />
      <Toaster position="bottom-right" richColors />
    </div>
  );
}

export default App;
