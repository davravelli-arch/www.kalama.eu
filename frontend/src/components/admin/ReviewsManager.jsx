import { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Star, X } from "lucide-react";
import { API, authHeaders, btnPrimary, Field, inputCls } from "./ui";
import { GoogleSettings } from "./GoogleSettings";
import { LOCATIONS } from "../../lib/img";

const LOC_LABEL = { malaga: "Málaga", malta: "Malta · Sliema" };
const SOURCES = [["google", "Google"], ["tripadvisor", "TripAdvisor"], ["thefork", "TheFork"], ["facebook", "Facebook"], ["other", "Altro"]];
const EMPTY = { author: "", rating: 5, text: "", location: "malaga", source: "google", date: "", featured: true };

const ReviewForm = ({ form, setForm, editing, onSave, onCancel }) => {
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  return (
    <div className="fixed inset-0 z-50 bg-ink/60 flex items-start sm:items-center justify-center p-4 overflow-y-auto">
      <form onSubmit={onSave} data-testid="admin-review-form" className="bg-cream border-2 border-ink rounded-3xl p-6 sm:p-8 shadow-hard w-full max-w-2xl my-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-display text-3xl text-ink tracking-wide">{editing === "new" ? "NUOVA RECENSIONE" : "MODIFICA RECENSIONE"}</h3>
          <button type="button" onClick={onCancel} data-testid="admin-review-cancel-btn" className="border-2 border-ink rounded-full p-2 bg-white btn-lift" aria-label="Chiudi"><X className="w-5 h-5" /></button>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Nome cliente" testId="admin-review-field-author">
            <input required value={form.author} onChange={set("author")} data-testid="admin-review-author" className={inputCls} placeholder="es. Marco R." />
          </Field>
          <Field label="Stelle" testId="admin-review-field-rating">
            <div data-testid="admin-review-rating" className="flex items-center gap-1 h-11">
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} type="button" onClick={() => setForm({ ...form, rating: n })} data-testid={`admin-review-star-${n}`} aria-label={`${n} stelle`}>
                  <Star className={`w-7 h-7 ${n <= form.rating ? "fill-coral text-coral" : "text-ink/25"}`} />
                </button>
              ))}
            </div>
          </Field>
          <Field label="Sede" testId="admin-review-field-location">
            <select value={form.location} onChange={set("location")} data-testid="admin-review-location" className={inputCls}>
              {LOCATIONS.map((l) => <option key={l} value={l}>{LOC_LABEL[l]}</option>)}
            </select>
          </Field>
          <Field label="Fonte" testId="admin-review-field-source">
            <select value={form.source} onChange={set("source")} data-testid="admin-review-source" className={inputCls}>
              {SOURCES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </Field>
          <Field label="Data (testo libero, es. Maggio 2026)" testId="admin-review-field-date">
            <input value={form.date} onChange={set("date")} data-testid="admin-review-date" className={inputCls} placeholder="opzionale" />
          </Field>
          <label className="flex items-center gap-3 mt-6 cursor-pointer" data-testid="admin-review-field-featured">
            <input type="checkbox" checked={form.featured} onChange={(e) => setForm({ ...form, featured: e.target.checked })} data-testid="admin-review-featured" className="w-5 h-5 accent-ink" />
            <span className="font-bold text-sm">In evidenza nella home</span>
          </label>
        </div>
        <Field label="Testo della recensione" testId="admin-review-field-text">
          <textarea required value={form.text} onChange={set("text")} data-testid="admin-review-text" className={`${inputCls} h-32 py-2 mt-1`} />
        </Field>
        <button type="submit" data-testid="admin-review-save-btn" className="mt-6 w-full bg-lemon text-ink border-2 border-ink rounded-full px-8 py-3.5 font-bold uppercase tracking-wide shadow-hard-sm btn-lift">
          {editing === "new" ? "Pubblica recensione" : "Salva modifiche"}
        </button>
      </form>
    </div>
  );
};

export const ReviewsManager = ({ onUnauthorized }) => {
  const [reviews, setReviews] = useState([]);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);

  const load = () => axios.get(`${API}/reviews`).then((r) => setReviews(r.data)).catch(() => toast.error("Errore nel caricamento"));
  useEffect(() => { load(); }, []);

  const save = async (e) => {
    e.preventDefault();
    try {
      if (editing === "new") await axios.post(`${API}/admin/reviews`, form, authHeaders());
      else await axios.put(`${API}/admin/reviews/${editing}`, form, authHeaders());
      toast.success(editing === "new" ? "Recensione pubblicata" : "Recensione aggiornata");
      setEditing(null);
      load();
    } catch (err) {
      if (err.response?.status === 401) onUnauthorized();
      else toast.error(err.response?.data?.detail || "Errore nel salvataggio");
    }
  };

  const remove = async (r) => {
    if (!window.confirm(`Eliminare la recensione di "${r.author}"?`)) return;
    try {
      await axios.delete(`${API}/admin/reviews/${r.id}`, authHeaders());
      toast.success("Recensione eliminata");
      load();
    } catch {
      toast.error("Errore nell'eliminazione");
    }
  };

  return (
    <div data-testid="admin-reviews-manager">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-5xl text-ink tracking-wide">RECENSIONI</h2>
          <p className="text-ink/60 font-medium mt-1">{reviews.length} recensioni · copia le migliori da Google, TripAdvisor o TheFork</p>
        </div>
        <button onClick={() => { setForm(EMPTY); setEditing("new"); }} data-testid="admin-add-review-btn" className={btnPrimary}>
          <Plus className="w-5 h-5" strokeWidth={3} /> Nuova recensione
        </button>
      </div>

      <div data-testid="admin-reviews-list" className="mt-8 grid sm:grid-cols-2 gap-4">
        {reviews.map((r) => (
          <div key={r.id} data-testid={`admin-review-row-${r.id}`} className="bg-white border-2 border-ink rounded-2xl p-4 shadow-hard-sm flex flex-col gap-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-bold text-ink truncate">{r.author} <span className="text-ink/40">· {LOC_LABEL[r.location]}</span></p>
                <p className="text-xs font-bold uppercase tracking-widest text-ink/50">{"★".repeat(r.rating)} · {r.source}{r.featured ? " · in evidenza" : ""}</p>
              </div>
              <div className="flex gap-2 shrink-0">
                <button onClick={() => { setForm({ ...EMPTY, ...r }); setEditing(r.id); }} data-testid={`admin-review-edit-${r.id}`} className="bg-ocean text-white border-2 border-ink rounded-full p-2 shadow-hard-sm btn-lift" aria-label="Modifica"><Pencil className="w-4 h-4" /></button>
                <button onClick={() => remove(r)} data-testid={`admin-review-delete-${r.id}`} className="bg-coral text-ink border-2 border-ink rounded-full p-2 shadow-hard-sm btn-lift" aria-label="Elimina"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
            <p className="text-sm text-ink/70 font-medium line-clamp-3">{r.text}</p>
          </div>
        ))}
        {reviews.length === 0 && <p data-testid="admin-reviews-empty" className="text-ink/50 font-bold">Nessuna recensione ancora: aggiungi la prima.</p>}
      </div>

      <GoogleSettings onUnauthorized={onUnauthorized} />
      {editing && <ReviewForm form={form} setForm={setForm} editing={editing} onSave={save} onCancel={() => setEditing(null)} />}
    </div>
  );
};
