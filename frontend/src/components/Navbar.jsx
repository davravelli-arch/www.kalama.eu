import { useState } from "react";
import { Fish, Globe, Phone, Menu as MenuIcon, X } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "./ui/dropdown-menu";

export const Navbar = ({ t, lang, setLang }) => {
  const [open, setOpen] = useState(false);
  const links = [
    { href: "#chi-siamo", label: t.nav.about, id: "about" },
    { href: "#menu", label: t.nav.menu, id: "menu" },
    { href: "#sedi", label: t.nav.locations, id: "locations" },
    { href: "#galleria", label: t.nav.gallery, id: "gallery" },
    { href: "#franchising", label: t.nav.franchising, id: "franchising" },
    { href: "#contatti", label: t.nav.contact, id: "contact" },
  ];

  return (
    <header
      data-testid="main-navbar"
      className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b-2 border-ink"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-8 h-16 flex items-center justify-between">
        <a href="#top" data-testid="nav-logo" className="flex items-center gap-2">
          <span className="bg-coral border-2 border-ink rounded-full p-1.5">
            <Fish className="w-5 h-5 text-white" strokeWidth={2.5} />
          </span>
          <span className="font-display text-3xl tracking-wide text-ink">KALAMÀ</span>
        </a>

        <nav className="hidden lg:flex items-center gap-8">
          {links.map((l) => (
            <a
              key={l.id}
              href={l.href}
              data-testid={`nav-link-${l.id}`}
              className="text-sm font-semibold uppercase tracking-wider text-ink hover:text-coral transition-colors"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                data-testid="lang-switcher"
                className="flex items-center gap-1.5 border-2 border-ink rounded-full px-3 py-1.5 bg-lemon font-bold text-xs uppercase shadow-hard-sm btn-lift"
              >
                <Globe className="w-4 h-4" />
                {lang}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="border-2 border-ink">
              <DropdownMenuItem data-testid="lang-option-it" onClick={() => setLang("it")} className="font-semibold cursor-pointer">
                Italiano
              </DropdownMenuItem>
              <DropdownMenuItem data-testid="lang-option-en" onClick={() => setLang("en")} className="font-semibold cursor-pointer">
                English
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <a
            href="#sedi"
            data-testid="nav-order-cta"
            className="hidden sm:flex items-center gap-2 bg-coral text-white border-2 border-ink rounded-full px-5 py-2 font-bold text-sm uppercase tracking-wide shadow-hard-sm btn-lift"
          >
            <Phone className="w-4 h-4" />
            {t.nav.order}
          </a>

          <button
            data-testid="mobile-menu-toggle"
            className="lg:hidden border-2 border-ink rounded-full p-2 bg-white"
            onClick={() => setOpen(!open)}
            aria-label="Menu"
          >
            {open ? <X className="w-5 h-5" /> : <MenuIcon className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {open && (
        <nav data-testid="mobile-menu" className="lg:hidden bg-cream border-t-2 border-ink px-6 py-4 flex flex-col gap-4">
          {links.map((l) => (
            <a
              key={l.id}
              href={l.href}
              data-testid={`mobile-nav-link-${l.id}`}
              onClick={() => setOpen(false)}
              className="font-display text-2xl text-ink hover:text-coral transition-colors"
            >
              {l.label}
            </a>
          ))}
        </nav>
      )}
    </header>
  );
};
