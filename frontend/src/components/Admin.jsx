import { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Fish, LogOut, Plus, Pencil, Trash2, X, ArrowLeft } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const CATEGORIES = ["cucina", "pasta", "fritti", "grill", "insalate", "panini", "dolci"];
const EMPTY = { id: "", category: "fritti", name_it: "", name_en: "", desc_it: "", desc_en: "", price: "", tag_it: "", tag_en: "", image: "" };

const inputCls =
  "w-full border-2 border-ink bg-white rounded-xl h-11 px-3 font-medium focus:outline-none focus:ring-2 focus:ring-coral";

const Field = ({ label, children, testId }) => (
  <label className="block" data-testid={testId}>
    <span className="text-xs font-bold uppercase tracking-widest text-ink/60">{label}</span>
    <div className="mt-1">{children}</div>
  </label>
);

export default function Admin() {
  const [token, setToken] = useState(localStorage.getItem("kalama_admin_token") || "");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);

  const auth = { headers: { Authorization: `Bearer ${token}` } };

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${API}/admin/menu`, auth);
      setItems(data);
    } catch (e) {
      if (e.response?.status === 401) {
        logout();
      } else {
        toast.error("Errore nel caricamento del menu");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const login = async (e) => {
    e.preventDefault();
    setLoginError("");
    try {
      const { data } = await axios.post(`${API}/admin/login`, { password });
      localStorage.setItem("kalama_admin_token", data.token);
      setToken(data.token);
      setPassword("");
    } catch (err) {
      setLoginError(err.response?.data?.detail || "Errore di accesso");
    }
  };

  const logout = () => {
    localStorage.removeItem("kalama_admin_token");
    setToken("");
    setItems([]);
    setEditing(null);
  };

  const startNew = () => {
    setForm(EMPTY);
    setEditing("new");
  };

  const startEdit = (item) => {
    setForm({ ...item, price: String(item.price) });
    setEditing(item.id);
  };

  const save = async (e) => {
    e.preventDefault();
    const payload = { ...form, price: parseFloat(form.price) };
    try {
      if (editing === "new") {
        await axios.post(`${API}/admin/menu`, payload, auth);
        toast.success("Piatto aggiunto");
      } else {
        await axios.put(`${API}/admin/menu/${editing}`, payload, auth);
        toast.success("Piatto aggiornato");
      }
      setEditing(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Errore nel salvataggio");
    }
  };

  const remove = async (id) => {
    if (!window.confirm(`Eliminare definitivamente "${id}"?`)) return;
    try {
      await axios.delete(`${API}/admin/menu/${id}`, auth);
      toast.success("Piatto eliminato");
      load();
    } catch {
      toast.error("Errore nell'eliminazione");
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-ink flex items-center justify-center px-4">
        <form
          onSubmit={login}
          data-testid="admin-login-form"
          className="bg-cream border-2 border-ink rounded-3xl p-8 sm:p-10 shadow-hard w-full max-w-md"
        >
          <div className="flex items-center gap-3 mb-6">
            <span className="bg-coral border-2 border-ink rounded-full p-2">
              <Fish className="w-6 h-6 text-white" strokeWidth={2.5} />
            </span>
            <h1 className="font-display text-4xl text-ink tracking-wide">AREA ADMIN</h1>
          </div>
          <Field label="Password" testId="admin-password-field">
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              data-testid="admin-password-input"
              className={inputCls}
              placeholder="••••••••"
            />
          </Field>
          {loginError && (
            <p data-testid="admin-login-error" className="mt-3 text-sm font-bold text-coral">
              {loginError}
            </p>
          )}
          <button
            type="submit"
            data-testid="admin-login-btn"
            className="mt-6 w-full bg-coral text-white border-2 border-ink rounded-full px-8 py-3.5 font-bold uppercase tracking-wide shadow-hard-sm btn-lift"
          >
            Accedi
          </button>
          <a
            href="/"
            data-testid="admin-back-home"
            className="mt-4 flex items-center justify-center gap-2 text-sm font-bold text-ink/60 hover:text-coral transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Torna al sito
          </a>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream">
      <header className="bg-ink border-b-2 border-ink sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="bg-coral border-2 border-cream rounded-full p-1.5">
              <Fish className="w-5 h-5 text-white" strokeWidth={2.5} />
            </span>
            <span className="font-display text-2xl text-cream tracking-wide">KALAMÀ ADMIN</span>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="/"
              data-testid="admin-view-site"
              className="hidden sm:inline-flex items-center gap-2 text-cream/80 hover:text-lemon text-sm font-bold uppercase tracking-wide transition-colors"
            >
              Vedi il sito
            </a>
            <button
              onClick={logout}
              data-testid="admin-logout-btn"
              className="inline-flex items-center gap-2 bg-cream text-ink border-2 border-cream rounded-full px-4 py-1.5 font-bold text-sm uppercase shadow-hard-sm btn-lift"
            >
              <LogOut className="w-4 h-4" /> Esci
            </button>
          </div>
        </div>
      </header>

      <main data-testid="admin-dashboard" className="max-w-7xl mx-auto px-4 sm:px-8 py-10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-5xl text-ink tracking-wide">GESTIONE MENU</h2>
            <p className="text-ink/60 font-medium mt-1">
              {items.length} piatti · le modifiche sono subito visibili sul sito
            </p>
          </div>
          <button
            onClick={startNew}
            data-testid="admin-add-item-btn"
            className="inline-flex items-center gap-2 bg-lemon text-ink border-2 border-ink rounded-full px-6 py-3 font-bold uppercase tracking-wide shadow-hard-sm btn-lift"
          >
            <Plus className="w-5 h-5" strokeWidth={3} /> Nuovo Piatto
          </button>
        </div>

        {loading ? (
          <p data-testid="admin-loading" className="mt-16 font-bold text-ink/60">Caricamento...</p>
        ) : (
          <div data-testid="admin-menu-list" className="mt-8 flex flex-col gap-3">
            {items.map((item) => (
              <div
                key={item.id}
                data-testid={`admin-item-row-${item.id}`}
                className="bg-white border-2 border-ink rounded-2xl p-4 shadow-hard-sm flex items-center gap-4"
              >
                <img
                  src={item.image}
                  alt={item.name_it}
                  className="w-16 h-16 rounded-xl object-cover border-2 border-ink shrink-0 hidden sm:block"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-display text-2xl text-ink tracking-wide truncate">{item.name_it}</p>
                  <p className="text-xs font-bold uppercase tracking-widest text-ink/50">
                    {item.category} · €{Number(item.price).toFixed(2)}
                  </p>
                </div>
                <button
                  onClick={() => startEdit(item)}
                  data-testid={`admin-edit-${item.id}`}
                  className="bg-ocean text-white border-2 border-ink rounded-full p-2.5 shadow-hard-sm btn-lift"
                  aria-label="Modifica"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={() => remove(item.id)}
                  data-testid={`admin-delete-${item.id}`}
                  className="bg-coral text-white border-2 border-ink rounded-full p-2.5 shadow-hard-sm btn-lift"
                  aria-label="Elimina"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </main>

      {editing && (
        <div className="fixed inset-0 z-50 bg-ink/60 flex items-start sm:items-center justify-center p-4 overflow-y-auto">
          <form
            onSubmit={save}
            data-testid="admin-item-form"
            className="bg-cream border-2 border-ink rounded-3xl p-6 sm:p-8 shadow-hard w-full max-w-2xl my-8"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-display text-3xl text-ink tracking-wide">
                {editing === "new" ? "NUOVO PIATTO" : `MODIFICA: ${editing}`}
              </h3>
              <button
                type="button"
                onClick={() => setEditing(null)}
                data-testid="admin-cancel-btn"
                className="border-2 border-ink rounded-full p-2 bg-white btn-lift"
                aria-label="Chiudi"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="ID (univoco, senza spazi)" testId="admin-field-id">
                <input
                  required
                  disabled={editing !== "new"}
                  value={form.id}
                  onChange={(e) => setForm({ ...form, id: e.target.value.toLowerCase().replace(/\s+/g, "-") })}
                  data-testid="admin-input-id"
                  className={`${inputCls} disabled:bg-ink/10`}
                  placeholder="es. fritto-misto"
                />
              </Field>
              <Field label="Categoria" testId="admin-field-category">
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  data-testid="admin-input-category"
                  className={inputCls}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </Field>
              <Field label="Nome (IT)" testId="admin-field-name-it">
                <input required value={form.name_it} onChange={(e) => setForm({ ...form, name_it: e.target.value })} data-testid="admin-input-name-it" className={inputCls} />
              </Field>
              <Field label="Nome (EN)" testId="admin-field-name-en">
                <input required value={form.name_en} onChange={(e) => setForm({ ...form, name_en: e.target.value })} data-testid="admin-input-name-en" className={inputCls} />
              </Field>
              <Field label="Descrizione (IT)" testId="admin-field-desc-it">
                <textarea value={form.desc_it} onChange={(e) => setForm({ ...form, desc_it: e.target.value })} data-testid="admin-input-desc-it" className={`${inputCls} h-20 py-2`} />
              </Field>
              <Field label="Descrizione (EN)" testId="admin-field-desc-en">
                <textarea value={form.desc_en} onChange={(e) => setForm({ ...form, desc_en: e.target.value })} data-testid="admin-input-desc-en" className={`${inputCls} h-20 py-2`} />
              </Field>
              <Field label="Prezzo (€)" testId="admin-field-price">
                <input required type="number" step="0.5" min="0" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} data-testid="admin-input-price" className={inputCls} />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Etichetta (IT)" testId="admin-field-tag-it">
                  <input value={form.tag_it} onChange={(e) => setForm({ ...form, tag_it: e.target.value })} data-testid="admin-input-tag-it" className={inputCls} placeholder="opzionale" />
                </Field>
                <Field label="Etichetta (EN)" testId="admin-field-tag-en">
                  <input value={form.tag_en} onChange={(e) => setForm({ ...form, tag_en: e.target.value })} data-testid="admin-input-tag-en" className={inputCls} placeholder="optional" />
                </Field>
              </div>
            </div>

            <div className="mt-4">
              <Field label="URL Immagine" testId="admin-field-image">
                <input value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} data-testid="admin-input-image" className={inputCls} placeholder="https://..." />
              </Field>
              {form.image && (
                <img src={form.image} alt="Anteprima" data-testid="admin-image-preview" className="mt-3 h-32 w-full object-cover rounded-xl border-2 border-ink" />
              )}
            </div>

            <button
              type="submit"
              data-testid="admin-save-btn"
              className="mt-6 w-full bg-coral text-white border-2 border-ink rounded-full px-8 py-3.5 font-bold uppercase tracking-wide shadow-hard-sm btn-lift"
            >
              {editing === "new" ? "Aggiungi al Menu" : "Salva Modifiche"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
