import { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Trash2, Check, X, Mail, Phone, BellRing } from "lucide-react";
import { API, authHeaders } from "./ui";

const SITE = { malaga: "Málaga", malta: "Sliema" };
const ZONE = { any: "Nessuna preferenza", indoor: "Interno", outdoor: "Esterno" };
const OCC = { couple: "In coppia", friends: "Con amici", family: "In famiglia", celebration: "Celebrazione", group: "Gruppo" };
const STATUS = { new: ["Nuova", "bg-lemon"], confirmed: ["Confermata", "bg-[#25D366] text-white"], declined: ["Rifiutata", "bg-coral"] };

export const BookingsManager = ({ onUnauthorized }) => {
  const [list, setList] = useState(null);
  const [filter, setFilter] = useState("all");

  const load = () =>
    axios.get(`${API}/admin/table-requests`, authHeaders()).then((r) => setList(r.data))
      .catch((e) => (e.response?.status === 401 ? onUnauthorized() : toast.error("Errore nel caricamento")));
  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const setStatus = async (id, status) => {
    try {
      const { data } = await axios.patch(`${API}/admin/table-requests/${id}`, { status }, authHeaders());
      if (data.guest_notified) toast.success(`Richiesta ${STATUS[status][0].toLowerCase()} · email inviata al cliente`);
      else toast.warning(`Richiesta ${STATUS[status][0].toLowerCase()} · email al cliente non inviata (indirizzo non raggiungibile)`);
      load();
    } catch { toast.error("Errore nell'aggiornamento"); }
  };

  const remind = async (id) => {
    try {
      const { data } = await axios.post(`${API}/admin/table-requests/${id}/remind`, {}, authHeaders());
      if (data.sent) toast.success("Promemoria inviato al cliente");
      else toast.warning("Promemoria non inviato (indirizzo non raggiungibile)");
      load();
    } catch (e) { toast.error(e.response?.data?.detail || "Errore nell'invio"); }
  };

  const remove = async (r) => {
    if (!window.confirm(`Eliminare la richiesta di ${r.name}?`)) return;
    try {
      await axios.delete(`${API}/admin/table-requests/${r.id}`, authHeaders());
      toast.success("Richiesta eliminata");
      load();
    } catch { toast.error("Errore nell'eliminazione"); }
  };

  if (!list) return <p data-testid="admin-bookings-loading" className="mt-16 font-bold text-ink/60">Caricamento...</p>;
  const shown = list.filter((r) => filter === "all" || r.status === filter);

  return (
    <div data-testid="admin-bookings-manager">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-5xl text-ink tracking-wide">RICHIESTE TAVOLO</h2>
          <p className="text-ink/60 font-medium mt-1">{list.filter((r) => r.status === "new").length} nuove · {list.length} totali. Confermando o rifiutando, il cliente riceve subito un'email nella sua lingua; la mattina del tavolo (ore 9) parte in automatico il promemoria.</p>
        </div>
        <div data-testid="admin-bookings-filter" className="inline-flex border-2 border-ink rounded-full bg-white p-1 shadow-hard-sm">
          {["all", "new", "confirmed", "declined"].map((s) => (
            <button key={s} onClick={() => setFilter(s)} data-testid={`admin-bookings-filter-${s}`} className={`rounded-full px-3 py-1.5 text-xs font-bold uppercase tracking-wide ${filter === s ? "bg-ink text-lemon" : "hover:bg-lemon"}`}>
              {s === "all" ? "Tutte" : STATUS[s][0]}
            </button>
          ))}
        </div>
      </div>

      <div data-testid="admin-bookings-list" className="mt-8 flex flex-col gap-3">
        {shown.length === 0 && <p data-testid="admin-bookings-empty" className="text-ink/50 font-bold">Nessuna richiesta.</p>}
        {shown.map((r) => (
          <div key={r.id} data-testid={`admin-booking-row-${r.id}`} className="bg-white border-2 border-ink rounded-2xl p-4 shadow-hard-sm grid md:grid-cols-[1fr_auto] gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className={`text-[11px] font-bold uppercase tracking-widest border-2 border-ink rounded-full px-2.5 py-0.5 ${STATUS[r.status][1]}`}>{STATUS[r.status][0]}</span>
                <span className="text-[11px] font-bold uppercase tracking-widest text-ink/50">{SITE[r.site]} · {r.lang?.toUpperCase()}</span>
                {r.guest_notified_at && <span data-testid={`admin-booking-notified-${r.id}`} className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-widest text-ocean"><Mail className="w-3 h-3" /> Cliente avvisato</span>}
                {r.reminder_sent_at && <span data-testid={`admin-booking-reminded-${r.id}`} className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-widest text-ocean"><BellRing className="w-3 h-3" /> Promemoria inviato</span>}
              </div>
              <p className="font-display text-3xl text-ink tracking-wide mt-1">{r.date} · {r.time} · {r.guests} pers.</p>
              <p className="font-bold text-ink">{r.name} <span className="text-ink/40 font-medium">· {ZONE[r.zone]}{r.occasion ? ` · ${OCC[r.occasion]}` : ""}{r.accessibility ? " · accesso agevolato" : ""}</span></p>
              <p className="text-sm text-ink/70 font-medium mt-1 flex flex-wrap gap-x-4">
                <a href={`mailto:${r.email}`} className="inline-flex items-center gap-1 hover:text-ocean"><Mail className="w-3.5 h-3.5" />{r.email}</a>
                {r.phone && <a href={`tel:${r.phone}`} className="inline-flex items-center gap-1 hover:text-ocean"><Phone className="w-3.5 h-3.5" />{r.phone}</a>}
              </p>
              {r.notes && <p className="text-sm text-ink/70 mt-1 italic">“{r.notes}”</p>}
            </div>
            <div className="flex md:flex-col gap-2 shrink-0">
              <button onClick={() => setStatus(r.id, "confirmed")} data-testid={`admin-booking-confirm-${r.id}`} className="inline-flex items-center gap-1 bg-[#25D366] text-white border-2 border-ink rounded-full px-3 py-1.5 text-xs font-bold uppercase shadow-hard-sm btn-lift"><Check className="w-4 h-4" /> Conferma</button>
              <button onClick={() => setStatus(r.id, "declined")} data-testid={`admin-booking-decline-${r.id}`} className="inline-flex items-center gap-1 bg-coral text-ink border-2 border-ink rounded-full px-3 py-1.5 text-xs font-bold uppercase shadow-hard-sm btn-lift"><X className="w-4 h-4" /> Rifiuta</button>
              <button onClick={() => remove(r)} data-testid={`admin-booking-delete-${r.id}`} className="inline-flex items-center gap-1 bg-white text-ink border-2 border-ink rounded-full px-3 py-1.5 text-xs font-bold uppercase shadow-hard-sm btn-lift"><Trash2 className="w-4 h-4" /> Elimina</button>
              {r.status === "confirmed" && (
                <button onClick={() => remind(r.id)} data-testid={`admin-booking-remind-${r.id}`} className="inline-flex items-center gap-1 bg-lemon text-ink border-2 border-ink rounded-full px-3 py-1.5 text-xs font-bold uppercase shadow-hard-sm btn-lift"><BellRing className="w-4 h-4" /> Promemoria</button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
