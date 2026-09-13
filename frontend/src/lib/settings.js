import { locations, socials } from "../locations";

const ACTION_KEY = { delivery_url: "order", booking_url: "book" };

export const applySettings = (settings) => {
  if (!settings) return;
  for (const loc of locations) {
    const ov = settings[loc.id] || {};
    for (const k of ["address", "phone", "email", "hours_it", "hours_en", "mapsUrl"]) if (ov[k]) loc[k] = ov[k];
    if (ov.phone) loc.phoneHref = `tel:${ov.phone.replace(/[^\d+]/g, "")}`;
    if (ov.whatsapp) loc.whatsapp = ov.whatsapp.replace(/\D/g, "");
    for (const [field, kind] of Object.entries(ACTION_KEY)) {
      const a = loc.actions.find((x) => x.kind === kind);
      if (ov[field] && a) a.url = ov[field];
    }
  }
  if (settings.socials?.instagram) socials.instagram = settings.socials.instagram;
  if (settings.socials?.facebook) socials.facebook = settings.socials.facebook;
};

export const heroOverride = (settings, site, lang) => {
  const ov = settings?.[site === "malta" ? "sliema" : "malaga"] || {};
  return lang === "it" ? ov.hero_it || "" : ov.hero_en || "";
};
