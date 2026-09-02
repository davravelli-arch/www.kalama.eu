import { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, ImageOff } from "lucide-react";
import { API, authHeaders, btnPrimary } from "./ui";
import { ItemForm } from "./ItemForm";
import { imgUrl, ALL_CATEGORIES, LOCATIONS } from "../../lib/img";

const LOC_LABEL = { malaga: "Málaga", malta: "Malta · Sliema" };
const EMPTY = { id: "", location: "malaga", category: "fritti", name_it: "", name_en: "", desc_it: "", desc_en: "", price: "", price_max: "", tag_it: "", tag_en: "", image: "" };

export const MenuManager = ({ onUnauthorized }) => {
  const [items, setItems] = useState([]);
  const [loc, setLoc] = useState("malaga");
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${API}/admin/menu`, authHeaders());
      setItems(data);
    } catch (e) {
      if (e.response?.status === 401) onUnauthorized();
      else toast.error("Errore nel caricamento del menu");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const startNew = () => { setForm({ ...EMPTY, location: loc }); setEditing("new"); };
  const startEdit = (item) => { setForm({ ...item, price: String(item.price), price_max: item.price_max ?? "" }); setEditing(item.id); };

  const save = async (e) => {
    e.preventDefault();
    const payload = { ...form, price: parseFloat(form.price), price_max: form.price_max === "" ? null : parseFloat(form.price_max) };
    try {
      if (editing === "new") await axios.post(`${API}/admin/menu`, payload, authHeaders());
      else await axios.put(`${API}/admin/menu/${editing}`, payload, authHeaders());
      toast.success(editing === "new" ? "Piatto aggiunto" : "Piatto aggiornato");
      setEditing(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Errore nel salvataggio");
    }
  };

  const remove = async (item) => {
    if (!window.confirm(`Eliminare definitivamente "${item.name_it}"?`)) return;
    try {
      await axios.delete(`${API}/admin/menu/${item.id}`, authHeaders());
      toast.success("Piatto eliminato");
      load();
    } catch {
      toast.error("Errore nell'eliminazione");
    }
  };

  const visible = items.filter((i) => (i.location || "malaga") === loc);
  const cats = ALL_CATEGORIES.filter((c) => visible.some((i) => i.category === c));

  return (
    <div data-testid="admin-menu-manager">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-5xl text-ink tracking-wide">GESTIONE MENU</h2>
          <p className="text-ink/60 font-medium mt-1">{visible.length} voci · le modifiche sono subito visibili sul sito</p>
        </div>
        <button onClick={startNew} data-testid="admin-add-item-btn" className={btnPrimary}>
          <Plus className="w-5 h-5" strokeWidth={3} /> Nuova voce
        </button>
      </div>

      <div data-testid="admin-location-tabs" className="inline-flex mt-6 border-2 border-ink rounded-full bg-white p-1 shadow-hard-sm">
        {LOCATIONS.map((l) => (
          <button key={l} onClick={() => setLoc(l)} data-testid={`admin-location-${l}`} className={`rounded-full px-5 py-2 font-display text-xl tracking-wide transition-colors ${loc === l ? "bg-ink text-lemon" : "text-ink hover:bg-lemon"}`}>
            {LOC_LABEL[l]}
          </button>
        ))}
      </div>

      {loading ? (
        <p data-testid="admin-loading" className="mt-16 font-bold text-ink/60">Caricamento...</p>
      ) : (
        <div data-testid="admin-menu-list" className="mt-8 flex flex-col gap-8">
          {cats.map((c) => (
            <section key={c} data-testid={`admin-category-${c}`}>
              <h3 className="font-display text-2xl text-ink/70 tracking-wide uppercase mb-3">{c}</h3>
              <div className="flex flex-col gap-3">
                {visible.filter((i) => i.category === c).map((item) => (
                  <div key={item.id} data-testid={`admin-item-row-${item.id}`} className="bg-white border-2 border-ink rounded-2xl p-3 sm:p-4 shadow-hard-sm flex items-center gap-4">
                    {item.image ? (
                      <img src={imgUrl(item.image)} alt={item.name_it} className="w-14 h-14 rounded-xl object-cover border-2 border-ink shrink-0" />
                    ) : (
                      <span className="w-14 h-14 rounded-xl border-2 border-dashed border-ink/30 flex items-center justify-center shrink-0 text-ink/30"><ImageOff className="w-5 h-5" /></span>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-display text-2xl text-ink tracking-wide truncate">{item.name_it}</p>
                      <p className="text-xs font-bold uppercase tracking-widest text-ink/50">
                        €{Number(item.price).toFixed(2)}{item.price_max ? ` / €${Number(item.price_max).toFixed(2)}` : ""}
                      </p>
                    </div>
                    <button onClick={() => startEdit(item)} data-testid={`admin-edit-${item.id}`} className="bg-ocean text-white border-2 border-ink rounded-full p-2.5 shadow-hard-sm btn-lift" aria-label="Modifica">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={() => remove(item)} data-testid={`admin-delete-${item.id}`} className="bg-coral text-ink border-2 border-ink rounded-full p-2.5 shadow-hard-sm btn-lift" aria-label="Elimina">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      {editing && <ItemForm form={form} setForm={setForm} editing={editing} onSave={save} onCancel={() => setEditing(null)} />}
    </div>
  );
};
