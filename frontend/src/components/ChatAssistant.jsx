import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, UtensilsCrossed, CalendarDays, MapPin } from "lucide-react";
import { useSite, siteLocation, SITE_NAME } from "../lib/site";
import { WaIcon } from "./WhatsAppFloat";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const SESSION_KEY = "kalama_chat_session";
const sessionId = () => {
  let id = localStorage.getItem(SESSION_KEY);
  if (!id) { id = `web-${crypto.randomUUID()}`; localStorage.setItem(SESSION_KEY, id); }
  return id;
};

export const ChatAssistant = () => {
  const { t, lang, site, chatOpen, setChatOpen, openBooking } = useSite();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const endRef = useRef();
  const loc = siteLocation(site);

  useEffect(() => {
    if (!chatOpen || busy) return;
    fetch(`${API}/chat/${sessionId()}`).then((r) => r.json()).then((h) => setMessages(h.map((m) => ({ role: m.role, content: m.content })))).catch(() => {});
  }, [chatOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, chatOpen]);

  const send = async (text) => {
    const msg = (text ?? input).trim();
    if (!msg || busy) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", content: msg }, { role: "assistant", content: "" }]);
    setBusy(true);
    try {
      const res = await fetch(`${API}/chat`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ session_id: sessionId(), message: msg, site, lang }) });
      if (!res.ok || !res.body) throw new Error("chat failed");
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = "";
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const parts = buf.split("\n\n");
        buf = parts.pop();
        for (const p of parts) {
          const line = p.replace(/^data: /, "").trim();
          if (!line || line === "[DONE]") continue;
          const ev = JSON.parse(line);
          if (ev.error) throw new Error(ev.error);
          if (ev.delta) setMessages((m) => {
            const c = [...m];
            const last = c[c.length - 1];
            if (last?.role === "assistant") c[c.length - 1] = { role: "assistant", content: last.content + ev.delta };
            else c.push({ role: "assistant", content: ev.delta });
            return c;
          });
        }
      }
    } catch {
      setMessages((m) => {
        const c = [...m];
        const last = c[c.length - 1];
        if (last?.role === "assistant" && !last.content) c[c.length - 1] = { role: "assistant", content: t.chat.error };
        else c.push({ role: "assistant", content: t.chat.error });
        return c;
      });
    } finally {
      setBusy(false);
    }
  };

  const quick = [
    { id: "menu", icon: UtensilsCrossed, label: t.chat.quick.menu, href: "/#menu" },
    { id: "book", icon: CalendarDays, label: t.chat.quick.book, onClick: () => { setChatOpen(false); openBooking(); } },
    { id: "team", icon: WaIcon, label: t.chat.quick.team, href: `https://wa.me/${loc.whatsapp}`, ext: true },
    { id: "directions", icon: MapPin, label: t.chat.quick.directions, href: loc.mapsUrl, ext: true },
  ];

  return (
    <>
      <button onClick={() => setChatOpen(!chatOpen)} data-testid="chat-toggle" aria-label={t.chat.open} className="fixed bottom-[152px] lg:bottom-[88px] right-6 z-50 w-14 h-14 rounded-full bg-ink border-2 border-ink shadow-hard-sm btn-lift flex items-center justify-center">
        {chatOpen ? <X className="w-6 h-6 text-lemon" /> : <img src="/brand/mark-yellow.svg" alt="" className="w-14 h-14" />}
      </button>
      <AnimatePresence>
        {chatOpen && (
          <motion.div initial={{ opacity: 0, y: 20, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.96 }} data-testid="chat-panel" className="fixed z-50 left-4 right-4 sm:left-auto sm:right-6 bottom-[216px] lg:bottom-[156px] sm:w-[380px] max-h-[70vh] bg-cream border-2 border-ink rounded-3xl shadow-hard flex flex-col overflow-hidden">
            <div className="flex items-center gap-3 px-4 py-3 bg-lemon border-b-2 border-ink">
              <img src="/brand/mark-dark.svg" alt="" className="w-10 h-10" />
              <div><p className="font-display text-2xl text-ink leading-none">{t.chat.title}</p><p className="text-[11px] font-bold text-ink/60 uppercase tracking-wide">{t.chat.subtitle} · {SITE_NAME[site]}</p></div>
            </div>
            <div data-testid="chat-messages" className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-2 text-sm">
              <div className="self-start max-w-[85%] bg-white border-2 border-ink rounded-2xl rounded-bl-md px-3 py-2 font-medium">{t.chat.hello.replace("{site}", SITE_NAME[site])}</div>
              {messages.map((m, i) => (
                <div key={i} data-testid={`chat-msg-${m.role}`} className={`max-w-[85%] border-2 border-ink rounded-2xl px-3 py-2 font-medium whitespace-pre-wrap ${m.role === "user" ? "self-end bg-lemon rounded-br-md" : "self-start bg-white rounded-bl-md"}`}>
                  {m.content || <span className="inline-block w-8 animate-pulse">…</span>}
                </div>
              ))}
              <div ref={endRef} />
            </div>
            <div className="px-3 pt-2 grid grid-cols-2 gap-2">
              {quick.map(({ id, icon: Icon, label, href, onClick, ext }) => {
                const cls = "inline-flex items-center gap-1.5 border-2 border-ink rounded-full px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide bg-white hover:bg-lemon transition-colors";
                return onClick ? (
                  <button key={id} onClick={onClick} data-testid={`chat-quick-${id}`} className={cls}><Icon className="w-3.5 h-3.5 text-ink" /> {label}</button>
                ) : (
                  <a key={id} href={href} target={ext ? "_blank" : undefined} rel={ext ? "noreferrer" : undefined} onClick={() => !ext && setChatOpen(false)} data-testid={`chat-quick-${id}`} className={cls}><Icon className="w-3.5 h-3.5 text-ink" /> {label}</a>
                );
              })}
            </div>
            <form onSubmit={(e) => { e.preventDefault(); send(); }} className="p-3 flex gap-2">
              <input value={input} onChange={(e) => setInput(e.target.value)} data-testid="chat-input" placeholder={t.chat.placeholder} className="flex-1 border-2 border-ink rounded-full h-11 px-4 font-medium bg-white focus:outline-none focus:ring-2 focus:ring-ocean" />
              <button type="submit" disabled={busy || !input.trim()} data-testid="chat-send" aria-label="Invia" className="w-11 h-11 rounded-full bg-ink text-lemon border-2 border-ink flex items-center justify-center disabled:opacity-40"><Send className="w-5 h-5" /></button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
