import type { Metadata } from "next";
import { TopBar } from "@/components/PageHeader";
import ExploreSearch from "@/components/ExploreSearch";

export const metadata: Metadata = {
  title: "Explore",
  description: "Type a word or phrase. Find related strings in Stringscout’s catalog.",
  alternates: { canonical: "/explore" },
};

export default function ExplorePage() {
  return (
    <>
      <TopBar current="/explore" />
      <main className="pb-16">
        <header className="pt-12 pb-8 sm:pt-16 sm:pb-10">
          <h1 className="serif max-w-3xl text-[clamp(2.75rem,6.8vw,4.75rem)] leading-[1.06] tracking-[-0.035em]">
            Explore Related Strings
          </h1>
          <h2 className="mt-5 text-lg text-ink-soft sm:text-xl">
            Type a word or phrase. Find related strings.
          </h2>
        </header>
        <ExploreSearch />
      </main>
    </>
  );
}
