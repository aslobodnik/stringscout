import type { Metadata } from "next";

// A page's own title and address on a shared link. Without it a page inherits
// the root's og:url, and Facebook and LinkedIn follow that to the home card.
export function share(title: string, path: string, description?: string): Pick<Metadata, "openGraph" | "twitter"> {
  const t = `${title} — Stringscout`;
  return {
    openGraph: { title: t, description, url: path, siteName: "Stringscout", type: "website" },
    twitter: { card: "summary_large_image", title: t, description },
  };
}
