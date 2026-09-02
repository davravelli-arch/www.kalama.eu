import { motion } from "framer-motion";
import { Phone, ArrowDown, Fish } from "lucide-react";

export const Hero = ({ t }) => {
  return (
    <section id="top" data-testid="hero-section" className="relative min-h-[100svh] flex items-end overflow-hidden">
      <img
        src="https://images.unsplash.com/photo-1771875600033-ad2a71d3fe98?q=80&w=1800&auto=format&fit=crop"
        alt="Kalama fish burger"
        className="absolute inset-0 w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-ink/60" />

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-8 pb-20 pt-40"
      >
        <span
          data-testid="hero-badge"
          className="inline-flex items-center gap-2 bg-lemon border-2 border-ink rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-ink shadow-hard-sm animate-float"
        >
          <Fish className="w-4 h-4" />
          {t.hero.badge}
        </span>

        <h1 className="font-display text-cream leading-[0.9] mt-6 text-7xl sm:text-8xl lg:text-[10rem]">
          {t.hero.title1}
          <br />
          <span className="text-coral">{t.hero.title2}</span>
          <br />
          <span className="text-lemon">{t.hero.title3}</span>
        </h1>

        <p data-testid="hero-subtitle" className="text-cream/90 text-base sm:text-lg max-w-xl mt-6 font-medium">
          {t.hero.subtitle}
        </p>

        <div className="flex flex-wrap gap-4 mt-10">
          <a
            href="tel:+390401234567"
            data-testid="hero-call-cta"
            className="inline-flex items-center gap-2 bg-coral text-white border-2 border-ink rounded-full px-8 py-4 font-bold uppercase tracking-wide shadow-hard btn-lift"
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
        </div>
      </motion.div>
    </section>
  );
};
