import { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Trash2, Plus, Loader2 } from "lucide-react";
import { API, authHeaders } from "./ui";
import { ImageUpload, uploadImage } from "./ImageUpload";
import { imgUrl } from "../../lib/img";

const SINGLES = [
  ["hero", "Foto grande in apertura (Hero)"],
  ["about", "Foto sezione Chi Siamo"],
  ["location-malaga", "Foto sede Málaga"],
  ["location-sliema", "Foto sede Sliema"],
  ["foodtruck", "Foto Food Truck"],
];

export const SitePhotos = ({ onUnauthorized }) => {
  const [images, setImages] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    axios.get(`${API}/site-images`).then((r) => setImages(r.data)).catch(() => toast.error("Errore nel caricamento delle foto"));
  }, []);

  const save = async (key, value) => {
    try {
      await axios.put(`${API}/admin/site-images/${key}`, { value }, authHeaders());
      setImages((prev) => ({ ...prev, [key]: value }));
      toast.success("Foto aggiornata sul sito");
    } catch (e) {
      if (e.response?.status === 401) onUnauthorized();
      else toast.error(e.response?.data?.detail || "Errore nel salvataggio");
    }
  };

  const addGallery = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setBusy(true);
    try {
      const url = await uploadImage(file);
      await save("gallery", [...(images.gallery || []), url]);
    } catch (err) {
      toast.error(err.response?.data?.detail || "Caricamento non riuscito");
    } finally {
      setBusy(false);
    }
  };

  if (!images) return <p data-testid="admin-photos-loading" className="mt-16 font-bold text-ink/60">Caricamento...</p>;
  const gallery = images.gallery || [];

  return (
    <div data-testid="admin-site-photos">
      <h2 className="font-display text-5xl text-ink tracking-wide">FOTO DEL SITO</h2>
      <p className="text-ink/60 font-medium mt-1">Carica le tue foto reali: sostituiscono subito quelle di repertorio.</p>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
        {SINGLES.map(([key, label]) => (
          <div key={key} data-testid={`admin-photo-card-${key}`} className="bg-white border-2 border-ink rounded-2xl p-4 shadow-hard-sm">
            <p className="font-bold text-ink mb-3">{label}</p>
            <ImageUpload value={images[key]} onChange={(url) => save(key, url)} testId={`admin-photo-${key}`} label="Cambia foto" />
          </div>
        ))}
      </div>

      <div className="mt-12 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="font-display text-4xl text-ink tracking-wide">GALLERIA</h3>
          <p className="text-ink/60 font-medium">{gallery.length} foto tue · scorrono nella sezione Galleria</p>
        </div>
        <label data-testid="admin-gallery-add-btn" className="inline-flex items-center gap-2 bg-lemon text-ink border-2 border-ink rounded-full px-6 py-3 font-bold uppercase tracking-wide shadow-hard-sm btn-lift cursor-pointer">
          {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" strokeWidth={3} />} Aggiungi foto
          <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={addGallery} disabled={busy} data-testid="admin-gallery-add-input" />
        </label>
      </div>

      <div data-testid="admin-gallery-grid" className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mt-6">
        {gallery.map((src, i) => (
          <div key={src + i} data-testid={`admin-gallery-item-${i}`} className="relative border-2 border-ink rounded-2xl overflow-hidden shadow-hard-sm group">
            <img src={imgUrl(src)} alt={`Galleria ${i + 1}`} className="w-full h-40 object-cover" />
            <button
              onClick={() => save("gallery", gallery.filter((_, j) => j !== i))}
              data-testid={`admin-gallery-remove-${i}`}
              className="absolute top-2 right-2 bg-coral text-ink border-2 border-ink rounded-full p-2 shadow-hard-sm btn-lift"
              aria-label="Rimuovi"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
