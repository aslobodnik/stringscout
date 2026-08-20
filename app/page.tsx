import { sources } from "@/data/sources";
import { applicantMarks, stats, stringRows } from "@/lib/derive";
import StringsTable, { type UiStringRow } from "@/components/StringsTable";
import { TopBar } from "@/components/PageHeader";
import Footer from "@/components/Footer";

function SectionHead({ n, title }: { n: string; title: string }) {
  return (
    <div className="double-rule pt-4 mb-5 flex items-baseline justify-between">
      <h2 className="label !text-sm text-ink">{title}</h2>
      <span className="label text-ink-soft">{n}</span>
    </div>
  );
}

export default function Home() {
  const s = stats();
  const rows = stringRows();

  return (
    <div className="mx-auto max-w-5xl px-5 sm:px-8 pb-20">
      {/* Header */}
      <TopBar current="/" />
      <header className="pb-6">
        <h1 className="serif italic mt-5 text-base sm:text-lg font-normal text-ink max-w-2xl">
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

      {/* Stat row */}
      <section className="grid grid-cols-3 border border-ink mb-10">
        {[
          { v: String(s.applicants), l: "Applicants revealed" },
          { v: String(s.claims), l: "Strings disclosed" },
          { v: String(s.contested), l: "Overlapping strings" },
        ].map(({ v, l }, i) => (
          <div
            key={l}
            className={`p-3 sm:p-4 ${i > 0 ? "border-l border-rule" : ""}`}
          >
            <div className="text-2xl sm:text-3xl font-light">{v}</div>
            <div className="label mt-2 text-ink-soft !tracking-[0.08em] !text-[10px] sm:!tracking-[0.18em] sm:!text-[0.6875rem]">{l}</div>
          </div>
        ))}
      </section>

      {/* All strings */}
      <section className="mb-14">
        <SectionHead n="I" title="All Applied Strings" />
        <StringsTable
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

      {/* Sources */}
      <section className="mb-14">
        <SectionHead n="II" title="Sources" />
        <ol className="text-sm space-y-2">
          {sources.map((src, i) => (
            <li key={src.id} id={`src-${i + 1}`} className="flex gap-3">
              <span className="text-gold w-5 shrink-0 text-right">{i + 1}.</span>
              <span>
                <span className="font-medium">{src.outlet}</span>
                <span className="text-ink-soft"> · {src.date} · </span>
                <a
                  href={src.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline decoration-rule hover:decoration-ink transition-colors duration-200 ease-in-out [overflow-wrap:anywhere]"
                >
                  {src.title}
                </a>
              </span>
            </li>
          ))}
        </ol>
      </section>

      <Footer />
    </div>
  );
}
