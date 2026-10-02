// PROTOTYPE, throwaway: the post-reveal strings view on mock data, at
// /prototype/reveal. What Stringscout becomes after Reveal Day (7 Oct 2026).
// The entities view is at /prototype/reveal/entities.
import type { Metadata } from "next";
import { TopBar } from "@/components/PageHeader";
import { buildMock } from "./mock";
import Header from "./Header";
import Reveal from "./Variants";

export const metadata: Metadata = {
  title: "Reveal prototype",
  robots: { index: false, follow: false },
};

export default function Page() {
  const data = buildMock();
  return (
    <>
      <TopBar current="/" />
      <Header stats={data.stats} current="strings" />
      <Reveal data={data} />
    </>
  );
}
