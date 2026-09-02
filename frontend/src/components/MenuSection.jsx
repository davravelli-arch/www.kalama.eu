import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import { KineticLines } from "./Kinetic";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export const MenuSection = ({ t, lang }) => {
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios
      .get(`${API}/menu`)
      .then((res) => setItems(res.data))
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  }, []);

  const cats = ["all", "poke", "burger", "fritti", "mare"];
  const filtered = filter === "all" ? items : items.filter((i) => i.category === filter);

  return (
    <section id="menu" data-testid="menu-section" className="py-24 sm:py-32 bg-white border-y-2 border-ink">
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        <span className="text-ocean font-bold uppercase tracking-widest text-sm">{t.menu.kicker}</span>
        <KineticLines
          lines={t.menu.titleLines}
          className="font-display text-5xl sm:text-6xl lg:text-8xl leading-[0.92] mt-4 text-ink"
        />
        <p className="text-base sm:text-lg text-ink/70 mt-4 font-medium max-w-xl">{t.menu.subtitle}</p>

        <div data-testid="menu-filters" className="flex flex-wrap gap-3 mt-10">
          {cats.map((c) => (
            <button
              key={c}
              data-testid={`menu-filter-${c}`}
              onClick={() => setFilter(c)}
              className={`border-2 border-ink rounded-full px-5 py-2 font-bold text-sm uppercase tracking-wide transition-colors shadow-hard-sm btn-lift ${
                filter === c ? "bg-ink text-lemon" : "bg-cream text-ink hover:bg-lemon"
              }`}
            >
              {c === "all" ? t.menu.all : t.menu.categories[c]}
            </button>
          ))}
        </div>

        {loading ? (
          <p data-testid="menu-loading" className="mt-16 font-bold text-ink/60">{t.menu.loading}</p>
        ) : (
          <div data-testid="menu-grid" className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-12">
            {filtered.map((item, i) => (
              <motion.article
                key={item.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: (i % 4) * 0.1 }}
                data-testid={`menu-item-${item.id}`}
                className={`group border-2 border-ink rounded-3xl overflow-hidden bg-cream shadow-hard-sm btn-lift ${
                  filter === "all" && i % 5 === 0 ? "sm:col-span-2" : ""
                }`}
              >
                <div className="relative overflow-hidden border-b-2 border-ink">
                  <img
                    src={item.image}
                    alt={item[`name_${lang}`]}
                    loading="lazy"
                    className="w-full h-48 object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  {item[`tag_${lang}`] && (
                    <span className="absolute top-3 left-3 bg-lemon border-2 border-ink rounded-full px-3 py-1 text-xs font-bold uppercase shadow-hard-sm">
                      {item[`tag_${lang}`]}
                    </span>
                  )}
                </div>
                <div className="p-5 bg-cream group-hover:bg-lemon transition-colors duration-300">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-display text-2xl tracking-wide text-ink leading-none">
                      {item[`name_${lang}`]}
                    </h3>
                    <span data-testid={`menu-price-${item.id}`} className="font-display text-2xl text-coral whitespace-nowrap">
                      {t.menu.currency}{item.price.toFixed(2)}
                    </span>
                  </div>
                  <p className="text-sm text-ink/70 mt-2 font-medium">{item[`desc_${lang}`]}</p>
                </div>
              </motion.article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
