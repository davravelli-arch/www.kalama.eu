import { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Save } from "lucide-react";
import { API, authHeaders, Field, inputCls, btnPrimary } from "./ui";

const LOC_FIELDS = [
  ["address", "Indirizzo"], ["phone", "Telefono (es. +34 610 755 695)"], ["whatsapp", "WhatsApp (solo cifre, es. 34610755695)"], ["email", "Email sede"],
  ["hours_it", "Orari (italiano)"], ["hours_en", "Orari (inglese)"], ["mapsUrl", "Link Google Maps"],
  ["delivery_url", "Link delivery (Glovo / Bolt)"], ["booking_url", "Link prenotazioni (TheFork)"],
  ["hero_it", "Frase di apertura (italiano)"], ["hero_en", "Frase di apertura (inglese)"],
];
const DEFAULTS = {
  malaga: { address: "Calle Trinidad Grund 7, Soho, 29001 Málaga", phone: "+34 610 755 695", whatsapp: "34610755695", email: "info@kalama.eu", hours_it: "Mar–Dom · 12:00 – 16:00 + 20:00 – 23:30", hours_en: "Tue–Sun · 12:00 – 16:00 + 20:00 – 23:30" },
  sliema: { address: "111 Triq ix-Xatt, Sliema SLM 3210, Malta", phone: "+356 7990 0819", whatsapp: "35679900819", email: "kalama.international@gmail.com", hours_it: "Tutti i giorni · 12:00 – 23:00", hours_en: "Every day · 12:00 – 23:00" },
};

export const SettingsManager = ({ onUnauthorized }) => {
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    axios.get(`${API}/site-settings`).then((r) => setData({ malaga: {}, sliema: {}, socials: {}, ...r.data })).catch(() => toast.error("Errore nel caricamento"));
  }, []);

  const set = (loc, k) => (e) => setData({ ...data, [loc]: { ...data[loc], [k]: e.target.value } });

  const save = async () => {
    setBusy(true);
    try {
      const { data: saved } = await axios.put(`${API}/admin/site-settings`, data, authHeaders());
      setData({ malaga: {}, sliema: {}, socials: {}, ...saved });
      toast.success("Testi e contatti salvati: già online");
    } catch (e) {
      if (e.response?.status === 401) onUnauthorized(); else toast.error(e.response?.data?.detail || "Errore nel salvataggio");
    } finally { setBusy(false); }
  };

  if (!data) return <p data-testid="admin-settings-loading" className="mt-16 font-bold text-ink/60">Caricamento...</p>;

  return (
    <div data-testid="admin-settings-manager">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-5xl text-ink tracking-wide">TESTI E SEDI</h2>
          <p className="text-ink/60 font-medium mt-1">Lascia vuoto un campo per usare il valore predefinito. Le modifiche sono subito visibili sul sito.</p>
        </div>
        <button onClick={save} disabled={busy} data-testid="admin-settings-save-btn" className={btnPrimary}><Save className="w-5 h-5" /> {busy ? "Salvo..." : "Salva tutto"}</button>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mt-8">
        {[["malaga", "Kalamà Málaga"], ["sliema", "Kalamà Sliema"]].map(([loc, title]) => (
          <section key={loc} data-testid={`admin-settings-${loc}`} className="bg-white border-2 border-ink rounded-3xl p-6 shadow-hard-sm flex flex-col gap-3">
            <h3 className="font-display text-3xl text-ink tracking-wide">{title}</h3>
            {LOC_FIELDS.map(([k, label]) => (
              <Field key={k} label={label} testId={`admin-settings-field-${loc}-${k}`}>
                {k.startsWith("hero_") ? (
                  <textarea value={data[loc][k] || ""} onChange={set(loc, k)} data-testid={`admin-settings-${loc}-${k}`} className={`${inputCls} h-20 py-2`} placeholder="predefinito dal sito" />
                ) : (
                  <input value={data[loc][k] || ""} onChange={set(loc, k)} data-testid={`admin-settings-${loc}-${k}`} className={inputCls} placeholder={DEFAULTS[loc][k] || "predefinito dal sito"} />
                )}
              </Field>
            ))}
          </section>
        ))}
      </div>

      <section data-testid="admin-settings-socials" className="mt-6 bg-white border-2 border-ink rounded-3xl p-6 shadow-hard-sm grid sm:grid-cols-2 gap-4">
        <h3 className="font-display text-3xl text-ink tracking-wide sm:col-span-2">SOCIAL</h3>
        {[["instagram", "Link Instagram"], ["facebook", "Link Facebook"]].map(([k, label]) => (
          <Field key={k} label={label} testId={`admin-settings-field-${k}`}>
            <input value={data.socials[k] || ""} onChange={(e) => setData({ ...data, socials: { ...data.socials, [k]: e.target.value } })} data-testid={`admin-settings-social-${k}`} className={inputCls} placeholder="https://..." />
          </Field>
        ))}
      </section>
    </div>
  );
};
