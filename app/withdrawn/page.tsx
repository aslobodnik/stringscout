import type { Metadata } from "next";
import PageHeader from "@/components/PageHeader";
import SectionHead from "@/components/SectionHead";
import { formatDate } from "@/lib/format";
import { withdrawnClaims } from "@/data/announcedAdapter";
import { sourceById, sourceIndex } from "@/data/sources";

export const metadata: Metadata = {
  title: "Withdrawn",
  alternates: { canonical: "/withdrawn" },
  description:
    "Strings announced for the 2026 gTLD round and then pulled before the application reached ICANN.",
};

export default function WithdrawnPage() {
  const rows = [...withdrawnClaims].sort((a, b) => a.tld.localeCompare(b.tld));
  // numbered locally: this page's list stands on its own, so the main page's
  // source numbers would only be confusing here
  const cited = [
    ...new Set(rows.map((r) => r.sourceId).filter((x): x is string => !!x)),
  ].sort((a, b) => (sourceIndex.get(a) ?? 0) - (sourceIndex.get(b) ?? 0));

  return (
    <>
      <PageHeader title="Withdrawn" current="/withdrawn" />

      <p className="text-sm text-ink-soft mb-8 max-w-2xl">
        Announced for the 2026 round, then pulled before the application reached
        ICANN. Counted nowhere else on this site. Kept because a collapsed
        announcement still records who wanted the string. Announced is the piece
        that reported the string; Withdrawn is where the retraction is recorded.
      </p>

      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse sm:min-w-[560px]">
          <thead>
            <tr className="text-left">
              {["String", "Announced by", "Announced in", "Withdrawn in", "Date"].map((h) => (
                <th
                  key={h}
                  scope="col"
                  className="label text-ink-soft pb-2 pr-4 font-medium"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((w) => {
              const src = w.sourceId ? sourceById.get(w.sourceId) : null;
              return (
                <tr
                  key={`${w.tld}-${w.applicant}`}
                  className="border-t border-rule-faint align-top"
                >
                  <td className="py-3 pr-4 font-medium whitespace-nowrap">
                    <span className="text-gold">.</span>
                    <span className="line-through decoration-oxblood/70">
                      {w.tld}
                    </span>
                  </td>
                  <td className="py-3 pr-4 [overflow-wrap:anywhere]">
                    {w.applicant}
                    {w.partners.length ? (
                      <span className="text-ink-soft">
                        {" + "}
                        {w.partners.join(", ")}
                      </span>
                    ) : null}
                  </td>
                  <td className="py-3 pr-4">
                    {src ? (
                      <a
                        href={src.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline decoration-rule underline-offset-2 hover:decoration-gold transition-colors duration-200 ease-in-out [overflow-wrap:anywhere]"
                      >
                        {src.outlet}
                      </a>
                    ) : (
                      <span className="text-ink-soft">—</span>
                    )}
                  </td>
                  <td className="py-3 pr-4">
                    {w.withdrawnUrl ? (
                      <a
                        href={w.withdrawnUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline decoration-rule underline-offset-2 hover:decoration-gold transition-colors duration-200 ease-in-out"
                      >
                        Unstoppable refund list
                      </a>
                    ) : (
                      <span className="text-ink-soft">—</span>
                    )}
                  </td>
                  <td className="py-3 pr-4 whitespace-nowrap text-ink-soft">
                    {formatDate(w.date)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <SectionHead n="I" title="Sources" className="mt-14" />
      <ol className="text-sm space-y-2">
        {cited.map((id, i) => {
          const s = sourceById.get(id)!;
          return (
            <li key={id} className="flex gap-3">
              <span className="text-gold w-5 shrink-0 text-right">{i + 1}.</span>
              <span>
                <span className="font-medium">{s.outlet}</span>
                <span className="text-ink-soft"> · {formatDate(s.date)} · </span>
                <a
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline decoration-rule hover:decoration-ink transition-colors duration-200 ease-in-out [overflow-wrap:anywhere]"
                >
                  {s.title}
                </a>
              </span>
            </li>
          );
        })}
      </ol>

    </>
  );
}
