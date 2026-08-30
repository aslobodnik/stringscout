import { applicantBackers, applicantMarks, stats, stringRows } from "@/lib/derive";
import { sourceIndex, sources } from "@/data/sources";
import StringsTable, { type UiStringRow } from "@/components/StringsTable";
import SectionHead from "@/components/SectionHead";
import { TopBar } from "@/components/PageHeader";
import Dateline from "@/components/Dateline";
import Tailpiece from "@/components/Tailpiece";
import RoundRule from "@/components/RoundRule";
import { SITE, lastUpdated } from "@/data/meta";
import { pressDelay } from "@/lib/press";

const PRESS_HEAD = pressDelay(50);

export default function Home() {
  const s = stats();
  const rows = stringRows();
  // Dataset rather than WebSite: what this page is, is a compiled record with
  // a count and a licence, which is the shape a crawler can actually use.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Dataset",
    name: "Stringscout",
    description:
      "Self-revealed strings in ICANN's 2026 gTLD round: which applicant disclosed which string, where each disclosure is recorded, and which strings more than one applicant named.",
    url: SITE,
    license: "https://opensource.org/licenses/MIT",
    isAccessibleForFree: true,
    dateModified: lastUpdated,
    keywords: ["gTLD", "ICANN", "2026 round", "top-level domain", "new gTLD"],
    creator: { "@type": "Organization", name: "earlywarning.report", url: "https://earlywarning.report" },
    distribution: {
      "@type": "DataDownload",
      encodingFormat: "application/json",
      contentUrl: `${SITE}/strings.json`,
    },
    variableMeasured: [
      { "@type": "PropertyValue", name: "Strings disclosed", value: s.strings },
      { "@type": "PropertyValue", name: "Applicants", value: s.applicants },
      { "@type": "PropertyValue", name: "Overlapping strings", value: s.contested },
    ],
  };
  // only what the table renders, so the client bundle stays free of the data
  const cites = Object.fromEntries(
    sources.map((src) => [
      src.id,
      { n: sourceIndex.get(src.id)!, outlet: src.outlet, date: src.date },
    ])
  );

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* Header */}
      <TopBar current="/" />
      {/* The wordmark is in the top bar a few lines up; repeating it larger
          here said the same thing twice. */}
      <header className="pt-7 pb-7">
        <div className="press-word" style={PRESS_HEAD}>
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
          <Dateline />
        </div>
      </header>

      {/* All strings */}
      <section className="relative mb-14">
        <SectionHead n="I" title="All Applied Strings" count={s.strings} />
        <StringsTable
          stats={s}
          cites={cites}
          backers={Object.fromEntries(applicantBackers)}
          underTiles={<RoundRule />}
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
        <Tailpiece />
      </section>

    </>
  );
}
