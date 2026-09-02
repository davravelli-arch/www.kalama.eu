import { motion, useScroll, useTransform } from "framer-motion";
import { Phone, ArrowDown } from "lucide-react";
import { imgUrl } from "../lib/img";

const EASE = [0.22, 1, 0.36, 1];

const DEFAULT_IMG = "https://images.myguide-cdn.com/malaga/companies/kalama-malaga-seafood-bar/large/kalama-malaga-seafood-bar-1-7495721.jpg";

export const Hero = ({ t, image }) => {
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 900], [0, 180]);
  const colors = ["text-cream", "text-coral", "text-lemon"];

  return (
    <section id="top" data-testid="hero-section" className="relative min-h-[100svh] flex items-end overflow-hidden">
      <motion.img
        style={{ y }}
        src={imgUrl(image) || DEFAULT_IMG}
        data-testid="hero-image"
        alt="Kalamà calamari fritti"
        className="absolute inset-0 w-full h-[115%] object-cover"
      />
      <div className="absolute inset-0 bg-ink/55" />

      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-8 pb-24 pt-44">
        <motion.span
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: EASE }}
          data-testid="hero-badge"
          className="inline-block bg-lemon border-2 border-ink rounded-full px-5 py-2 text-xs font-bold uppercase tracking-widest text-ink shadow-hard-sm"
        >
          {t.hero.badge}
        </motion.span>

        <h1 className="font-display leading-[0.88] mt-8 text-7xl sm:text-8xl lg:text-[11rem]">
          {t.hero.titles.map((line, i) => (
            <span key={i} className="block overflow-hidden pb-1">
              <motion.span
                className={`block ${colors[i % colors.length]}`}
                initial={{ y: "110%" }}
                animate={{ y: 0 }}
                transition={{ delay: 0.25 + i * 0.14, duration: 1, ease: EASE }}
              >
                {line}
              </motion.span>
            </span>
          ))}
        </h1>

        <motion.p
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.85, duration: 0.7, ease: EASE }}
          data-testid="hero-subtitle"
          className="text-cream/90 text-base sm:text-lg max-w-xl mt-6 font-medium"
        >
          {t.hero.subtitle}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.05, duration: 0.7, ease: EASE }}
          className="flex flex-wrap gap-4 mt-10"
        >
          <a
            href="#sedi"
            data-testid="hero-call-cta"
            className="inline-flex items-center gap-2 bg-coral text-ink border-2 border-ink rounded-full px-8 py-4 font-bold uppercase tracking-wide shadow-hard btn-lift"
          >
            <Phone className="w-5 h-5" />
            {t.hero.ctaCall}
          </a>
          <a
            href="#menu"
            data-testid="hero-menu-cta"
            className="inline-flex items-center gap-2 bg-cream text-ink border-2 border-ink rounded-full px-8 py-4 font-bold uppercase tracking-wide shadow-hard btn-lift"
          >
            <ArrowDown className="w-5 h-5" />
            {t.hero.ctaMenu}
          </a>
        </motion.div>
      </div>

      <div className="absolute right-10 bottom-28 z-10 hidden lg:block animate-spin-slow" aria-hidden="true">
        <svg width="150" height="150" viewBox="0 0 150 150">
          <defs>
            <path id="hero-circle" d="M75,75 m-56,0 a56,56 0 1,1 112,0 a56,56 0 1,1 -112,0" />
          </defs>
          <text className="fill-cream font-display" fontSize="14.5" letterSpacing="4">
            <textPath href="#hero-circle">KALAMÀ · MALAGA · SLIEMA · STREET FOOD ·</textPath>
          </text>
        </svg>
      </div>
    </section>
  );
};
