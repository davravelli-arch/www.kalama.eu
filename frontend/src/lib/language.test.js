import { getInitialLanguage } from "./language";

const storageWith = (value) => ({ getItem: () => value });

describe("getInitialLanguage", () => {
  test("keeps a valid language previously selected by the visitor", () => {
    expect(getInitialLanguage(storageWith("it"), { languages: ["de-DE"] })).toBe("it");
  });

  test.each([
    ["es-ES", "es"],
    ["de-DE", "de"],
    ["fr-FR", "fr"],
    ["pt-BR", "pt"],
  ])("detects %s as %s", (browserLocale, expected) => {
    expect(getInitialLanguage(storageWith(null), { languages: [browserLocale] })).toBe(expected);
  });

  test("uses the first supported browser preference", () => {
    expect(getInitialLanguage(storageWith(null), { languages: ["nl-NL", "fr-FR"] })).toBe("fr");
  });

  test("falls back to English for unsupported browser languages", () => {
    expect(getInitialLanguage(storageWith(null), { language: "nl-NL" })).toBe("en");
  });
});
