import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "うちの在庫",
    short_name: "うちの在庫",
    description: "家庭の食品在庫・賞味期限・買い物リストを管理するアプリ",
    start_url: "/inventory",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#ffffff",
    theme_color: "#16a34a",
    lang: "ja",
    icons: [
      {
        src: "/icon1",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon2",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon2",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
