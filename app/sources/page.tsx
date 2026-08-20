import type { Metadata } from "next";
import PageHeader from "@/components/PageHeader";
import SectionHead from "@/components/SectionHead";
import { formatDate } from "@/lib/format";
import {
  sources,
  sourceIndex,
  KIND_ORDER,
  KIND_LABEL,
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
    <>
      <PageHeader title="Sources" current="/sources" />

      {byKind.map((g, gi) => (
        <section key={g.kind} className="mb-12">
          <SectionHead
            n={ROMAN[gi]}
            title={KIND_LABEL[g.kind]}
            count={g.rows.length}
          />
          <ol className="text-sm">
            {g.rows.map((src) => (
              <li
                key={src.id}
                id={`src-${sourceIndex.get(src.id)}`}
                className="flex gap-3 py-2 border-t border-rule-faint scroll-mt-16 target:bg-paper-deep"
              >
                <span className="text-gold w-7 shrink-0 text-right">
                  {sourceIndex.get(src.id)}.
                </span>
                <span className="flex-1">
                  <span className="font-medium">{src.outlet}</span>
                  <span className="text-ink-soft"> · </span>
                  <a
                    href={src.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline decoration-rule hover:decoration-ink transition-colors duration-200 ease-in-out [overflow-wrap:anywhere]"
                  >
                    {src.title}
                  </a>
                </span>
                {/* the date belongs in a fixed well, not in the middot chain */}
                <span className="label text-ink-soft !text-[10px] !tracking-[0.06em] shrink-0 w-24 text-right pt-0.5">
                  {formatDate(src.date)}
                </span>
              </li>
            ))}
          </ol>
        </section>
      ))}

    </>
  );
}
