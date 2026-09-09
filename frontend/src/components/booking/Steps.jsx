import { useEffect, useState } from "react";
import axios from "axios";
import { Minus, Plus } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const fmt = (d) => d.toISOString().slice(0, 10);
const nextDays = (n) => Array.from({ length: n }, (_, i) => { const d = new Date(); d.setDate(d.getDate() + i); return d; });

export const StepWhen = ({ t, lang, site, form, setForm }) => {
  const [slots, setSlots] = useState(null);
  const [meal, setMeal] = useState("lunch");

  useEffect(() => {
    setSlots(null);
    axios.get(`${API}/table-requests/slots`, { params: { site, date: form.date } }).then((r) => setSlots(r.data)).catch(() => setSlots({ closed: true, lunch: [], dinner: [] }));
  }, [site, form.date]);

  const list = slots ? slots[meal] : [];
  const dayFmt = new Intl.DateTimeFormat(lang, { weekday: "short", day: "numeric", month: "short" });

  return (
    <div data-testid="booking-step-when">
      <p className="text-xs font-bold uppercase tracking-widest text-ink/60 mb-2">{t.booking.date}</p>
      <div data-testid="booking-dates" className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
        {nextDays(14).map((d) => {
          const v = fmt(d);
          return (
            <button key={v} type="button" onClick={() => setForm({ ...form, date: v, time: "" })} data-testid={`booking-date-${v}`} className={`shrink-0 border-2 border-ink rounded-2xl px-3 py-2 text-xs font-bold uppercase leading-tight transition-colors ${form.date === v ? "bg-ink text-lemon" : "bg-white hover:bg-lemon"}`}>
              {dayFmt.format(d)}
            </button>
          );
        })}
      </div>

      <div className="mt-5 flex items-center gap-2">
        {["lunch", "dinner"].map((m) => (
          <button key={m} type="button" onClick={() => setMeal(m)} data-testid={`booking-meal-${m}`} className={`border-2 border-ink rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wide ${meal === m ? "bg-ink text-lemon" : "bg-white hover:bg-lemon"}`}>
            {t.booking[m]}
          </button>
        ))}
      </div>
      {slots?.closed ? (
        <p data-testid="booking-closed" className="mt-4 text-sm font-bold text-coral">{t.booking.closed}</p>
      ) : (
        <div data-testid="booking-times" className="mt-3 flex flex-wrap gap-2">
          {list.map((s) => (
            <button key={s} type="button" onClick={() => setForm({ ...form, time: s })} data-testid={`booking-time-${s}`} className={`border-2 border-ink rounded-full px-3.5 py-1.5 text-sm font-bold ${form.time === s ? "bg-lemon" : "bg-white hover:bg-lemon/60"}`}>
              {s}
            </button>
          ))}
        </div>
      )}

      <p className="text-xs font-bold uppercase tracking-widest text-ink/60 mt-6 mb-2">{t.booking.guests}</p>
      <div data-testid="booking-guests" className="inline-flex items-center border-2 border-ink rounded-full bg-white shadow-hard-sm">
        <button type="button" onClick={() => setForm({ ...form, guests: Math.max(1, form.guests - 1) })} data-testid="booking-guests-minus" className="p-3" aria-label="-"><Minus className="w-4 h-4" /></button>
        <span data-testid="booking-guests-value" className="font-display text-2xl w-10 text-center">{form.guests}</span>
        <button type="button" onClick={() => setForm({ ...form, guests: Math.min(20, form.guests + 1) })} data-testid="booking-guests-plus" className="p-3" aria-label="+"><Plus className="w-4 h-4" /></button>
      </div>
    </div>
  );
};

const Chip = ({ active, onClick, children, testId }) => (
  <button type="button" onClick={onClick} data-testid={testId} className={`border-2 border-ink rounded-full px-4 py-2 text-sm font-bold transition-colors ${active ? "bg-ink text-lemon" : "bg-white hover:bg-lemon"}`}>{children}</button>
);

