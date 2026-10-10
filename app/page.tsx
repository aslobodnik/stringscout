// The post-reveal strings view on APS data. The pre-reveal page is at /archive.
import type { Metadata } from "next";
import Link from "next/link";
import { TopBar } from "@/components/PageHeader";
import PageIntro from "@/components/PageIntro";
import { buildReal } from "@/app/prototype/reveal/real";
import { LINK } from "@/app/prototype/reveal/bits";
import Reveal from "@/app/prototype/reveal/Variants";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
  description: "Every string applied for in ICANN's 2026 new gTLD round, who applied, and who stands behind them.",
};

export default function Page() {
  const data = buildReal();
  return (
    <>
      <TopBar current="/" />
      <PageIntro title="See who applied for each string in ICANN's 2026 gTLD round">
        Find contention sets. See the companies and people that own and control
        each applicant. Check which replacement strings are still free.{" "}
        {/* the one way in from the strings to the check before a conversation */}
        If you applied, see exactly who you{" "}
        <Link href="/overlap" className={LINK}>
          overlap
        </Link>{" "}
        with.
      </PageIntro>
      <Reveal data={data} />
    </>
  );
}
