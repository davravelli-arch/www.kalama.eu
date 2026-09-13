import { useSite } from "../lib/site";
import { imgUrl } from "../lib/img";

export const WarmBackdrop = ({ images = {}, opacity = 0.22, dark = false, srcKey, overlay }) => {
  const { site } = useSite();
  const src = imgUrl((srcKey && images[srcKey]) || images[`bg-${site}`] || images[`hero-${site}`] || images[site === "malta" ? "location-sliema" : "location-malaga"]);
  if (!src) return null;
  return (
    <div aria-hidden="true" data-testid="warm-backdrop" className="absolute inset-0 pointer-events-none">
      <img src={src} alt="" loading="lazy" className="w-full h-full object-cover" style={{ opacity }} />
      <div className={`absolute inset-0 ${overlay || (dark ? "bg-gradient-to-b from-ocean/80 via-ocean/60 to-ocean/85" : "bg-gradient-to-b from-cream via-cream/70 to-cream")}`} />
    </div>
  );
};
