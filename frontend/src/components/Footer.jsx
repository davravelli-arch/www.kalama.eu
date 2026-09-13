import { Phone } from "lucide-react";
import { InstagramIcon, FacebookIcon } from "./SocialIcons";
import { socials, locations } from "../locations";
import { Logo } from "./Logo";

export const Footer = ({ t }) => {
  return (
    <footer data-testid="main-footer" className="bg-ink border-t-2 border-ink pt-16 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        <div className="flex flex-wrap items-center justify-between gap-8 pb-12">
          <div className="flex flex-wrap items-center gap-5">
            <Logo variant="yellow" className="h-12" testId="footer-logo-img" />
            <span className="text-cream font-bold uppercase tracking-widest text-sm max-w-xs">{t.footer.tagline}</span>
          </div>
          <div className="flex flex-wrap items-center gap-6">
            {locations.map((loc) => (
              <a key={loc.id} href={loc.phoneHref} data-testid={`footer-phone-${loc.id}`} className="flex items-center gap-2 text-cream/80 hover:text-lemon transition-colors font-semibold text-sm">
                <Phone className="w-4 h-4 text-coral" />
                {loc.name} · {loc.phone}
              </a>
            ))}
            <div className="flex items-center gap-4">
              <span className="text-cream/60 text-xs font-bold uppercase tracking-widest">{t.footer.follow}</span>
              <a href={socials.instagram} target="_blank" rel="noreferrer" data-testid="footer-instagram" className="bg-white border-2 border-cream rounded-full p-2 btn-lift">
                <InstagramIcon className="w-6 h-6" />
              </a>
              <a href={socials.facebook} target="_blank" rel="noreferrer" data-testid="footer-facebook" className="bg-white border-2 border-cream rounded-full p-2 btn-lift">
                <FacebookIcon className="w-6 h-6" />
              </a>
            </div>
          </div>
        </div>
      </div>
      <h2 data-testid="footer-brand" className="font-display text-cream/10 leading-[0.75] text-center select-none text-[22vw]">
        KALAMÀ
      </h2>
      <div className="border-t border-cream/20 py-6">
        <p data-testid="footer-rights" className="text-center text-cream/50 text-sm font-medium">
          {t.footer.rights} · <a href="/admin" data-testid="footer-admin-link" className="underline hover:text-lemon transition-colors">Area Admin</a>
        </p>
      </div>
    </footer>
  );
};
