import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const nextConfig: NextConfig = {
  // Accès en dev depuis un autre appareil du réseau (téléphone via IP LAN) :
  // sans cette autorisation, les assets de développement sont bloqués (403),
  // React ne s'hydrate pas et les appels d'API cross-origin sont refusés.
  allowedDevOrigins: ["172.20.10.2"],
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
