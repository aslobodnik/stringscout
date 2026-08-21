import type { MetadataRoute } from "next";
import { SITE } from "@/data/meta";

// Everything here is a public record compiled from public sources, so nothing
// is disallowed — including to the AI crawlers, which are named only to say so
// explicitly rather than to leave it to a wildcard they may read differently.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/" },
      {
        userAgent: [
          "GPTBot",
          "OAI-SearchBot",
          "ChatGPT-User",
          "ClaudeBot",
          "Claude-User",
          "Claude-SearchBot",
          "PerplexityBot",
          "Google-Extended",
          "Applebot-Extended",
          "CCBot",
        ],
        allow: "/",
      },
    ],
    sitemap: `${SITE}/sitemap.xml`,
    host: SITE,
  };
}
