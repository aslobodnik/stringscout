// The post-reveal strings view on APS data. The pre-reveal page is at /archive.
import type { Metadata } from "next";
import { Suspense } from "react";
import { TopBar } from "@/components/PageHeader";
import { buildReal } from "@/app/prototype/reveal/real";
import Header from "@/app/prototype/reveal/Header";
import Reveal from "@/app/prototype/reveal/Variants";

export const metadata: Metadata = {
  description: "Every string applied for in ICANN's 2026 new gTLD round, who applied, and who stands behind them.",
};

export default function Page() {
  const data = buildReal();
  return (
    <>
      <TopBar current="/" />
      <Header stats={data.stats} current="strings" />
      <Suspense>
        <Reveal data={data} />
      </Suspense>
    </>
  );
}
