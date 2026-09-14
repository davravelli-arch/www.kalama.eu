const SUPPORTED_LANGUAGES = new Set(["it", "en", "es", "de", "fr", "pt"]);

export function getInitialLanguage(storage = window.localStorage, browser = window.navigator) {
  const savedLanguage = storage.getItem("kalama_lang");
  if (SUPPORTED_LANGUAGES.has(savedLanguage)) return savedLanguage;

  const browserLanguages = browser.languages?.length
    ? browser.languages
    : [browser.language];

  for (const locale of browserLanguages) {
    const language = String(locale || "").toLowerCase().split("-")[0];
    if (SUPPORTED_LANGUAGES.has(language)) return language;
  }

  // English is the most useful common language for visitors whose browser
  // language is not one of the six translations currently available.
  return "en";
}
