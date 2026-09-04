import { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Search, Save } from "lucide-react";
import { API, authHeaders, Field, inputCls } from "./ui";

export const GoogleSettings = ({ onUnauthorized }) => {
  const [state, setState] = useState(null);
  const [ids, setIds] = useState({ malaga: "", malta: "" });
  const [query, setQuery] = useState("Kalamà Málaga Calle Trinidad Grund");
  const [results, setResults] = useState([]);

  useEffect(() => {
    axios.get(`${API}/admin/google-places`, authHeaders())
      .then((r) => { setState(r.data); setIds(r.data.placeIds); })
      .catch((e) => (e.response?.status === 401 ? onUnauthorized() : toast.error("Errore Google settings")));
  }, [onUnauthorized]);

  const save = async () => {
    try {
      await axios.put(`${API}/admin/google-places`, ids, authHeaders());
      toast.success("Sedi Google salvate");
    } catch (e) {
      toast.error(e.response?.data?.detail || "Errore nel salvataggio");
    }
  };

  const search = async () => {
    try {
      const { data } = await axios.post(`${API}/admin/google-places/search`, { query }, authHeaders());
      setResults(data);
      if (!data.length) toast.info("Nessun risultato");
    } catch (e) {
      toast.error(e.response?.data?.detail || "Ricerca non riuscita");
    }
  };

  if (!state) return null;

  return (
    <section data-testid="admin-google-settings" className="mt-14 border-2 border-ink rounded-3xl bg-white p-6 sm:p-8 shadow-hard-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-display text-3xl text-ink tracking-wide">GOOGLE REVIEWS (AUTOMATICHE)</h3>
        <span data-testid="admin-google-key-status" className={`text-xs font-bold uppercase tracking-widest rounded-full border-2 border-ink px-3 py-1 ${state.hasKey ? "bg-lemon" : "bg-ink/10 text-ink/60"}`}>
          {state.hasKey ? "Chiave API attiva" : "Chiave API non configurata"}
        </span>
      </div>
      <p className="text-sm text-ink/60 font-medium mt-2 max-w-2xl">
        Quando la chiave Google Places è attiva sul server, la pagina /recensioni mostra in automatico le 5 recensioni Google di ogni sede. Inserisci qui il <strong>Place ID</strong> di ciascuna sede (puoi cercarlo qui sotto).
      </p>

      <div className="grid sm:grid-cols-2 gap-4 mt-6">
        <Field label="Place ID · Málaga" testId="admin-google-field-malaga">
          <input value={ids.malaga} onChange={(e) => setIds({ ...ids, malaga: e.target.value.trim() })} data-testid="admin-google-place-malaga" className={inputCls} placeholder="ChIJ..." />
        </Field>
        <Field label="Place ID · Sliema" testId="admin-google-field-malta">
          <input value={ids.malta} onChange={(e) => setIds({ ...ids, malta: e.target.value.trim() })} data-testid="admin-google-place-malta" className={inputCls} placeholder="ChIJ..." />
        </Field>
      </div>
      <button onClick={save} data-testid="admin-google-save-btn" className="mt-4 inline-flex items-center gap-2 bg-lemon text-ink border-2 border-ink rounded-full px-6 py-2.5 font-bold uppercase tracking-wide text-sm shadow-hard-sm btn-lift">
        <Save className="w-4 h-4" /> Salva Place ID
      </button>

      <div className="mt-8 border-t-2 border-ink/10 pt-6">
        <p className="text-xs font-bold uppercase tracking-widest text-ink/60 mb-2">Trova il Place ID (richiede chiave attiva)</p>
        <div className="flex gap-2">
          <input value={query} onChange={(e) => setQuery(e.target.value)} data-testid="admin-google-search-input" className={inputCls} />
          <button onClick={search} disabled={!state.hasKey} data-testid="admin-google-search-btn" className="shrink-0 inline-flex items-center gap-2 bg-ocean text-white border-2 border-ink rounded-full px-5 font-bold uppercase text-sm shadow-hard-sm btn-lift disabled:opacity-50">
            <Search className="w-4 h-4" /> Cerca
          </button>
        </div>
        {results.length > 0 && (
          <ul data-testid="admin-google-search-results" className="mt-3 flex flex-col gap-2">
            {results.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 border-2 border-ink/20 rounded-xl px-3 py-2 text-sm">
                <span><strong>{p.name}</strong> — {p.address}</span>
                <span className="flex gap-2">
                  <button onClick={() => setIds({ ...ids, malaga: p.id })} className="text-xs font-bold uppercase text-ocean hover:underline">→ Málaga</button>
                  <button onClick={() => setIds({ ...ids, malta: p.id })} className="text-xs font-bold uppercase text-ocean hover:underline">→ Sliema</button>
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
};