export const StepTable = ({ t, form, setForm }) => (
  <div data-testid="booking-step-table">
    <p className="font-display text-3xl text-ink tracking-wide">{t.booking.tableIntro}</p>
    <p className="text-xs font-bold uppercase tracking-widest text-ink/60 mt-5 mb-2">{t.booking.zone}</p>
    <div className="flex flex-wrap gap-2">
      {Object.entries(t.booking.zones).map(([k, v]) => <Chip key={k} active={form.zone === k} onClick={() => setForm({ ...form, zone: k })} testId={`booking-zone-${k}`}>{v}</Chip>)}
    </div>
    <p className="text-xs font-bold uppercase tracking-widest text-ink/60 mt-5 mb-2">{t.booking.occasion}</p>
    <div className="flex flex-wrap gap-2">
      {Object.entries(t.booking.occasions).map(([k, v]) => <Chip key={k} active={form.occasion === k} onClick={() => setForm({ ...form, occasion: form.occasion === k ? "" : k })} testId={`booking-occasion-${k}`}>{v}</Chip>)}
    </div>
    <label className="flex items-center gap-3 mt-6 cursor-pointer">
      <input type="checkbox" checked={form.accessibility} onChange={(e) => setForm({ ...form, accessibility: e.target.checked })} data-testid="booking-accessibility" className="w-5 h-5 accent-ink" />
      <span className="font-bold text-sm">{t.booking.accessibility}</span>
    </label>
  </div>
);

const input = "w-full border-2 border-ink bg-white rounded-xl h-11 px-3 font-medium focus:outline-none focus:ring-2 focus:ring-ocean";

export const StepDetails = ({ t, form, setForm }) => {
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  return (
    <div data-testid="booking-step-details" className="flex flex-col gap-4">
      <p className="font-display text-3xl text-ink tracking-wide">{t.booking.who}</p>
      <label className="block"><span className="text-xs font-bold uppercase tracking-widest text-ink/60">{t.booking.name}</span>
        <input required value={form.name} onChange={set("name")} data-testid="booking-name" className={`${input} mt-1`} /></label>
      <label className="block"><span className="text-xs font-bold uppercase tracking-widest text-ink/60">{t.booking.email}</span>
        <input required type="email" value={form.email} onChange={set("email")} data-testid="booking-email" className={`${input} mt-1`} /></label>
      <label className="block"><span className="text-xs font-bold uppercase tracking-widest text-ink/60">{t.booking.phone}</span>
        <input type="tel" value={form.phone} onChange={set("phone")} data-testid="booking-phone" className={`${input} mt-1`} /></label>
      <label className="block"><span className="text-xs font-bold uppercase tracking-widest text-ink/60">{t.booking.notes}</span>
        <textarea maxLength={500} value={form.notes} onChange={set("notes")} data-testid="booking-notes" className={`${input} mt-1 h-24 py-2`} />
        <span className="text-[11px] font-bold text-ink/40">{form.notes.length}/500</span></label>
    </div>
  );
};

export const StepReview = ({ t, form, siteName }) => {
  const rows = [
    [t.menu.kicker.replace(/^./, (c) => c.toUpperCase()), siteName],
    [t.booking.date, `${form.date} · ${form.time}`],
    [t.booking.guests, `${form.guests} ${t.booking.people}`],
    [t.booking.zone, t.booking.zones[form.zone]],
    [t.booking.occasion, form.occasion ? t.booking.occasions[form.occasion] : "—"],
    [t.booking.name, form.name],
    [t.booking.email, form.email],
    [t.booking.phone, form.phone || "—"],
    [t.booking.notes, form.notes || "—"],
  ];
  return (
    <div data-testid="booking-step-review">
      <p className="font-display text-3xl text-ink tracking-wide">{t.booking.review}</p>
      <dl className="mt-4 border-2 border-ink rounded-2xl bg-white divide-y-2 divide-ink/10">
        {rows.map(([k, v]) => (
          <div key={k} className="flex justify-between gap-4 px-4 py-2.5 text-sm"><dt className="font-bold text-ink/60 uppercase tracking-wide text-xs">{k}</dt><dd className="font-bold text-right">{v}</dd></div>
        ))}
      </dl>
      <p className="mt-3 text-xs font-medium text-ink/50">{t.booking.note}</p>
    </div>
  );
};
