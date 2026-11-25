// The post-reveal strings view on APS data. The pre-reveal page is at /archive.
import type { Metadata } from "next";
import Link from "next/link";
import { TopBar } from "@/components/PageHeader";
import PageIntro from "@/components/PageIntro";
import { buildReal, recentWithdrawals } from "@/app/prototype/reveal/real";
import { LINK } from "@/app/prototype/reveal/bits";
import { formatDate } from "@/lib/format";
import Reveal from "@/app/prototype/reveal/Variants";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
  description: "Every string applied for in ICANN's 2026 new gTLD round, who applied, and who stands behind them.",
};

export default function Page() {
  const data = buildReal();
  const recent = recentWithdrawals();
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
      {recent.length > 0 && (
        <section className="mb-8">
          <h3 className="label text-ink-soft">Recently withdrawn</h3>
          <ul className="mt-2 text-sm">
            {recent.map((g) => (
              <li key={g.date + g.applicant} className="flex gap-4 py-0.5">
                <span className="w-14 shrink-0 tabular-nums text-ink-soft">{formatDate(g.date).replace(/ \d{4}$/, "")}</span>
                <span className="shrink-0">
                  {g.tlds.map((t, i) => (
                    <span key={t}>
                      {i > 0 && " "}
                      {/* a full load: the table reads ?q= once, on mount */}
                      <a href={`/?q=${t}`} className={LINK}>.{t}</a>
                    </span>
                  ))}
                </span>
                <span className="truncate text-ink-soft">{g.applicant}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
      <Reveal data={data} />
    </>
  );
}
