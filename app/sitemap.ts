import type { MetadataRoute } from "next";

/**
 * Sitemap route handler.
 *
 * Next.js automatically serves this at /sitemap.xml.
 * Dynamically generates sitemap entries based on the app's routes.
 *
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/metadata/sitemap
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const lastModified = new Date();

  return [
    {
      url: baseUrl,
      lastModified,
      changeFrequency: "monthly",
      priority: 1,
    },
    {
      url: `${baseUrl}/diagram`,
      lastModified,
      changeFrequency: "weekly",
      priority: 0.9,
    },
  ];
}
