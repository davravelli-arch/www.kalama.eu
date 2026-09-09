import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { ArrowLeft, MapPin } from "lucide-react";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";
import { KineticLines } from "./Kinetic";
import { ReviewCard, GoogleReviewCard, Stars } from "./ReviewCard";
import { LOCATIONS } from "../lib/img";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const GoogleBlock = ({ place, t }) => (
  <div data-testid={`google-place-${place.location}`} className="border-2 border-ink rounded-3xl bg-white p-6 sm:p-8 shadow-hard">
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div>
        <p className="font-display text-3xl text-ink tracking-wide">{t.menu.locations[place.location]}</p>
        <p className="text-xs font-bold uppercase tracking-widest text-ink/50">{t.reviews.google}</p>
      </div>
      <div className="flex items-center gap-3">
        <span className="font-display text-4xl text-ink">{place.rating?.toFixed(1)}</span>
        <div>
          <Stars value={place.rating || 0} />
          <p className="text-xs font-bold text-ink/60">{place.count} {t.reviews.ratings} {t.reviews.on} Google</p>
        </div>
      </div>
    </div>
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
      {place.reviews.map((r, i) => <GoogleReviewCard key={r.mapsUri || i} review={r} t={t} idx={`${place.location}-${i}`} />)}
    </div>
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs font-medium text-ink/50">
      <span>{t.reviews.googleNote}</span>
      {place.mapsUri && <a href={place.mapsUri} target="_blank" rel="noreferrer" className="font-bold text-ocean uppercase tracking-wide hover:underline">{t.reviews.viewOnGoogle}</a>}
    </div>
  </div>
);

export default function ReviewsPage({ t, lang, setLang }) {
  const [reviews, setReviews] = useState(null);
  const [google, setGoogle] = useState({ enabled: false, places: [] });
  const [loc, setLoc] = useState("all");

  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = `Kalamà — ${t.nav.reviews}`;
    axios.get(`${API}/reviews`).then((r) => setReviews(r.data)).catch(() => setReviews([]));
  }, [t]);

  useEffect(() => {
    axios.get(`${API}/reviews/google`, { params: { lang } }).then((r) => setGoogle(r.data)).catch(() => {});
  }, [lang]);

  const list = (reviews || []).filter((r) => loc === "all" || r.location === loc);

  return (
    <div className="App font-body bg-cream text-ink min-h-screen pb-16 lg:pb-0">
      <Navbar />
      <main data-testid="reviews-page" className="pt-28 sm:pt-36 pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <Link to="/" data-testid="reviews-back-home" className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-ink/60 hover:text-ocean transition-colors">
            <ArrowLeft className="w-4 h-4" /> {t.reviews.back}
          </Link>
          <span className="block text-ocean font-bold uppercase tracking-widest text-sm mt-8">{t.reviews.kicker}</span>
          <KineticLines lines={t.reviews.pageTitle} className="font-display text-5xl sm:text-6xl lg:text-8xl leading-[0.92] mt-4 text-ink" />
          <p className="text-base sm:text-lg text-ink/70 mt-4 font-medium max-w-xl">{t.reviews.pageSubtitle}</p>

          {google.enabled && google.places.length > 0 && (
            <div data-testid="google-reviews" className="mt-14 flex flex-col gap-8">
              {google.places.map((p) => <GoogleBlock key={p.location} place={p} t={t} />)}
            </div>
          )}

          <div className="mt-16 flex flex-wrap items-center justify-between gap-4">
            <h2 className="font-display text-4xl text-ink tracking-wide">{t.reviews.curated}</h2>
            <div data-testid="reviews-location-filter" className="inline-flex border-2 border-ink rounded-full bg-white p-1 shadow-hard-sm">
              {["all", ...LOCATIONS].map((l) => (
                <button key={l} onClick={() => setLoc(l)} data-testid={`reviews-filter-${l}`} className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 font-bold text-xs sm:text-sm uppercase tracking-wide transition-colors ${loc === l ? "bg-ink text-lemon" : "text-ink hover:bg-lemon"}`}>
                  {l !== "all" && <MapPin className="w-3.5 h-3.5" />}{l === "all" ? t.reviews.all : t.menu.locations[l]}
                </button>
              ))}
            </div>
          </div>

          {reviews && list.length === 0 ? (
            <p data-testid="reviews-empty" className="mt-10 font-bold text-ink/50">{t.reviews.empty}</p>
          ) : (
            <div data-testid="reviews-page-grid" className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 mt-10">
              {list.map((r, i) => <ReviewCard key={r.id} review={r} t={t} i={i} dark={i % 4 === 2} />)}
            </div>
          )}
        </div>
      </main>
      <Footer t={t} />
    </div>
  );
}
