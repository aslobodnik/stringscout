import type { MetadataRoute } from "next";
import { SITE, lastUpdated } from "@/data/meta";

// lastModified is the date the data changed, not the date the build ran: a
// rebuild that adds nothing should not tell a crawler every page is new.
export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    { path: "", priority: 1 },
    { path: "/applicants", priority: 0.8 },
    { path: "/overlap", priority: 0.8 },
    { path: "/explore", priority: 0.7 },
    { path: "/people", priority: 0.7 },
    { path: "/sources", priority: 0.6 },
    { path: "/withdrawn", priority: 0.5 },
  ];
  return routes.map(({ path, priority }) => ({
    url: `${SITE}${path}`,
    lastModified: lastUpdated,
    changeFrequency: "daily" as const,
    priority,
  }));
}
