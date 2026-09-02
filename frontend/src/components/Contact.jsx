import { useState } from "react";
import { motion } from "framer-motion";
import { MapPin, Phone, Clock, Send } from "lucide-react";
import axios from "axios";
import { toast } from "sonner";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";

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

  const info = [
    { icon: MapPin, label: t.contact.findUs, value: t.contact.address, id: "address" },
    { icon: Phone, label: t.contact.callUs, value: t.contact.phone, id: "phone", href: "tel:+390401234567" },
    { icon: Clock, label: t.contact.hoursLabel, value: t.contact.hours, id: "hours" },
  ];

  const inputCls =
    "border-2 border-ink bg-white rounded-xl h-12 font-medium focus-visible:ring-ocean focus-visible:ring-offset-0 shadow-hard-sm";

  return (
    <section id="contatti" data-testid="contact-section" className="py-24 sm:py-32 bg-cream">
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        <span className="text-ocean font-bold uppercase tracking-widest text-sm">{t.contact.kicker}</span>
        <h2 className="font-display text-5xl sm:text-6xl lg:text-7xl leading-[0.95] mt-4 text-ink">
          {t.contact.title}
        </h2>

        <div className="grid lg:grid-cols-2 gap-10 mt-14">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-lemon border-2 border-ink rounded-3xl p-8 sm:p-10 shadow-hard grain flex flex-col gap-8"
          >
            {info.map((item) => (
              <div key={item.id} data-testid={`contact-info-${item.id}`} className="flex items-start gap-4 relative z-10">
                <span className="bg-coral border-2 border-ink rounded-full p-3 shrink-0">
                  <item.icon className="w-5 h-5 text-white" strokeWidth={2.5} />
                </span>
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-ink/60">{item.label}</p>
                  {item.href ? (
                    <a href={item.href} className="font-display text-2xl sm:text-3xl text-ink tracking-wide hover:text-coral transition-colors">
                      {item.value}
                    </a>
                  ) : (
                    <p className="font-display text-2xl sm:text-3xl text-ink tracking-wide">{item.value}</p>
                  )}
                </div>
              </div>
            ))}
            <div className="relative z-10 border-2 border-ink rounded-2xl overflow-hidden shadow-hard-sm mt-2">
              <iframe
                title="Kalama map"
                data-testid="contact-map"
                src="https://www.openstreetmap.org/export/embed.html?bbox=13.7480%2C45.6390%2C13.7980%2C45.6590&layer=mapnik&marker=45.6495%2C13.7730"
                className="w-full h-56"
                loading="lazy"
              />
            </div>
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
