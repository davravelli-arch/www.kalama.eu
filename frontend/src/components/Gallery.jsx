import Marquee from "react-fast-marquee";

const IMAGES = [
  "https://images.pexels.com/photos/29039528/pexels-photo-29039528.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
  "https://images.unsplash.com/photo-1763703396043-cc821fcc4bc2?q=80&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1579208030886-b937da0925dc?q=80&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1615141982883-c7ad0e69fd62?q=80&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1597958792579-bd3517df6399?q=80&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1671522635273-f70d28b00493?q=80&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1559742811-822873691df8?q=80&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1583212292454-1fe6229603b7?q=80&w=800&auto=format&fit=crop",
];

export const Gallery = ({ t }) => {
  return (
    <section id="galleria" data-testid="gallery-section" className="py-24 sm:py-32 bg-cream overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 mb-12">
        <span className="text-coral font-bold uppercase tracking-widest text-sm">{t.gallery.kicker}</span>
        <h2 className="font-display text-5xl sm:text-6xl lg:text-7xl leading-[0.95] mt-4 text-ink">
          {t.gallery.title}
        </h2>
      </div>
      <Marquee speed={40} gradient={false} pauseOnHover>
        {IMAGES.map((src, i) => (
          <div
            key={i}
            data-testid={`gallery-image-${i}`}
            className={`mx-3 border-2 border-ink rounded-3xl overflow-hidden shadow-hard-sm ${i % 2 === 0 ? "rotate-1" : "-rotate-1"}`}
          >
            <img src={src} alt="Kalama gallery" loading="lazy" className="h-64 w-80 object-cover" />
          </div>
        ))}
      </Marquee>
    </section>
  );
};
