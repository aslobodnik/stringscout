import { applicantMarks, stats, stringRows } from "@/lib/derive";
import StringsTable, { type UiStringRow } from "@/components/StringsTable";
import { TopBar } from "@/components/PageHeader";
import Footer from "@/components/Footer";

export default function Home() {
  const s = stats();
  const rows = stringRows();

  return (
    <div className="mx-auto max-w-5xl px-5 sm:px-8 pb-20">
      {/* Header */}
      <TopBar current="/" />
      <header className="pt-8 pb-8">
        <div className="double-rule" />
        <h1 className="mt-5 flex uppercase font-medium leading-[0.85] tracking-[0.14em] text-[clamp(1.75rem,4.5vw,2.75rem)]">
          <span>String</span>
          <span className="text-gold">scout</span>
        </h1>
        <p className="serif italic mt-5 text-base sm:text-lg text-ink max-w-2xl">
          Self-revealed strings in the 2026 gTLD round.
        </p>
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
        <StringsTable
          stats={s}
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
      </section>

      <Footer />
    </div>
  );
}
