import Marquee from "react-fast-marquee";
import { WarmBackdrop } from "./WarmBackdrop";
import { KineticLines } from "./Kinetic";
import { imgUrl } from "../lib/img";

const REAL = "https://images.myguide-cdn.com/malaga/companies/kalama-malaga-seafood-bar/large/";

const IMAGES = [
  REAL + "kalama-malaga-seafood-bar-1-7495721.jpg",
  REAL + "kalama-malaga-seafood-bar-2-7495722.jpg",
  REAL + "kalama-malaga-seafood-bar-4-7495724.jpg",
  REAL + "kalama-malaga-seafood-bar-0-7495720.jpg",
  REAL + "kalama-malaga-seafood-bar-3-7495723.jpg",
];

export const Gallery = ({ t, images, siteImages = {} }) => {
  const list = images && images.length ? [...images, ...IMAGES].slice(0, 10) : IMAGES;
  return (
    <section id="galleria" data-testid="gallery-section" className="relative py-24 sm:py-32 bg-cream overflow-hidden">
      <WarmBackdrop images={siteImages} srcKey="bg-gallery" opacity={0.95} overlay="bg-gradient-to-b from-cream/70 via-cream/10 to-cream/70" />
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-8 mb-12">
        <span className="text-coral font-bold uppercase tracking-widest text-sm">{t.gallery.kicker}</span>
        <KineticLines
          lines={t.gallery.titleLines}
          className="font-display text-5xl sm:text-6xl lg:text-8xl leading-[0.92] mt-4 text-ink"
        />
      </div>
      <div className="relative z-10">
      <Marquee speed={25} gradient={false} pauseOnHover>
        {list.map((src, i) => (
          <div
            key={i}
            data-testid={`gallery-image-${i}`}
            className={`mx-3 border-2 border-ink rounded-3xl overflow-hidden shadow-hard-sm ${i % 2 === 0 ? "rotate-1" : "-rotate-1"}`}
          >
            <img src={imgUrl(src)} alt="Kalamà gallery" loading="lazy" className="h-64 w-80 object-cover" />
          </div>
        ))}
      </Marquee>
      </div>
    </section>
  );
};
