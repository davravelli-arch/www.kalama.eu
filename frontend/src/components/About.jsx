import { motion } from "framer-motion";
import { Waves, Timer, UtensilsCrossed } from "lucide-react";

export const About = ({ t }) => {
  const stats = [
    { icon: Waves, text: t.about.stat1, bg: "bg-ocean" },
    { icon: Timer, text: t.about.stat2, bg: "bg-coral" },
    { icon: UtensilsCrossed, text: t.about.stat3, bg: "bg-lemon" },
  ];

  return (
    <section id="chi-siamo" data-testid="about-section" className="py-24 sm:py-32 bg-cream overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 grid lg:grid-cols-2 gap-16 items-center">
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          <span className="text-coral font-bold uppercase tracking-widest text-sm">{t.about.kicker}</span>
          <h2 className="font-display text-5xl sm:text-6xl lg:text-7xl leading-[0.95] mt-4 text-ink">
            {t.about.title}
          </h2>
          <p className="text-base sm:text-lg text-ink/80 mt-8 font-medium">{t.about.p1}</p>
          <p className="text-base sm:text-lg text-ink/80 mt-4 font-medium">{t.about.p2}</p>

          <div className="flex flex-col gap-4 mt-10">
            {stats.map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                data-testid={`about-stat-${i}`}
                className={`inline-flex items-center gap-3 ${s.bg} ${s.bg === "bg-lemon" ? "text-ink" : "text-white"} border-2 border-ink rounded-full px-5 py-3 font-bold text-sm sm:text-base shadow-hard-sm w-fit`}
              >
                <s.icon className="w-5 h-5" strokeWidth={2.5} />
                {s.text}
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 40, rotate: 3 }}
          whileInView={{ opacity: 1, x: 0, rotate: 2 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="relative"
        >
          <div className="border-2 border-ink rounded-3xl overflow-hidden shadow-hard grain">
            <img
              src="https://images.pexels.com/photos/29039528/pexels-photo-29039528.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940"
              alt="Kalama street food atmosphere"
              className="w-full h-[480px] object-cover"
            />
          </div>
          <div className="absolute -bottom-6 -left-6 bg-coral border-2 border-ink rounded-2xl px-6 py-4 shadow-hard-sm -rotate-3">
            <span className="font-display text-2xl text-white tracking-wide">{t.hero.since}</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
