import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, MapPin, CalendarDays, Phone, Instagram } from "lucide-react";
import { Logo } from "./Logo";
import { useSite, siteLocation } from "../lib/site";
import { socials } from "../locations";
import { WaIcon } from "./WhatsAppFloat";

export const SiteDrawer = ({ open, onClose, links }) => {
  const { t, site, setSite, openBooking } = useSite();
  const loc = siteLocation(site);
  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 z-[60] bg-ink/60" data-testid="drawer-backdrop" />
          <motion.aside
            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "tween", duration: 0.3 }}
            data-testid="site-drawer"
            className="fixed top-0 right-0 bottom-0 z-[70] w-[88vw] max-w-sm bg-cream border-l-2 border-ink shadow-hard flex flex-col overflow-y-auto"
          >
            <div className="flex items-center justify-between px-5 h-16 border-b-2 border-ink bg-white">
              <Logo variant="dark" className="h-8" testId="drawer-logo" />
              <button onClick={onClose} data-testid="drawer-close" aria-label="Chiudi" className="border-2 border-ink rounded-full p-2 bg-lemon btn-lift"><X className="w-5 h-5" /></button>
            </div>

            <nav className="px-5 py-5 flex flex-col gap-3 border-b-2 border-ink/10">
              {links.map((l) =>
                l.route ? (
                  <Link key={l.id} to={l.href} onClick={onClose} data-testid={`drawer-link-${l.id}`} className="font-display text-3xl text-ink hover:text-coral transition-colors">{l.label}</Link>
                ) : (
                  <a key={l.id} href={l.href} onClick={onClose} data-testid={`drawer-link-${l.id}`} className="font-display text-3xl text-ink hover:text-coral transition-colors">{l.label}</a>
                ),
              )}
            </nav>

            <div className="px-5 py-5 border-b-2 border-ink/10">
              <p className="text-xs font-bold uppercase tracking-widest text-ink/60 mb-2">{t.site.yourKalama}</p>
              <div data-testid="drawer-site-switch" className="inline-flex border-2 border-ink rounded-full bg-white p-1 shadow-hard-sm">
                {["malaga", "malta"].map((s) => (
                  <button key={s} onClick={() => setSite(s)} data-testid={`drawer-site-${s}`} className={`rounded-full px-4 py-1.5 font-display text-lg tracking-wide transition-colors ${site === s ? "bg-ink text-lemon" : "text-ink hover:bg-lemon"}`}>
                    {t.menu.locations[s]}
                  </button>
                ))}
              </div>
            </div>

            <div className="px-5 py-5 flex flex-col gap-3">
              <button onClick={() => { onClose(); openBooking(); }} data-testid="drawer-book-table" className="inline-flex items-center justify-center gap-2 bg-lemon text-ink border-2 border-ink rounded-full px-6 py-3 font-bold uppercase tracking-wide shadow-hard-sm btn-lift">
                <CalendarDays className="w-5 h-5" /> {t.site.bookTable}
              </button>
              <a href={loc.mapsUrl} target="_blank" rel="noreferrer" data-testid="drawer-directions" className="inline-flex items-center justify-center gap-2 bg-white text-ink border-2 border-ink rounded-full px-6 py-3 font-bold uppercase tracking-wide shadow-hard-sm btn-lift">
                <MapPin className="w-5 h-5" /> {t.site.directions}
              </a>
              <div className="grid grid-cols-3 gap-2 mt-2">
                <a href={`https://wa.me/${loc.whatsapp}`} target="_blank" rel="noreferrer" data-testid="drawer-whatsapp" className="flex flex-col items-center gap-1 border-2 border-ink rounded-2xl py-3 bg-[#25D366] text-white text-[11px] font-bold uppercase btn-lift"><WaIcon className="w-6 h-6" />WhatsApp</a>
                <a href={socials.instagram} target="_blank" rel="noreferrer" data-testid="drawer-instagram" className="flex flex-col items-center gap-1 border-2 border-ink rounded-2xl py-3 bg-white text-ink text-[11px] font-bold uppercase btn-lift"><Instagram className="w-6 h-6" />Instagram</a>
                <a href={loc.phoneHref} data-testid="drawer-call" className="flex flex-col items-center gap-1 border-2 border-ink rounded-2xl py-3 bg-ocean text-white text-[11px] font-bold uppercase btn-lift"><Phone className="w-6 h-6" />{t.site.call}</a>
              </div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>,
    document.body,
  );
};
