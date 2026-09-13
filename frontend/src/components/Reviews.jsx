import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { ArrowRight } from "lucide-react";
import { KineticLines } from "./Kinetic";
import { ReviewCard } from "./ReviewCard";
import { imgUrl } from "../lib/img";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export const Reviews = ({ t, siteImages = {} }) => {
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    axios.get(`${API}/reviews`).then((r) => setReviews(r.data)).catch((e) => console.error(e));
  }, []);

  if (reviews.length === 0) return null;
  const featured = reviews.filter((r) => r.featured);
  const shown = (featured.length ? featured : reviews).slice(0, 6);

  return (
    <section id="recensioni" data-testid="reviews-section" className="py-24 sm:py-32 bg-lemon border-b-2 border-ink relative overflow-hidden">
      {siteImages["bg-reviews"] && (
        <div aria-hidden="true" data-testid="reviews-backdrop" className="absolute inset-0 pointer-events-none">
          <img src={imgUrl(siteImages["bg-reviews"])} alt="" loading="lazy" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-ink/70 via-ink/45 to-ink/75" />
        </div>
      )}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-8">
        <span className={`font-bold uppercase tracking-widest text-sm ${siteImages["bg-reviews"] ? "text-lemon" : "text-ocean"}`}>{t.reviews.kicker}</span>
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
          <KineticLines lines={t.reviews.titleLines} className={`font-display text-5xl sm:text-6xl lg:text-8xl leading-[0.92] mt-4 ${siteImages["bg-reviews"] ? "text-cream" : "text-ink"}`} />
          <p className={`text-base sm:text-lg font-medium max-w-md lg:pb-3 ${siteImages["bg-reviews"] ? "text-cream/85" : "text-ink/70"}`}>{t.reviews.subtitle}</p>
        </div>

        <div data-testid="reviews-home-grid" className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 mt-16">
          {shown.map((r, i) => <ReviewCard key={r.id} review={r} t={t} i={i} dark={i % 3 === 1} />)}
        </div>

        <Link to="/recensioni" data-testid="reviews-view-all" className="mt-16 inline-flex items-center gap-2 bg-lemon text-ink border-2 border-ink rounded-full px-7 py-3.5 font-bold uppercase tracking-wide shadow-hard-sm btn-lift">
          {t.reviews.viewAll} <ArrowRight className="w-5 h-5" />
        </Link>
      </div>
    </section>
  );
};
