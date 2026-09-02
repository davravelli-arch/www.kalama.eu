import Marquee from "react-fast-marquee";
import { KineticLines } from "./Kinetic";

const REAL = "https://images.myguide-cdn.com/malaga/companies/kalama-malaga-seafood-bar/large/";

const IMAGES = [
  REAL + "kalama-malaga-seafood-bar-1-7495721.jpg",
  REAL + "kalama-malaga-seafood-bar-2-7495722.jpg",
  REAL + "kalama-malaga-seafood-bar-4-7495724.jpg",
  REAL + "kalama-malaga-seafood-bar-0-7495720.jpg",
  REAL + "kalama-malaga-seafood-bar-3-7495723.jpg",
  "https://images.unsplash.com/photo-1763703396043-cc821fcc4bc2?q=80&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1615141982883-c7ad0e69fd62?q=80&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1579208030886-b937da0925dc?q=80&w=800&auto=format&fit=crop",
];

export const Gallery = ({ t }) => {
  return (
    <section id="galleria" data-testid="gallery-section" className="py-24 sm:py-32 bg-cream overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 mb-12">
        <span className="text-coral font-bold uppercase tracking-widest text-sm">{t.gallery.kicker}</span>
        <KineticLines
          lines={t.gallery.titleLines}
          className="font-display text-5xl sm:text-6xl lg:text-8xl leading-[0.92] mt-4 text-ink"
        />
      </div>
      <Marquee speed={25} gradient={false} pauseOnHover>
        {IMAGES.map((src, i) => (
          <div
            key={i}
            data-testid={`gallery-image-${i}`}
            className={`mx-3 border-2 border-ink rounded-3xl overflow-hidden shadow-hard-sm ${i % 2 === 0 ? "rotate-1" : "-rotate-1"}`}
          >
            <img src={src} alt="Kalamà gallery" loading="lazy" className="h-64 w-80 object-cover" />
          </div>
        ))}
      </Marquee>
    </section>
  );
};
