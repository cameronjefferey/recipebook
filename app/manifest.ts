import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "The Pink Recipe Box",
    short_name: "Recipe Box",
    description: "Every recipe worth keeping.",
    start_url: "/box",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#fdf6ea",
    theme_color: "#c2566f",
    icons: [
      {
        src: "/pwa-icon/192",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/pwa-icon/512",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/pwa-icon/512",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
