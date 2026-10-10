import type { Metadata } from "next";

// A page's own title and address, for search engines and on a shared link.
// The root sets no canonical, so a page without one claims no other page's
// address; without its own og:url a page inherits the home page's, which
// Facebook and LinkedIn follow to the home card.
export function share(title: string, path: string, description?: string): Pick<Metadata, "alternates" | "openGraph" | "twitter"> {
  const t = `${title} — Stringscout`;
  return {
    alternates: { canonical: path },
    openGraph: { title: t, description, url: path, siteName: "Stringscout", type: "website" },
    twitter: { card: "summary_large_image", title: t, description },
  };
}
