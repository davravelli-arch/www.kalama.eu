import { useState } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowLeft, ArrowRight, Check, Loader2 } from "lucide-react";
import { useSite, SITE_NAME } from "../../lib/site";
import { StepWhen, StepTable, StepDetails, StepReview } from "./Steps";
import { WaIcon } from "../WhatsAppFloat";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const today = () => new Date().toISOString().slice(0, 10);
const EMPTY = { date: today(), time: "", guests: 2, zone: "any", occasion: "", accessibility: false, name: "", email: "", phone: "", notes: "" };

export const TableRequest = () => {
  const { t, lang, site, bookingOpen, closeBooking } = useSite();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(EMPTY);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(null);
  const [error, setError] = useState("");

  const reset = () => { setStep(0); setForm(EMPTY); setDone(null); setError(""); closeBooking(); };
  const canNext = step === 0 ? !!form.time : step === 2 ? form.name.trim().length >= 2 && /.+@.+\..+/.test(form.email) : true;

  const submit = async () => {
    setBusy(true); setError("");
    try {
      const { data } = await axios.post(`${API}/table-requests`, { ...form, site, lang });
      setDone(data);
    } catch (e) {
      setError(e.response?.data?.detail?.[0]?.msg || e.response?.data?.detail || t.booking.error);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AnimatePresence>
      {bookingOpen && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[80] bg-ink/60 flex items-end sm:items-center justify-center sm:p-4">
          <motion.div initial={{ y: 40 }} animate={{ y: 0 }} exit={{ y: 40 }} data-testid="booking-modal" className="bg-cream border-2 border-ink sm:rounded-3xl rounded-t-3xl shadow-hard w-full max-w-xl max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b-2 border-ink bg-lemon sm:rounded-t-3xl rounded-t-3xl">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-widest text-ink/60">{SITE_NAME[site]}</p>
                <h2 className="font-display text-3xl text-ink tracking-wide leading-none">{t.booking.title}</h2>
              </div>
              <button onClick={reset} data-testid="booking-close" aria-label="Chiudi" className="border-2 border-ink rounded-full p-2 bg-white btn-lift"><X className="w-5 h-5" /></button>
            </div>

            {!done && (
              <ol data-testid="booking-steps" className="grid grid-cols-4 border-b-2 border-ink/10 text-[11px] font-bold uppercase tracking-wide">
                {t.booking.steps.map((s, i) => (
                  <li key={s} data-testid={`booking-step-tab-${i}`} className={`text-center py-2.5 border-b-4 ${i === step ? "border-ink text-ink" : i < step ? "border-coral text-ink/70" : "border-transparent text-ink/40"}`}>{s}</li>
                ))}
              </ol>
            )}

            <div className="p-5 overflow-y-auto flex-1">
              {done ? (
                <div data-testid="booking-success" className="text-center py-6">
                  <span className="inline-flex w-16 h-16 rounded-full bg-lemon border-2 border-ink items-center justify-center shadow-hard-sm"><Check className="w-8 h-8" strokeWidth={3} /></span>
                  <h3 className="font-display text-4xl text-ink mt-4">{t.booking.successTitle}</h3>
                  <p className="text-sm font-medium text-ink/70 mt-2">{t.booking.successText.replace("{site}", SITE_NAME[site])}</p>
                  <a href={done.whatsapp_url} target="_blank" rel="noreferrer" data-testid="booking-whatsapp" className="mt-6 inline-flex items-center gap-2 bg-[#25D366] text-white border-2 border-ink rounded-full px-6 py-3 font-bold uppercase tracking-wide shadow-hard-sm btn-lift">
                    <WaIcon className="w-5 h-5 text-white" /> {t.booking.openWhatsapp}
                  </a>
                  <button onClick={reset} data-testid="booking-done-close" className="block mx-auto mt-4 text-sm font-bold uppercase tracking-wide text-ink/60 hover:text-ink">{t.booking.close}</button>
                </div>
              ) : (
                <>
                  {step === 0 && <StepWhen t={t} lang={lang} site={site} form={form} setForm={setForm} />}
                  {step === 1 && <StepTable t={t} form={form} setForm={setForm} />}
                  {step === 2 && <StepDetails t={t} form={form} setForm={setForm} />}
                  {step === 3 && <StepReview t={t} form={form} siteName={SITE_NAME[site]} />}
                  {error && <p data-testid="booking-error" className="mt-4 text-sm font-bold text-coral">{String(error)}</p>}
                </>
              )}
            </div>

            {!done && (
              <div className="flex items-center justify-between gap-3 px-5 py-4 border-t-2 border-ink bg-white sm:rounded-b-3xl">
                <button type="button" onClick={() => setStep(step - 1)} disabled={step === 0} data-testid="booking-back" className="inline-flex items-center gap-1.5 font-bold text-sm uppercase tracking-wide text-ink/70 disabled:opacity-30">
                  <ArrowLeft className="w-4 h-4" /> {t.booking.back}
                </button>
                {step < 3 ? (
                  <button type="button" onClick={() => setStep(step + 1)} disabled={!canNext} data-testid="booking-next" className="inline-flex items-center gap-2 bg-ink text-lemon border-2 border-ink rounded-full px-6 py-2.5 font-bold text-sm uppercase tracking-wide shadow-hard-sm btn-lift disabled:opacity-40">
                    {t.booking.next} <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button type="button" onClick={submit} disabled={busy} data-testid="booking-submit" className="inline-flex items-center gap-2 bg-lemon text-ink border-2 border-ink rounded-full px-6 py-2.5 font-bold text-sm uppercase tracking-wide shadow-hard-sm btn-lift disabled:opacity-60">
                    {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" strokeWidth={3} />} {busy ? t.booking.sending : t.booking.submit}
                  </button>
                )}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
