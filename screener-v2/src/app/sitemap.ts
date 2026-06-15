import type { MetadataRoute } from "next";
import { getConfiguredAppUrl } from "@/lib/server/app-url";
import { listPublicJobPostings } from "@/lib/db/jobs";
import { PUBLIC_JOBS_ENABLED } from "@/lib/jobs/public-access";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getConfiguredAppUrl() ?? "http://localhost:3000";

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${base}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/jobs`, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/privacy`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${base}/terms`, changeFrequency: "yearly", priority: 0.3 }
  ];

  if (!PUBLIC_JOBS_ENABLED) {
    return staticRoutes;
  }

  try {
    const jobs = await listPublicJobPostings();
    const jobRoutes: MetadataRoute.Sitemap = jobs.map((job) => ({
      url: `${base}/jobs/${job.slug}`,
      lastModified: new Date(job.updatedAt),
      changeFrequency: "weekly",
      priority: 0.8
    }));
    return [...staticRoutes, ...jobRoutes];
  } catch {
    return staticRoutes;
  }
}
