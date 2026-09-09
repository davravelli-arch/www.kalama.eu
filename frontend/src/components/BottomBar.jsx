import { MapPin, CalendarDays } from "lucide-react";
import { useSite, siteLocation } from "../lib/site";

export const BottomBar = () => {
  const { t, site, openBooking } = useSite();
  const loc = siteLocation(site);
  return (
    <div data-testid="bottom-bar" className="lg:hidden fixed bottom-0 inset-x-0 z-40 grid grid-cols-2 border-t-2 border-ink bg-white pb-[env(safe-area-inset-bottom)]">
      <a href={loc.mapsUrl} target="_blank" rel="noreferrer" data-testid="bottom-bar-directions" className="flex items-center justify-center gap-2 py-4 font-bold text-sm uppercase tracking-wide text-ink">
        <MapPin className="w-5 h-5" /> {t.site.directions}
      </a>
      <button onClick={openBooking} data-testid="bottom-bar-book" className="flex items-center justify-center gap-2 py-4 font-bold text-sm uppercase tracking-wide bg-lemon text-ink border-l-2 border-ink">
        <CalendarDays className="w-5 h-5" /> {t.site.bookTable}
      </button>
    </div>
  );
};
