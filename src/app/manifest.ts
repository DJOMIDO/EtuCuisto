import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "EtuCuisto",
    short_name: "EtuCuisto",
    description: "Vide ton frigo : des recettes rapides avec ce que tu as déjà.",
    lang: "fr",
    start_url: "/",
    display: "standalone",
    background_color: "#faf8f4",
    theme_color: "#00707e",
    icons: [
      { src: "/icons/app/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/app/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/app/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
