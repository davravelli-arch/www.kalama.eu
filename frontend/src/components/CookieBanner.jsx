import { useState } from "react";
import { ShieldCheck } from "lucide-react";
import { useSite } from "../lib/site";

const KEY = "kalama_privacy_ok";

export const CookieBanner = () => {
  const { t } = useSite();
  const [ok, setOk] = useState(() => localStorage.getItem(KEY) === "1");
  if (ok) return null;
  return (
    <div data-testid="cookie-banner" className="fixed z-[90] left-4 right-4 sm:right-auto sm:left-6 bottom-20 lg:bottom-6 sm:max-w-sm bg-cream border-2 border-ink rounded-2xl shadow-hard p-4 flex gap-3">
      <ShieldCheck className="w-6 h-6 text-ocean shrink-0" />
      <div>
        <p className="text-sm font-medium text-ink/80">{t.cookie.text}</p>
        <button onClick={() => { localStorage.setItem(KEY, "1"); setOk(true); }} data-testid="cookie-accept" className="mt-3 bg-lemon text-ink border-2 border-ink rounded-full px-4 py-1.5 font-bold text-xs uppercase tracking-wide shadow-hard-sm btn-lift">
          {t.cookie.accept}
        </button>
      </div>
    </div>
  );
};
