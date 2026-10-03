import type messages from "../../messages/fr.json";
import type { AppLocale } from "./locales";

// Les clés de messages/fr.json font foi : une clé absente ou mal écrite est une erreur de type.
declare module "next-intl" {
  interface AppConfig {
    Locale: AppLocale;
    Messages: typeof messages;
  }
}
