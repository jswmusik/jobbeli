export const locales = ["sv", "en", "ar", "uk"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "sv";

export const localeNames: Record<Locale, string> = {
  sv: "Svenska",
  en: "English",
  ar: "العربية",
  uk: "Українська",
};

// RTL languages
export const rtlLocales: Locale[] = ["ar"];

export function isRtlLocale(locale: Locale): boolean {
  return rtlLocales.includes(locale);
}
