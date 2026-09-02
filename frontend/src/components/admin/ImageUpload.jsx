import { useRef, useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Upload, Loader2 } from "lucide-react";
import { API, authHeaders } from "./ui";
import { imgUrl } from "../../lib/img";

const MAX_SIDE = 1600;

const shrink = (file) =>
  new Promise((resolve) => {
    if (file.type === "image/gif" || file.size < 600 * 1024) return resolve(file);
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const scale = Math.min(1, MAX_SIDE / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      canvas.toBlob((blob) => resolve(blob ? new File([blob], file.name.replace(/\.\w+$/, ".jpg"), { type: "image/jpeg" }) : file), "image/jpeg", 0.86);
    };
    img.onerror = () => resolve(file);
    img.src = url;
  });

export const uploadImage = async (file) => {
  const prepared = await shrink(file);
  const fd = new FormData();
  fd.append("file", prepared);
  const { data } = await axios.post(`${API}/admin/upload`, fd, authHeaders());
  return data.url;
};

export const ImageUpload = ({ value, onChange, testId, label = "Carica foto", compact = false }) => {
  const ref = useRef();
  const [busy, setBusy] = useState(false);

  const pick = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setBusy(true);
    try {
      onChange(await uploadImage(file));
      toast.success("Foto caricata");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Caricamento non riuscito");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div data-testid={testId} className={compact ? "flex items-center gap-3" : ""}>
      {value ? (
        <img src={imgUrl(value)} alt="Anteprima" data-testid={`${testId}-preview`} className={`${compact ? "h-16 w-24" : "h-40 w-full mb-3"} object-cover rounded-xl border-2 border-ink`} />
      ) : (
        <div className={`${compact ? "h-16 w-24" : "h-40 w-full mb-3"} rounded-xl border-2 border-dashed border-ink/40 bg-ink/5 flex items-center justify-center text-xs font-bold text-ink/50 uppercase`}>
          Nessuna foto
        </div>
      )}
      <input ref={ref} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={pick} data-testid={`${testId}-input`} />
      <button
        type="button"
        disabled={busy}
        onClick={() => ref.current?.click()}
        data-testid={`${testId}-btn`}
        className="inline-flex items-center gap-2 bg-ocean text-white border-2 border-ink rounded-full px-4 py-2 text-sm font-bold uppercase tracking-wide shadow-hard-sm btn-lift disabled:opacity-60"
      >
        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
        {busy ? "Caricamento..." : label}
      </button>
    </div>
  );
};
