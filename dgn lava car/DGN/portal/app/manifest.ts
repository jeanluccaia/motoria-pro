import type { MetadataRoute } from "next";

// PWA manifest — instalável na tela de início do celular. Beta P0: manifest
// mínimo. Ícones vêm de app/icon.png e app/apple-icon.png (auto-metadata
// do Next 16).
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "DGN Club",
    short_name: "DGN Club",
    description: "Portal do assinante DGN Club — planos Essential, Smart e Priority.",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0A0A0A",
    theme_color: "#0A0A0A",
    lang: "pt-BR",
    dir: "ltr",
    icons: [
      { src: "/icon.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/apple-icon.png", sizes: "180x180", type: "image/png", purpose: "any" },
    ],
  };
}
