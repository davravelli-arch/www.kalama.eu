import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Globe, Phone, Menu as MenuIcon, X } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "./ui/dropdown-menu";
import { Logo } from "./Logo";

const LANGS = [
  ["it", "Italiano"],
  ["en", "English"],
  ["es", "Español"],
  ["de", "Deutsch"],
  ["fr", "Français"],
  ["pt", "Português"],
];

export const Navbar = ({ t, lang, setLang }) => {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const home = pathname === "/" ? "" : "/";
  const links = [
    { href: `${home}#chi-siamo`, label: t.nav.about, id: "about" },
    { href: `${home}#menu`, label: t.nav.menu, id: "menu" },
    { href: `${home}#sedi`, label: t.nav.locations, id: "locations" },
    { href: `${home}#galleria`, label: t.nav.gallery, id: "gallery" },
    { href: "/recensioni", label: t.nav.reviews, id: "reviews", route: true },
    { href: `${home}#franchising`, label: t.nav.franchising, id: "franchising" },
    { href: `${home}#contatti`, label: t.nav.contact, id: "contact" },
  ];
  const NavItem = ({ l, className, testPrefix }) =>
    l.route ? (
      <Link to={l.href} data-testid={`${testPrefix}-${l.id}`} onClick={() => setOpen(false)} className={className}>{l.label}</Link>
    ) : (
      <a href={l.href} data-testid={`${testPrefix}-${l.id}`} onClick={() => setOpen(false)} className={className}>{l.label}</a>
    );

  return (
    <header
      data-testid="main-navbar"
      className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b-2 border-ink"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-8 h-16 flex items-center justify-between">
        <a href={`${home}#top`} data-testid="nav-logo" className="flex items-center">
          <Logo variant="dark" className="h-9 sm:h-10" testId="nav-logo-img" />
        </a>

        <nav className="hidden lg:flex items-center gap-7">
          {links.map((l) => (
            <NavItem key={l.id} l={l} testPrefix="nav-link" className="text-sm font-semibold uppercase tracking-wider text-ink hover:text-coral transition-colors" />
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
              {LANGS.map(([code, label]) => (
                <DropdownMenuItem
                  key={code}
                  data-testid={`lang-option-${code}`}
                  onClick={() => setLang(code)}
                  className={`font-semibold cursor-pointer ${lang === code ? "text-coral" : ""}`}
                >
                  {label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <a
            href={`${home}#sedi`}
            data-testid="nav-order-cta"
            className="hidden sm:flex items-center gap-2 bg-coral text-ink border-2 border-ink rounded-full px-5 py-2 font-bold text-sm uppercase tracking-wide shadow-hard-sm btn-lift"
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
            <NavItem key={l.id} l={l} testPrefix="mobile-nav-link" className="font-display text-2xl text-ink hover:text-coral transition-colors" />
          ))}
        </nav>
      )}
    </header>
  );
};
