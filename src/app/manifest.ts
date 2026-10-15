import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Agritech AI",
    short_name: "Agritech",
    description: "Practical support for Kenyan smallholder farmers.",
    start_url: "/",
    display: "standalone",
    background_color: "#efe6d4",
    theme_color: "#166534",
    icons: [{ src: "/icons/sprout.svg", sizes: "any", type: "image/svg+xml", purpose: "maskable" }],
  };
}
