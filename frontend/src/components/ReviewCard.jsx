import { Star } from "lucide-react";

export const Stars = ({ value = 5, className = "w-4 h-4", testId }) => (
  <span data-testid={testId} className="inline-flex items-center gap-0.5" aria-label={`${value} / 5`}>
    {[1, 2, 3, 4, 5].map((n) => (
      <Star key={n} className={`${className} ${n <= Math.round(value) ? "fill-coral text-coral" : "fill-ink/10 text-ink/20"}`} strokeWidth={1.5} />
    ))}
  </span>
);

const SOURCE_LABEL = { google: "Google", tripadvisor: "TripAdvisor", thefork: "TheFork", facebook: "Facebook", other: "" };
const LOC_LABEL = { malaga: "Málaga", malta: "Sliema · Malta" };

export const ReviewCard = ({ review, t, dark = false, i = 0 }) => (
  <article
    data-testid={`review-card-${review.id}`}
    className={`relative flex flex-col border-2 border-ink rounded-3xl p-6 shadow-hard-sm ${dark ? "bg-ink text-cream" : "bg-white text-ink"} ${i % 3 === 1 ? "lg:translate-y-6" : ""}`}
  >
    <span className={`font-display text-7xl leading-none absolute -top-5 left-5 ${dark ? "text-lemon" : "text-coral"}`}>“</span>
    <Stars value={review.rating} testId={`review-stars-${review.id}`} className="w-5 h-5" />
    <p className={`mt-4 text-base font-medium leading-relaxed flex-1 ${dark ? "text-cream/90" : "text-ink/80"}`}>{review.text}</p>
    <div className="mt-5 flex items-end justify-between gap-3">
      <div>
        <p className="font-bold">{review.author}</p>
        <p className={`text-xs font-bold uppercase tracking-widest ${dark ? "text-lemon" : "text-ocean"}`}>
          {LOC_LABEL[review.location]}{review.date ? ` · ${review.date}` : ""}
        </p>
      </div>
      {SOURCE_LABEL[review.source] && (
        <span className={`text-[11px] font-bold uppercase tracking-wider rounded-full border-2 px-2.5 py-0.5 ${dark ? "border-cream/30 text-cream/70" : "border-ink/20 text-ink/60"}`}>
          {SOURCE_LABEL[review.source]}
        </span>
      )}
    </div>
  </article>
);

export const GoogleReviewCard = ({ review, t, idx }) => (
  <article data-testid={`google-review-${idx}`} className="border-2 border-ink rounded-3xl p-5 bg-cream shadow-hard-sm flex flex-col">
    <div className="flex items-center gap-3">
      {review.authorPhoto && <img src={review.authorPhoto} alt="" className="w-10 h-10 rounded-full border-2 border-ink" referrerPolicy="no-referrer" />}
      <div className="min-w-0">
        <a href={review.authorUri} target="_blank" rel="noreferrer" className="font-bold text-ink hover:text-ocean truncate block">{review.author}</a>
        <span className="text-xs font-medium text-ink/60">{review.relativeTime}</span>
      </div>
    </div>
    <Stars value={review.rating} className="w-4 h-4 mt-3" />
    <p className="mt-2 text-sm font-medium text-ink/80 leading-relaxed flex-1">{review.text}</p>
    <div className="mt-4 flex gap-4 text-xs font-bold uppercase tracking-wide">
      {review.mapsUri && <a href={review.mapsUri} target="_blank" rel="noreferrer" className="text-ocean hover:underline">{t.reviews.viewOnGoogle}</a>}
      {review.flagUri && <a href={review.flagUri} target="_blank" rel="noreferrer" className="text-ink/40 hover:underline">{t.reviews.report}</a>}
    </div>
  </article>
);
