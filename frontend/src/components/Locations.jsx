import { motion } from "framer-motion";
import { WarmBackdrop } from "./WarmBackdrop";
import { MapPin, Phone, Clock, Mail, Navigation, Truck } from "lucide-react";
import { KineticLines } from "./Kinetic";
import { locations, foodTruck } from "../locations";
import { imgUrl } from "../lib/img";

export const Locations = ({ t, lang, images = {} }) => {
  return (
    <section id="sedi" data-testid="locations-section" className="relative py-24 sm:py-32 bg-cream overflow-hidden">
      <WarmBackdrop images={images} />
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-8">
        <span className="text-coral font-bold uppercase tracking-widest text-sm">{t.locations.kicker}</span>
        <KineticLines
          lines={t.locations.titleLines}
          className="font-display text-5xl sm:text-6xl lg:text-8xl leading-[0.92] mt-4 text-ink"
        />
        <p className="text-base sm:text-lg text-ink/70 mt-4 font-medium max-w-xl">{t.locations.subtitle}</p>

        <div className="grid lg:grid-cols-2 gap-10 mt-14">
          {locations.map((loc, i) => (
            <motion.article
              key={loc.id}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              data-testid={`location-card-${loc.id}`}
              className="group border-2 border-ink rounded-3xl overflow-hidden bg-white shadow-hard btn-lift"
            >
              <div className="relative h-72 overflow-hidden border-b-2 border-ink">
                <img
                  src={imgUrl(images[`location-${loc.id}`]) || loc.image}
                  data-testid={`location-image-${loc.id}`}
                  alt={loc.name}
                  loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <span
                  className="absolute top-4 left-5 font-display text-7xl text-lemon select-none"
                  style={{ textShadow: "4px 4px 0 #1D1D1B" }}
                >
                  {loc.num}
                </span>
                <span className="absolute bottom-4 left-4 bg-ink text-lemon border-2 border-lemon rounded-full px-4 py-1 text-xs font-bold uppercase tracking-widest">
                  {loc[`kind_${lang}`] || loc.kind_en}
                </span>
              </div>

              <div className="p-8">
                <h3 className="font-display text-5xl text-ink tracking-wide">{loc.name}</h3>
                <div className="flex flex-col gap-3 mt-5 text-ink/80 font-medium">
                  <p className="flex items-center gap-3">
                    <MapPin className="w-5 h-5 text-coral shrink-0" strokeWidth={2.5} />
                    {loc.address}
                  </p>
                  <a href={loc.phoneHref} data-testid={`location-phone-${loc.id}`} className="flex items-center gap-3 hover:text-coral transition-colors font-bold text-ink">
                    <Phone className="w-5 h-5 text-coral shrink-0" strokeWidth={2.5} />
                    {loc.phone}
                  </a>
                  <p className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-coral shrink-0" strokeWidth={2.5} />
                    {loc[`hours_${lang}`] || loc.hours_en}
                  </p>
                  <a href={`mailto:${loc.email}`} data-testid={`location-email-${loc.id}`} className="flex items-center gap-3 hover:text-ocean transition-colors">
                    <Mail className="w-5 h-5 text-coral shrink-0" strokeWidth={2.5} />
                    {loc.email}
                  </a>
                </div>

                <div className="flex flex-wrap gap-3 mt-7">
                  <a
                    href={loc.phoneHref}
                    data-testid={`location-call-${loc.id}`}
                    className="inline-flex items-center gap-2 bg-coral text-ink border-2 border-ink rounded-full px-5 py-2.5 font-bold text-sm uppercase tracking-wide shadow-hard-sm btn-lift"
                  >
                    <Phone className="w-4 h-4" />
                    {t.locations.call}
                  </a>
                  <a
                    href={loc.mapsUrl}
                    target="_blank"
                    rel="noreferrer"
                    data-testid={`location-directions-${loc.id}`}
                    className="inline-flex items-center gap-2 bg-white text-ink border-2 border-ink rounded-full px-5 py-2.5 font-bold text-sm uppercase tracking-wide shadow-hard-sm btn-lift"
                  >
                    <Navigation className="w-4 h-4" />
                    {t.locations.directions}
                  </a>
                  {loc.actions.map((a) => (
                    <a
                      key={a.id}
                      href={a.url}
                      target="_blank"
                      rel="noreferrer"
                      data-testid={`location-${a.id}-${loc.id}`}
                      className="inline-flex items-center gap-2 bg-ink text-lemon border-2 border-ink rounded-full px-5 py-2.5 font-bold text-sm uppercase tracking-wide shadow-hard-sm btn-lift"
                    >
                      {a.kind === "book" ? t.locations.bookOn : t.locations.orderOn} {a.label}
                    </a>
                  ))}
                </div>
              </div>
            </motion.article>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          data-testid="foodtruck-card"
          className="mt-10 bg-lemon border-2 border-ink rounded-3xl shadow-hard p-8 flex flex-col md:flex-row items-center gap-8"
        >
          <div className="border-2 border-ink rounded-2xl overflow-hidden shadow-hard-sm rotate-2 shrink-0">
            <img src={imgUrl(images.foodtruck) || foodTruck.image} data-testid="foodtruck-image" alt="Kalamà Food Truck" loading="lazy" className="w-full md:w-56 h-40 object-cover" />
          </div>
          <div className="flex-1 text-center md:text-left">
            <span className="inline-block bg-ink text-lemon rounded-full px-4 py-1 text-xs font-bold uppercase tracking-widest">
              {t.locations.truckKicker}
            </span>
            <h3 className="font-display text-4xl sm:text-5xl text-ink mt-3">
              KALAMÀ FOOD TRUCK — {foodTruck.where}
            </h3>
            <p className="text-ink/80 font-medium mt-2">{t.locations.truckText}</p>
          </div>
          <span className="bg-coral border-2 border-ink rounded-full p-5 shrink-0 animate-float">
            <Truck className="w-10 h-10 text-ink" strokeWidth={2} />
          </span>
        </motion.div>
      </div>
    </section>
  );
};
