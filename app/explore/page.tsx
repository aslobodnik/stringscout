import type { Metadata } from "next";
import { TopBar } from "@/components/PageHeader";
import PageIntro from "@/components/PageIntro";
import ExploreSearch from "@/components/ExploreSearch";
import { exploreRegistrations } from "@/data/existing-tlds/registrations";

const shareTitle = "Explore Related Strings — Stringscout";
const description = "Type a word or phrase. Find related strings in Stringscout’s catalog.";

export const metadata: Metadata = {
  title: "Explore",
  description,
  alternates: { canonical: "/explore" },
  openGraph: {
    title: shareTitle,
    description,
    url: "/explore",
    siteName: "Stringscout",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: shareTitle,
    description,
  },
};

export default function ExplorePage() {
  return (
    <>
      <TopBar current="/explore" />
      <main className="pb-16">
        <PageIntro title="Explore Related Strings">
          Type a word or phrase. Find related strings.
        </PageIntro>
        <ExploreSearch registrations={exploreRegistrations} />
      </main>
    </>
  );
}
