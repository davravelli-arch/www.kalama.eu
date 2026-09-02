import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import { MapPin } from "lucide-react";
import { KineticLines } from "./Kinetic";
import { imgUrl, ALL_CATEGORIES, DRINK_CATEGORIES, LOCATIONS } from "../lib/img";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const Price = ({ item, t, className }) => (
  <span data-testid={`menu-price-${item.id}`} className={className}>
    {t.menu.currency}{item.price.toFixed(2)}
    {item.price_max ? ` / ${t.menu.currency}${item.price_max.toFixed(2)}` : ""}
  </span>
);

const FoodCard = ({ item, i, t, field, wide }) => (
  <motion.article
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ delay: (i % 4) * 0.08 }}
    data-testid={`menu-item-${item.id}`}
    className={`group border-2 border-ink rounded-3xl overflow-hidden bg-cream shadow-hard-sm btn-lift ${wide ? "sm:col-span-2" : ""}`}
  >
    <div className="relative overflow-hidden border-b-2 border-ink bg-lemon/40">
      {item.image ? (
        <img src={imgUrl(item.image)} alt={field(item, "name")} loading="lazy" className="w-full h-48 object-cover transition-transform duration-500 group-hover:scale-110" />
      ) : (
        <div className="w-full h-48 flex items-center justify-center">
          <img src="/brand/mark-dark.svg" alt="" className="h-20 opacity-30" />
        </div>
      )}
      {field(item, "tag") && (
        <span className="absolute top-3 left-3 bg-lemon border-2 border-ink rounded-full px-3 py-1 text-xs font-bold uppercase shadow-hard-sm">
          {field(item, "tag")}
        </span>
      )}
    </div>
    <div className="p-5 bg-cream group-hover:bg-lemon transition-colors duration-300">
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-display text-2xl tracking-wide text-ink leading-none">{field(item, "name")}</h3>
        <Price item={item} t={t} className="font-display text-2xl text-ocean whitespace-nowrap" />
      </div>
      {field(item, "desc") && <p className="text-sm text-ink/70 mt-2 font-medium">{field(item, "desc")}</p>}
    </div>
  </motion.article>
);

const DrinkRow = ({ item, t, field }) => (
  <div data-testid={`menu-item-${item.id}`} className="flex items-baseline justify-between gap-4 py-3 border-b border-ink/15 last:border-0">
    <div className="min-w-0">
      <p className="font-bold text-ink leading-tight">{field(item, "name")}</p>
      {field(item, "desc") && <p className="text-xs text-ink/60 font-medium mt-0.5">{field(item, "desc")}</p>}
    </div>
    <Price item={item} t={t} className="font-display text-xl text-ocean whitespace-nowrap" />
  </div>
);

export const MenuSection = ({ t, lang }) => {
  const [items, setItems] = useState([]);
  const [loc, setLoc] = useState("malaga");
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${API}/menu`).then((res) => setItems(res.data)).catch((e) => console.error(e)).finally(() => setLoading(false));
  }, []);

  const locItems = useMemo(() => items.filter((i) => (i.location || "malaga") === loc), [items, loc]);
  const cats = useMemo(() => ALL_CATEGORIES.filter((c) => locItems.some((i) => i.category === c)), [locItems]);
  const visible = filter === "all" ? locItems : locItems.filter((i) => i.category === filter);
  const food = visible.filter((i) => !DRINK_CATEGORIES.includes(i.category));
  const drinkCats = cats.filter((c) => DRINK_CATEGORIES.includes(c) && visible.some((i) => i.category === c));
  const field = (item, key) => item[`${key}_${lang}`] || item[`${key}_en`];

  const switchLoc = (l) => { setLoc(l); setFilter("all"); };

  return (
    <section id="menu" data-testid="menu-section" className="py-24 sm:py-32 bg-white border-y-2 border-ink">
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        <span className="text-ocean font-bold uppercase tracking-widest text-sm">{t.menu.kicker}</span>
        <KineticLines lines={t.menu.titleLines} className="font-display text-5xl sm:text-6xl lg:text-8xl leading-[0.92] mt-4 text-ink" />
        <p className="text-base sm:text-lg text-ink/70 mt-4 font-medium max-w-xl">{t.menu.subtitle}</p>

        <div data-testid="menu-location-switch" className="inline-flex mt-8 border-2 border-ink rounded-full bg-cream p-1 shadow-hard-sm">
          {LOCATIONS.map((l) => (
            <button
              key={l}
              data-testid={`menu-location-${l}`}
              onClick={() => switchLoc(l)}
              className={`inline-flex items-center gap-2 rounded-full px-5 py-2 font-display text-xl tracking-wide transition-colors ${loc === l ? "bg-ink text-lemon" : "text-ink hover:bg-lemon"}`}
            >
              <MapPin className="w-4 h-4" /> {t.menu.locations[l]}
            </button>
          ))}
        </div>
        <p data-testid="menu-note" className="block sm:inline-block sm:ml-4 mt-3 sm:mt-0 bg-lemon border-2 border-ink rounded-full px-5 py-2 text-sm font-bold shadow-hard-sm">
          {t.menu.notes[loc]}
        </p>

        <div data-testid="menu-filters" className="flex flex-wrap gap-3 mt-8">
          {["all", ...cats].map((c) => (
            <button
              key={c}
              data-testid={`menu-filter-${c}`}
              onClick={() => setFilter(c)}
              className={`border-2 border-ink rounded-full px-4 py-1.5 font-bold text-xs sm:text-sm uppercase tracking-wide transition-colors shadow-hard-sm btn-lift ${filter === c ? "bg-ink text-lemon" : "bg-cream text-ink hover:bg-lemon"}`}
            >
              {c === "all" ? t.menu.all : t.menu.categories[c]}
            </button>
          ))}
        </div>

        {loading ? (
          <p data-testid="menu-loading" className="mt-16 font-bold text-ink/60">{t.menu.loading}</p>
        ) : (
          <>
            {food.length > 0 && (
              <div data-testid="menu-grid" className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-12">
                {food.map((item, i) => (
                  <FoodCard key={item.id} item={item} i={i} t={t} field={field} wide={filter === "all" && i % 7 === 0} />
                ))}
              </div>
            )}
            {drinkCats.length > 0 && (
              <div data-testid="menu-drinks" className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
                {drinkCats.map((c) => (
                  <div key={c} data-testid={`menu-drinks-${c}`} className="border-2 border-ink rounded-3xl bg-cream shadow-hard-sm p-6">
                    <h3 className="font-display text-3xl text-ink tracking-wide mb-2">{t.menu.categories[c]}</h3>
                    {visible.filter((i) => i.category === c).map((item) => (
                      <DrinkRow key={item.id} item={item} t={t} field={field} />
                    ))}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
};
