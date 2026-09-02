import { useState } from "react";
import { motion } from "framer-motion";
import { Check, Send } from "lucide-react";
import axios from "axios";
import { toast } from "sonner";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export const Franchising = ({ t }) => {
  const [form, setForm] = useState({ name: "", email: "", phone: "", city: "", message: "" });
  const [sending, setSending] = useState(false);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setSending(true);
    try {
      await axios.post(`${API}/franchising`, form);
      toast.success(t.franchising.success);
      setForm({ name: "", email: "", phone: "", city: "", message: "" });
    } catch {
      toast.error(t.franchising.error);
    } finally {
      setSending(false);
    }
  };

  const inputCls =
    "border-2 border-ink bg-white rounded-xl h-12 font-medium focus-visible:ring-coral focus-visible:ring-offset-0 shadow-hard-sm";

  return (
    <section id="franchising" data-testid="franchising-section" className="bg-ocean grain border-y-2 border-ink py-24 sm:py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 grid lg:grid-cols-2 gap-16 items-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          <span className="text-lemon font-bold uppercase tracking-widest text-sm">{t.franchising.kicker}</span>
          <h2 className="font-display text-5xl sm:text-6xl lg:text-7xl leading-[0.95] mt-4 text-lemon">
            {t.franchising.title}
          </h2>
          <p className="text-white/90 text-base sm:text-lg mt-6 font-medium max-w-lg">{t.franchising.p}</p>
          <ul className="mt-8 flex flex-col gap-4">
            {t.franchising.benefits.map((b, i) => (
              <li key={i} data-testid={`franchise-benefit-${i}`} className="flex items-start gap-3 text-white font-semibold">
                <span className="bg-lemon border-2 border-ink rounded-full p-1 mt-0.5 shrink-0">
                  <Check className="w-4 h-4 text-ink" strokeWidth={3} />
                </span>
                {b}
              </li>
            ))}
          </ul>
        </motion.div>

        <motion.form
          onSubmit={submit}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.15 }}
          data-testid="franchise-form"
          className="bg-cream border-2 border-ink rounded-3xl p-8 sm:p-10 shadow-hard"
        >
          <h3 className="font-display text-4xl text-ink tracking-wide">{t.franchising.formTitle}</h3>
          <div className="flex flex-col gap-4 mt-6">
            <Input data-testid="franchise-name-input" required placeholder={t.franchising.name} value={form.name} onChange={set("name")} className={inputCls} />
            <Input data-testid="franchise-email-input" required type="email" placeholder={t.franchising.email} value={form.email} onChange={set("email")} className={inputCls} />
            <div className="grid sm:grid-cols-2 gap-4">
              <Input data-testid="franchise-phone-input" required placeholder={t.franchising.phone} value={form.phone} onChange={set("phone")} className={inputCls} />
              <Input data-testid="franchise-city-input" required placeholder={t.franchising.city} value={form.city} onChange={set("city")} className={inputCls} />
            </div>
            <Textarea data-testid="franchise-message-input" placeholder={t.franchising.message} value={form.message} onChange={set("message")} className="border-2 border-ink bg-white rounded-xl font-medium min-h-[100px] focus-visible:ring-coral focus-visible:ring-offset-0 shadow-hard-sm" />
            <button
              type="submit"
              disabled={sending}
              data-testid="franchise-submit-btn"
              className="mt-2 inline-flex items-center justify-center gap-2 bg-coral text-ink border-2 border-ink rounded-full px-8 py-4 font-bold uppercase tracking-wide shadow-hard-sm btn-lift disabled:opacity-60"
            >
              <Send className="w-5 h-5" />
              {sending ? t.franchising.sending : t.franchising.submit}
            </button>
          </div>
        </motion.form>
      </div>
    </section>
  );
};
