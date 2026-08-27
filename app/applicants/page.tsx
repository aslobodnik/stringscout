import type { Metadata } from "next";
import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import { applicants, type Applicant } from "@/data/applicants";
import SectionHead from "@/components/SectionHead";
import { latestReveal, stringCount } from "@/lib/derive";
import { applicantHref, formatDate } from "@/lib/format";
import { pressDelay } from "@/lib/press";

export const metadata: Metadata = {
  title: "Applicants",
  description:
    "Every entity that has publicly named a string in ICANN's 2026 gTLD round, the people behind it, and how many strings it has disclosed.",
  alternates: { canonical: "/applicants" },
};

const byCount = (a: Applicant, b: Applicant) =>
  stringCount(b.slug) - stringCount(a.slug);

// The newest disclosure keeps its place in the count order and carries a
// marginal stroke beside its date instead.
const latest = new Set(latestReveal().map((a) => a.slug));
const STROKE = pressDelay(250);

function Table({
  rows,
  dateLabel,
}: {
  rows: Applicant[];
  dateLabel: string;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse sm:min-w-[640px]">
        <thead>
          <tr className="text-left">
            {["Applicant", "Who", "Strings", dateLabel].map((h) => (
              <th
                key={h}
                className="label text-ink-soft pb-2 pr-4 font-medium"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((a) => {
            const count = stringCount(a.slug);
            const isLatest = latest.has(a.slug);
            return (
            <tr key={a.slug} className="border-t border-rule-faint align-top">
              <td className="py-3 pr-4 font-medium">
                {a.name}
                {isLatest && (
                  <span className="label text-oxblood ml-2 !text-[10px] align-[2px]">
                    Latest
                  </span>
                )}
              </td>
              <td className="py-3 pr-4 text-ink-soft max-w-xs">
                {a.backers}
                {a.note && (
                  <span className="serif italic block mt-1 text-[13px]">
                    {a.note}
                  </span>
                )}
              </td>
              <td className="py-3 pr-4 whitespace-nowrap">
                {count > 0 ? (
                  <Link
                    href={applicantHref(a.name)}
                    className="underline decoration-rule underline-offset-2 hover:decoration-gold transition-colors duration-200 ease-in-out"
                  >
                    {count}
                  </Link>
                ) : (
                  <span className="text-ink-soft">—</span>
                )}
              </td>
              <td
                className={`py-3 pr-4 whitespace-nowrap relative ${
                  isLatest ? "text-oxblood" : ""
                }`}
              >
                {isLatest && (
                  <span
                    aria-hidden="true"
                    className="tally-ink absolute -left-2 top-3 bottom-3 w-[3px] bg-oxblood"
                    style={STROKE}
                  />
                )}
                {formatDate(a.revealedOn)}
              </td>
            </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default function ApplicantsPage() {
  const disclosed = applicants
    .filter((a) => a.status === "disclosed")
    .sort(byCount);
  // An applicant that has named no string has nothing to show here. The row
  // stays in the data (the announcement is real) but a table of strings is
  // the wrong place for it.
  const intent = applicants
    .filter((a) => a.status === "intent" && stringCount(a.slug) > 0)
    .sort(byCount);

  return (
    <>
      <PageHeader title="The Applicants" current="/applicants" />

      <section className="mb-14">
        <SectionHead n="I" title="Disclosed" />
        <Table rows={disclosed} dateLabel="Disclosed" />
      </section>

      <section className="mb-14">
        <SectionHead n="II" title="Intent" />
        <Table rows={intent} dateLabel="Announced" />
      </section>

    </>
  );
}
