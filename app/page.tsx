import { applicantBackers, applicantMarks, stats, stringRows } from "@/lib/derive";
import { sourceIndex, sources } from "@/data/sources";
import { Suspense } from "react";
import StringsTable, { type UiStringRow } from "@/components/StringsTable";
import { TopBar } from "@/components/PageHeader";

export default function Home() {
  const s = stats();
  const rows = stringRows();
  // only what the table renders, so the client bundle stays free of the data
  const cites = Object.fromEntries(
    sources.map((src) => [
      src.id,
      { n: sourceIndex.get(src.id)!, outlet: src.outlet, date: src.date },
    ])
  );

  return (
    <>
      {/* Header */}
      <TopBar current="/" />
      {/* The wordmark is in the top bar a few lines up; repeating it larger
          here said the same thing twice. */}
      <header className="pt-7 pb-7">
        <h1 className="serif italic text-lg sm:text-xl text-ink max-w-2xl">
          Self-revealed strings in the 2026 gTLD round.
        </h1>
        <p className="mt-2 text-sm text-ink-soft">
          Created by the team behind{" "}
          <a
            href="https://earlywarning.report"
            target="_blank"
            rel="noopener noreferrer"
            className="underline decoration-rule hover:decoration-gold hover:text-ink transition-colors duration-200 ease-in-out"
          >
            earlywarning.report
          </a>
          .
        </p>
      </header>

      {/* All strings */}
      <section className="relative mb-14">
        <Suspense>
        <StringsTable
          stats={s}
          cites={cites}
          backers={Object.fromEntries(applicantBackers)}
          rows={rows.map(
            (r): UiStringRow => ({
              tld: r.tld,
              punycode: r.punycode,
              gloss: r.gloss,
              existing: r.existing,
              issues: r.issues,
              applicants: applicantMarks(r.claims),
              overlap: r.contested,
              count: new Set(r.claims.map((c) => c.applicantSlug)).size,
            })
          )}
        />
        </Suspense>
      </section>

    </>
  );
}
