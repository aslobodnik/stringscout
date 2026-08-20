import type { Metadata } from "next";
import PageHeader from "@/components/PageHeader";
import Footer from "@/components/Footer";
import { withdrawnClaims } from "@/data/announcedAdapter";
import { sources } from "@/data/sources";

export const metadata: Metadata = {
  title: "Withdrawn — Stringscout",
  description:
    "Strings announced for the 2026 gTLD round and then pulled before the application reached ICANN.",
};

const sourceById = new Map(sources.map((s, i) => [s.id, { ...s, n: i + 1 }]));

export default function WithdrawnPage() {
  const rows = [...withdrawnClaims].sort((a, b) => a.tld.localeCompare(b.tld));
  // numbered locally: this page's list stands on its own, so the main page's
  // source numbers would only be confusing here
  const cited = [
    ...new Set(rows.map((r) => r.sourceId).filter((x): x is string => !!x)),
  ].sort(
    (a, b) => (sourceById.get(a)?.n ?? 0) - (sourceById.get(b)?.n ?? 0)
  );

  return (
    <div className="mx-auto max-w-5xl px-5 sm:px-8 pb-20">
      <PageHeader title="Withdrawn" current="/withdrawn" />

      <p className="text-sm text-ink-soft mb-8 max-w-2xl">
        Announced for the 2026 round, then pulled before the application reached
        ICANN. Counted nowhere else on this site. Kept because a collapsed
        announcement still records who wanted the string.
      </p>

      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse sm:min-w-[560px]">
          <thead>
            <tr className="text-left">
              {["String", "Announced by", "Source", "Announced"].map((h) => (
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
                  <td className="py-3 pr-4 whitespace-nowrap text-ink-soft">
                    {w.date}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="double-rule pt-4 mt-14 mb-5 flex items-baseline justify-between">
        <h2 className="label !text-sm text-ink">Sources</h2>
        <span className="label text-ink-soft">I</span>
      </div>
      <ol className="text-sm space-y-2">
        {cited.map((id, i) => {
          const s = sourceById.get(id)!;
          return (
            <li key={id} className="flex gap-3">
              <span className="text-gold w-5 shrink-0 text-right">{i + 1}.</span>
              <span>
                <span className="font-medium">{s.outlet}</span>
                <span className="text-ink-soft"> · {s.date} · </span>
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

      <Footer />
    </div>
  );
}
