import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const nextConfig: NextConfig = {
  // Anciennes pages : la cuisine se règle depuis Recettes, le compte depuis Profil.
  // Temporaires (307) tant que la navigation peut encore bouger.
  redirects() {
    return [
      { source: "/connexion", destination: "/profil", permanent: false },
      { source: "/cuisine", destination: "/recettes", permanent: false },
    ];
  },
};

// Lit src/i18n/request.ts (langue + messages de chaque requête).
export default createNextIntlPlugin()(nextConfig);
