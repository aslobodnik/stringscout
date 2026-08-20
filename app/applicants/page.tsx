import type { Metadata } from "next";
import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import { applicants, type Applicant } from "@/data/applicants";
import { claims } from "@/data/claims";
import SectionHead from "@/components/SectionHead";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = {
  title: "Applicants — Stringscout",
};

// What each applicant has actually named. The stored applicationCount goes
// stale the moment a scrape adds strings, so both the column and the sort
// read this, never the field.
const named = new Map<string, Set<string>>();
for (const c of claims) {
  const set = named.get(c.applicantSlug) ?? new Set<string>();
  set.add(c.tld);
  named.set(c.applicantSlug, set);
}
const countFor = (slug: string) => named.get(slug)?.size ?? 0;

const byCount = (a: Applicant, b: Applicant) =>
  countFor(b.slug) - countFor(a.slug);

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
            const count = countFor(a.slug);
            return (
            <tr key={a.slug} className="border-t border-rule-faint align-top">
              <td className="py-3 pr-4 font-medium">{a.name}</td>
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
                    href={`/?applicant=${encodeURIComponent(a.name)}`}
                    className="underline decoration-rule underline-offset-2 hover:decoration-gold transition-colors duration-200 ease-in-out"
                  >
                    {count}
                  </Link>
                ) : (
                  <span className="text-ink-soft">—</span>
                )}
              </td>
              <td className="py-3 pr-4 whitespace-nowrap">{formatDate(a.revealedOn)}</td>
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
    .filter((a) => a.status === "intent" && countFor(a.slug) > 0)
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
