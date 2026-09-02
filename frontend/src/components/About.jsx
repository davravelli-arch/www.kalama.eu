import { motion } from "framer-motion";
import { KineticLines } from "./Kinetic";
import { imgUrl } from "../lib/img";

const DEFAULT_IMG = "https://images.myguide-cdn.com/malaga/companies/kalama-malaga-seafood-bar/large/kalama-malaga-seafood-bar-3-7495723.jpg";

export const About = ({ t, image }) => {
  return (
    <section id="chi-siamo" data-testid="about-section" className="py-24 sm:py-32 bg-cream overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        <div className="grid lg:grid-cols-12 gap-14 items-center mb-20">
          <div className="lg:col-span-7">
            <span className="text-coral font-bold uppercase tracking-widest text-sm">{t.about.kicker}</span>
            <KineticLines
              lines={t.about.titleLines}
              className="font-display text-5xl sm:text-6xl lg:text-8xl leading-[0.92] mt-4 text-ink"
            />
            <motion.p
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3, duration: 0.7 }}
              className="text-base sm:text-lg text-ink/80 mt-8 font-medium max-w-xl"
            >
              {t.about.p1}
            </motion.p>
            <motion.p
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.45, duration: 0.7 }}
              className="text-base sm:text-lg text-ink/80 mt-4 font-medium max-w-xl"
            >
              {t.about.p2}
            </motion.p>
          </div>

          <motion.div
            initial={{ opacity: 0, x: 40, rotate: 4 }}
            whileInView={{ opacity: 1, x: 0, rotate: 2 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="lg:col-span-5 relative"
          >
            <div className="border-2 border-ink rounded-3xl overflow-hidden shadow-hard grain">
              <img
                src={imgUrl(image) || DEFAULT_IMG}
                data-testid="about-image"
                alt="Kalamà street food di mare"
                loading="lazy"
                className="w-full h-[440px] object-cover"
              />
            </div>
            <div className="absolute -bottom-6 -left-6 bg-coral border-2 border-ink rounded-2xl px-6 py-4 shadow-hard-sm -rotate-3">
              <span className="font-display text-2xl text-ink tracking-wide">{t.hero.since}</span>
            </div>
          </motion.div>
        </div>

        <div className="grid md:grid-cols-3 border-t-2 border-ink">
          {t.about.chapters.map((c, i) => (
            <motion.div
              key={c.num}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15, duration: 0.7 }}
              data-testid={`about-chapter-${c.num}`}
              className="py-10 md:px-10 md:border-l-2 md:first:border-l-0 border-ink"
            >
              <span className="font-display text-7xl sm:text-8xl text-outline block leading-none select-none">{c.num}</span>
              <h3 className="font-display text-3xl sm:text-4xl text-ink tracking-wide mt-4">{c.title}</h3>
              <p className="text-ink/70 font-medium mt-3">{c.text}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
