import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Globe, CalendarDays, Menu as MenuIcon, MapPin } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "./ui/dropdown-menu";
import { Logo } from "./Logo";
import { SiteDrawer } from "./SiteDrawer";
import { useSite } from "../lib/site";

const LANGS = [
  ["it", "Italiano"],
  ["en", "English"],
  ["es", "Español"],
  ["de", "Deutsch"],
  ["fr", "Français"],
  ["pt", "Português"],
];

export const Navbar = () => {
  const { t, lang, setLang, site, setSite, openBooking } = useSite();
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
      <Link to={l.href} data-testid={`${testPrefix}-${l.id}`} className={className}>{l.label}</Link>
    ) : (
      <a href={l.href} data-testid={`${testPrefix}-${l.id}`} className={className}>{l.label}</a>
    );

  return (
    <header data-testid="main-navbar" className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b-2 border-ink">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 h-16 flex items-center justify-between gap-3">
        <a href={`${home}#top`} data-testid="nav-logo" className="flex items-center shrink-0">
          <Logo variant="dark" className="h-9 sm:h-10" testId="nav-logo-img" />
        </a>

        <nav className="hidden xl:flex items-center gap-5">
          {links.map((l) => (
            <NavItem
              key={l.id}
              l={l}
              testPrefix="nav-link"
              className={
                l.id === "menu"
                  ? "whitespace-nowrap font-display text-xl tracking-wide bg-lemon text-ink border-2 border-ink rounded-full px-4 py-1 shadow-hard-sm btn-lift"
                  : "text-[13px] whitespace-nowrap font-semibold uppercase tracking-wider text-ink hover:text-coral transition-colors"
              }
            />
          ))}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          {site && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button data-testid="site-switcher" className="hidden sm:flex items-center gap-1.5 whitespace-nowrap border-2 border-ink rounded-full px-3 py-1.5 bg-white font-bold text-xs uppercase shadow-hard-sm btn-lift">
                  <MapPin className="w-4 h-4" /> {t.menu.locations[site]}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="border-2 border-ink">
                {["malaga", "malta"].map((s) => (
                  <DropdownMenuItem key={s} data-testid={`site-option-${s}`} onClick={() => setSite(s)} className={`font-semibold cursor-pointer ${site === s ? "text-coral" : ""}`}>
                    {t.menu.locations[s]}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button data-testid="lang-switcher" className="flex items-center gap-1.5 border-2 border-ink rounded-full px-3 py-1.5 bg-lemon font-bold text-xs uppercase shadow-hard-sm btn-lift">
                <Globe className="w-4 h-4" />
                {lang}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="border-2 border-ink">
              {LANGS.map(([code, label]) => (
                <DropdownMenuItem key={code} data-testid={`lang-option-${code}`} onClick={() => setLang(code)} className={`font-semibold cursor-pointer ${lang === code ? "text-coral" : ""}`}>
                  {label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <button onClick={openBooking} data-testid="nav-book-cta" className="hidden md:flex items-center gap-2 whitespace-nowrap bg-coral text-ink border-2 border-ink rounded-full px-4 py-2 font-bold text-xs uppercase tracking-wide shadow-hard-sm btn-lift">
            <CalendarDays className="w-4 h-4" />
            {t.site.bookTable}
          </button>

          <button data-testid="mobile-menu-toggle" className="border-2 border-ink rounded-full p-2 bg-white btn-lift" onClick={() => setOpen(true)} aria-label="Menu">
            <MenuIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      <SiteDrawer open={open} onClose={() => setOpen(false)} links={links} />
    </header>
  );
};
