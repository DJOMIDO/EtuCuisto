import type { NextConfig } from "next";

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

export default nextConfig;
