export const messages = {
  en: {
    appName: "Renewi Access Operations",
    common: {
      retry: "Try again",
      search: "Search people, companies, visits, sites, or passes",
      localDemo: "Local demo data"
    }
  },
  nl: {
    appName: "Renewi Toegangsbeheer",
    common: {
      retry: "Opnieuw proberen",
      search: "Zoek personen, bedrijven, bezoeken, locaties of passen",
      localDemo: "Lokale demogegevens"
    }
  }
} as const;

export type SupportedLocale = keyof typeof messages;

/**
 * Returns locale-ready UI messages with English as the safe default.
 *
 * @param locale - Requested UI locale.
 * @returns Message dictionary for the configured locale.
 */
export function getMessages(locale: SupportedLocale = "en") {
  return messages[locale];
}
