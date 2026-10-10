// The post-reveal strings view on APS data. The pre-reveal page is at /archive.
import type { Metadata } from "next";
import Link from "next/link";
import { TopBar } from "@/components/PageHeader";
import { buildReal } from "@/app/prototype/reveal/real";
import { LINK } from "@/app/prototype/reveal/bits";
import Reveal from "@/app/prototype/reveal/Variants";

export const metadata: Metadata = {
  description: "Every string applied for in ICANN's 2026 new gTLD round, who applied, and who stands behind them.",
};

export default function Page() {
  const data = buildReal();
  return (
    <>
      <TopBar current="/" />
      {/* the one way in from the strings to the check before a conversation */}
      <p className="pt-6 pb-6">
        <Link
          href="/overlap"
          className={`${LINK} label text-ink !text-xs !tracking-[0.1em] sm:!text-sm sm:!tracking-[0.18em]`}
        >
          Applicant? <span className="whitespace-nowrap">Find who you overlap with →</span>
        </Link>
      </p>
      <Reveal data={data} />
    </>
  );
}
