import Marquee from "react-fast-marquee";
import { Fish } from "lucide-react";

export const Ticker = ({ t }) => {
  return (
    <div data-testid="ticker-strip" className="bg-ink border-y-2 border-ink py-5 overflow-hidden">
      <Marquee speed={25} gradient={false}>
        {t.ticker.map((word, i) => (
          <span key={i} className="flex items-center gap-8 mx-8">
            <span className={`font-display text-4xl sm:text-5xl tracking-wide ${i % 2 === 0 ? "text-lemon" : "text-outline-cream"}`}>
              {word}
            </span>
            <Fish className="w-7 h-7 text-coral" strokeWidth={2.5} />
          </span>
        ))}
      </Marquee>
    </div>
  );
};
