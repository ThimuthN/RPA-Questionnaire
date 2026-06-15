import type { MetadataRoute } from "next";
import { getConfiguredAppUrl } from "@/lib/server/app-url";

export default function robots(): MetadataRoute.Robots {
  const base = getConfiguredAppUrl() ?? "http://localhost:3000";
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/jobs", "/privacy", "/terms"],
        // Keep the internal product surface and all APIs out of search indexes.
        disallow: [
          "/api/",
          "/people/",
          "/departments/",
          "/results/",
          "/assessments/",
          "/create-test/",
          "/addons/",
          "/users/",
          "/access-roles/",
          "/integrations/",
          "/login",
          "/upload/",
          "/schedule/",
          "/quick/",
          "/employee/",
          "/run-test"
        ]
      }
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base
  };
}
