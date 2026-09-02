import { Fish, Instagram, Facebook } from "lucide-react";

export const Footer = ({ t }) => {
  return (
    <footer data-testid="main-footer" className="bg-ink border-t-2 border-ink pt-16 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        <div className="flex flex-wrap items-center justify-between gap-6 pb-12">
          <div className="flex items-center gap-3">
            <span className="bg-coral border-2 border-cream rounded-full p-2">
              <Fish className="w-6 h-6 text-white" strokeWidth={2.5} />
            </span>
            <span className="text-cream font-bold uppercase tracking-widest text-sm">{t.footer.tagline}</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-cream/60 text-xs font-bold uppercase tracking-widest">{t.footer.follow}</span>
            <a href="https://instagram.com" target="_blank" rel="noreferrer" data-testid="footer-instagram" className="bg-lemon border-2 border-cream rounded-full p-2.5 btn-lift">
              <Instagram className="w-5 h-5 text-ink" />
            </a>
            <a href="https://facebook.com" target="_blank" rel="noreferrer" data-testid="footer-facebook" className="bg-lemon border-2 border-cream rounded-full p-2.5 btn-lift">
              <Facebook className="w-5 h-5 text-ink" />
            </a>
          </div>
        </div>
      </div>
      <h2 data-testid="footer-brand" className="font-display text-cream/10 leading-[0.75] text-center select-none text-[24vw]">
        KALAMA
      </h2>
      <div className="border-t border-cream/20 py-6">
        <p data-testid="footer-rights" className="text-center text-cream/50 text-sm font-medium">
          {t.footer.rights}
        </p>
      </div>
    </footer>
  );
};
