import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://lahariannapoorna.in",
      lastModified: new Date(),
    },
  ];
}