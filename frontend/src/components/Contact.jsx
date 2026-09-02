import { useState } from "react";
import { motion } from "framer-motion";
import { Phone, Mail, Send, ArrowRight } from "lucide-react";
import axios from "axios";
import { toast } from "sonner";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { KineticLines } from "./Kinetic";
import { locations } from "../locations";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export const Contact = ({ t }) => {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [sending, setSending] = useState(false);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setSending(true);
    try {
      await axios.post(`${API}/contact`, form);
      toast.success(t.contact.success);
      setForm({ name: "", email: "", message: "" });
    } catch {
      toast.error(t.contact.error);
    } finally {
      setSending(false);
    }
  };

  const inputCls =
    "border-2 border-ink bg-white rounded-xl h-12 font-medium focus-visible:ring-ocean focus-visible:ring-offset-0 shadow-hard-sm";

  return (
    <section id="contatti" data-testid="contact-section" className="py-24 sm:py-32 bg-cream">
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        <span className="text-ocean font-bold uppercase tracking-widest text-sm">{t.contact.kicker}</span>
        <KineticLines
          lines={t.contact.titleLines}
          className="font-display text-5xl sm:text-6xl lg:text-8xl leading-[0.92] mt-4 text-ink"
        />

        <div className="grid lg:grid-cols-2 gap-10 mt-14">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-lemon border-2 border-ink rounded-3xl p-8 sm:p-10 shadow-hard grain flex flex-col gap-8"
          >
            <div className="relative z-10">
              <h3 className="font-display text-4xl text-ink tracking-wide">{t.contact.quickTitle}</h3>
              <p className="text-ink/70 font-medium mt-1">{t.contact.quickNote}</p>
            </div>
            {locations.map((loc) => (
              <div key={loc.id} data-testid={`contact-quick-${loc.id}`} className="relative z-10 border-2 border-ink bg-cream rounded-2xl p-5 shadow-hard-sm">
                <p className="text-xs font-bold uppercase tracking-widest text-ink/60">{loc.name}</p>
                <a href={loc.phoneHref} className="flex items-center gap-3 mt-2 hover:text-coral transition-colors">
                  <Phone className="w-5 h-5 text-coral shrink-0" strokeWidth={2.5} />
                  <span className="font-display text-2xl sm:text-3xl text-ink tracking-wide">{loc.phone}</span>
                </a>
                <a href={`mailto:${loc.email}`} className="flex items-center gap-3 mt-2 text-ink/80 hover:text-ocean transition-colors font-medium">
                  <Mail className="w-5 h-5 text-coral shrink-0" strokeWidth={2.5} />
                  {loc.email}
                </a>
              </div>
            ))}
            <a
              href="#sedi"
              data-testid="contact-all-locations"
              className="relative z-10 inline-flex items-center gap-2 font-bold uppercase tracking-wide text-sm text-ink hover:text-coral transition-colors"
            >
              {t.contact.allLocations}
              <ArrowRight className="w-5 h-5" />
            </a>
          </motion.div>

          <motion.form
            onSubmit={submit}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.15 }}
            data-testid="contact-form"
            className="bg-white border-2 border-ink rounded-3xl p-8 sm:p-10 shadow-hard"
          >
            <h3 className="font-display text-4xl text-ink tracking-wide">{t.contact.formTitle}</h3>
            <div className="flex flex-col gap-4 mt-6">
              <Input data-testid="contact-name-input" required placeholder={t.contact.name} value={form.name} onChange={set("name")} className={inputCls} />
              <Input data-testid="contact-email-input" required type="email" placeholder={t.contact.email} value={form.email} onChange={set("email")} className={inputCls} />
              <Textarea data-testid="contact-message-input" required placeholder={t.contact.message} value={form.message} onChange={set("message")} className="border-2 border-ink bg-white rounded-xl font-medium min-h-[140px] focus-visible:ring-ocean focus-visible:ring-offset-0 shadow-hard-sm" />
              <button
                type="submit"
                disabled={sending}
                data-testid="contact-submit-btn"
                className="mt-2 inline-flex items-center justify-center gap-2 bg-ocean text-white border-2 border-ink rounded-full px-8 py-4 font-bold uppercase tracking-wide shadow-hard-sm btn-lift disabled:opacity-60"
              >
                <Send className="w-5 h-5" />
                {sending ? t.contact.sending : t.contact.submit}
              </button>
            </div>
          </motion.form>
        </div>
      </div>
    </section>
  );
};
