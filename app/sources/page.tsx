import type { Metadata } from "next";
import PageHeader from "@/components/PageHeader";
import Footer from "@/components/Footer";
import {
  sources,
  sourceIndex,
  KIND_ORDER,
  KIND_LABEL,
  KIND_NOTE,
  type SourceKind,
} from "@/data/sources";

export const metadata: Metadata = {
  title: "Sources — Stringscout",
  description:
    "Every source behind the strings and applicants on Stringscout, grouped by how close it is to the applicant.",
};

const ROMAN = ["I", "II", "III", "IV"];

export default function SourcesPage() {
  const byKind = KIND_ORDER.map((kind) => ({
    kind,
    rows: sources.filter((s) => s.kind === kind),
  })).filter((g) => g.rows.length);

  return (
    <div className="mx-auto max-w-5xl px-5 sm:px-8 pb-20">
      <PageHeader title="Sources" current="/sources" />

      <p className="text-sm text-ink-soft mb-10 max-w-2xl">
        Grouped by how close each source sits to the applicant. A superscript on
        the strings table is the number in this list.
      </p>

      {byKind.map((g, gi) => (
        <section key={g.kind} className="mb-12">
          <div className="double-rule pt-4 mb-3 flex items-baseline justify-between gap-4">
            <h2 className="label !text-sm text-ink">
              {KIND_LABEL[g.kind as SourceKind]}
            </h2>
            <span className="label text-ink-soft shrink-0">
              {g.rows.length} · {ROMAN[gi]}
            </span>
          </div>
          <p className="text-sm text-ink-soft mb-5 max-w-2xl">
            {KIND_NOTE[g.kind as SourceKind]}
          </p>
          <ol className="text-sm space-y-2">
            {g.rows.map((src) => (
              <li
                key={src.id}
                id={`src-${sourceIndex.get(src.id)}`}
                className="flex gap-3 scroll-mt-16 target:bg-paper-deep"
              >
                <span className="text-gold w-7 shrink-0 text-right">
                  {sourceIndex.get(src.id)}.
                </span>
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
      ))}

      <Footer />
    </div>
  );
}
