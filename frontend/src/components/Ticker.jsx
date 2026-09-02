import Marquee from "react-fast-marquee";
import { Fish } from "lucide-react";

export const Ticker = ({ t }) => {
  return (
    <div data-testid="ticker-strip" className="bg-lemon border-y-2 border-ink py-3 -rotate-1 scale-105 relative z-20">
      <Marquee speed={50} gradient={false}>
        {t.ticker.map((word, i) => (
          <span key={i} className="flex items-center gap-6 mx-6 font-display text-2xl sm:text-3xl text-ink tracking-wider">
            {word}
            <Fish className="w-6 h-6 text-coral" strokeWidth={2.5} />
          </span>
        ))}
      </Marquee>
    </div>
  );
};
