import { useEffect, useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { MapPin, Globe } from "lucide-react";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "./ui/dropdown-menu";
import { Logo } from "./Logo";
import { useSite } from "../lib/site";
import { imgUrl } from "../lib/img";
import { locations } from "../locations";

const LANGS = [["it", "Italiano"], ["en", "English"], ["es", "Español"], ["de", "Deutsch"], ["fr", "Français"], ["pt", "Português"]];

const CARDS = [
  { id: "malaga", city: "Málaga", tagKey: "malagaTag", imgKey: "location-malaga", fallback: locations[0].image },
  { id: "malta", city: "Sliema", tagKey: "maltaTag", imgKey: "location-sliema", fallback: locations[1].image },
];

export const LocationGate = () => {
  const { t, lang, setLang, setSite } = useSite();
  const [images, setImages] = useState({});
  useEffect(() => {
    axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/site-images`).then((r) => setImages(r.data)).catch(() => {});
  }, []);
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      data-testid="location-gate"
      className="fixed inset-0 z-[100] bg-lemon overflow-y-auto"
    >
      <div className="min-h-full flex flex-col items-center justify-center px-4 py-10 sm:py-16">
        <div className="w-full max-w-3xl flex items-center justify-between gap-4 mb-8">
          <Logo variant="dark" className="h-12 sm:h-14" testId="gate-logo" />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button data-testid="gate-lang-switcher" className="flex items-center gap-2 border-2 border-ink rounded-full px-4 py-2 bg-cream font-bold text-sm uppercase shadow-hard-sm btn-lift">
                <Globe className="w-5 h-5" />
                {LANGS.find(([c]) => c === lang)?.[1] || lang}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="border-2 border-ink z-[110]">
              {LANGS.map(([code, label]) => (
                <DropdownMenuItem key={code} data-testid={`gate-lang-option-${code}`} onClick={() => setLang(code)} className={`font-semibold cursor-pointer ${lang === code ? "text-coral" : ""}`}>
                  {label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="w-full max-w-3xl bg-cream border-2 border-ink rounded-3xl p-6 sm:p-8 shadow-hard">
          <span className="text-ocean font-bold uppercase tracking-widest text-xs sm:text-sm">{t.site.gateKicker}</span>
          <h1 data-testid="gate-title" className="font-display text-4xl sm:text-5xl lg:text-6xl text-ink leading-[0.95] mt-2">{t.site.gateTitle}</h1>
          <p className="text-sm sm:text-base font-medium text-ink/70 mt-3 max-w-xl">{t.site.gateSub}</p>
        </div>
        <div className="mt-6 w-full max-w-3xl grid sm:grid-cols-2 gap-5">
          {CARDS.map((c, i) => (
            <motion.button
              key={c.id}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + i * 0.1 }}
              onClick={() => setSite(c.id)}
              data-testid={`gate-choose-${c.id}`}
              className="group relative text-left border-2 border-ink rounded-3xl overflow-hidden shadow-hard btn-lift h-64 sm:h-72"
            >
              <img src={imgUrl(images[c.imgKey]) || c.fallback} alt={c.city} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/40 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-6">
                <span className="text-lemon font-bold uppercase tracking-widest text-xs">{t.site[c.tagKey]}</span>
                <p className="font-display text-5xl sm:text-6xl text-cream leading-none mt-1">{c.city}</p>
                <span className="mt-4 inline-flex items-center gap-2 bg-lemon text-ink border-2 border-ink rounded-full px-5 py-2 font-bold text-sm uppercase tracking-wide shadow-hard-sm">
                  <MapPin className="w-4 h-4" /> {t.site.choose} {c.city}
                </span>
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    </motion.div>
  );
};
