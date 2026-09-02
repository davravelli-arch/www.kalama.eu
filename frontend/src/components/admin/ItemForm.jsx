import { X } from "lucide-react";
import { Field, inputCls } from "./ui";
import { ImageUpload } from "./ImageUpload";
import { ALL_CATEGORIES, LOCATIONS } from "../../lib/img";

const LOC_LABEL = { malaga: "Málaga", malta: "Malta · Sliema" };

export const ItemForm = ({ form, setForm, editing, onSave, onCancel }) => {
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  return (
    <div className="fixed inset-0 z-50 bg-ink/60 flex items-start sm:items-center justify-center p-4 overflow-y-auto">
      <form onSubmit={onSave} data-testid="admin-item-form" className="bg-cream border-2 border-ink rounded-3xl p-6 sm:p-8 shadow-hard w-full max-w-2xl my-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-display text-3xl text-ink tracking-wide">{editing === "new" ? "NUOVO PIATTO" : `MODIFICA: ${form.name_it}`}</h3>
          <button type="button" onClick={onCancel} data-testid="admin-cancel-btn" className="border-2 border-ink rounded-full p-2 bg-white btn-lift" aria-label="Chiudi">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Sede" testId="admin-field-location">
            <select value={form.location} onChange={set("location")} data-testid="admin-input-location" className={inputCls}>
              {LOCATIONS.map((l) => <option key={l} value={l}>{LOC_LABEL[l]}</option>)}
            </select>
          </Field>
          <Field label="Categoria" testId="admin-field-category">
            <select value={form.category} onChange={set("category")} data-testid="admin-input-category" className={inputCls}>
              {ALL_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="ID (univoco, senza spazi)" testId="admin-field-id">
            <input
              required
              disabled={editing !== "new"}
              value={form.id}
              onChange={(e) => setForm({ ...form, id: e.target.value.toLowerCase().replace(/\s+/g, "-") })}
              data-testid="admin-input-id"
              className={`${inputCls} disabled:bg-ink/10`}
              placeholder="es. malaga-fritto-misto"
            />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Prezzo (€)" testId="admin-field-price">
              <input required type="number" step="0.1" min="0" value={form.price} onChange={set("price")} data-testid="admin-input-price" className={inputCls} />
            </Field>
            <Field label="2° prezzo (bottiglia/caraffa)" testId="admin-field-price-max">
              <input type="number" step="0.1" min="0" value={form.price_max} onChange={set("price_max")} data-testid="admin-input-price-max" className={inputCls} placeholder="opzionale" />
            </Field>
          </div>
          <Field label="Nome (IT)" testId="admin-field-name-it">
            <input required value={form.name_it} onChange={set("name_it")} data-testid="admin-input-name-it" className={inputCls} />
          </Field>
          <Field label="Nome (EN)" testId="admin-field-name-en">
            <input required value={form.name_en} onChange={set("name_en")} data-testid="admin-input-name-en" className={inputCls} />
          </Field>
          <Field label="Descrizione (IT)" testId="admin-field-desc-it">
            <textarea value={form.desc_it} onChange={set("desc_it")} data-testid="admin-input-desc-it" className={`${inputCls} h-20 py-2`} />
          </Field>
          <Field label="Descrizione (EN)" testId="admin-field-desc-en">
            <textarea value={form.desc_en} onChange={set("desc_en")} data-testid="admin-input-desc-en" className={`${inputCls} h-20 py-2`} />
          </Field>
          <Field label="Etichetta (IT)" testId="admin-field-tag-it">
            <input value={form.tag_it} onChange={set("tag_it")} data-testid="admin-input-tag-it" className={inputCls} placeholder="es. Da condividere" />
          </Field>
          <Field label="Etichetta (EN)" testId="admin-field-tag-en">
            <input value={form.tag_en} onChange={set("tag_en")} data-testid="admin-input-tag-en" className={inputCls} placeholder="e.g. To share" />
          </Field>
        </div>

        <div className="mt-5 border-t-2 border-ink/10 pt-5">
          <span className="text-xs font-bold uppercase tracking-widest text-ink/60">Foto del piatto</span>
          <div className="mt-2">
            <ImageUpload value={form.image} onChange={(url) => setForm({ ...form, image: url })} testId="admin-item-image" />
          </div>
          <Field label="…oppure incolla un URL immagine" testId="admin-field-image">
            <input value={form.image} onChange={set("image")} data-testid="admin-input-image" className={inputCls} placeholder="https://..." />
          </Field>
        </div>

        <button type="submit" data-testid="admin-save-btn" className="mt-6 w-full bg-lemon text-ink border-2 border-ink rounded-full px-8 py-3.5 font-bold uppercase tracking-wide shadow-hard-sm btn-lift">
          {editing === "new" ? "Aggiungi al Menu" : "Salva Modifiche"}
        </button>
      </form>
    </div>
  );
};
