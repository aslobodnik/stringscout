import type { Metadata } from "next";
import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import { applicants, type Applicant } from "@/data/applicants";
import { claims } from "@/data/claims";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Applicants — Stringscout",
};

// The stored applicationCount is what the applicant said; this is what it has
// actually named. They diverge once a scrape adds strings to an applicant that
// was first entered by hand, so count the claims rather than trust the field.
const named = new Map<string, Set<string>>();
for (const c of claims) {
  const set = named.get(c.applicantSlug) ?? new Set<string>();
  set.add(c.tld);
  named.set(c.applicantSlug, set);
}
const countFor = (slug: string) => named.get(slug)?.size ?? 0;

const byCount = (a: Applicant, b: Applicant) =>
  (parseInt(b.applicationCount) || countFor(b.slug)) -
  (parseInt(a.applicationCount) || countFor(a.slug));

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
          {rows.map((a) => (
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
                {countFor(a.slug) > 0 ? (
                  <Link
                    href={`/?applicant=${encodeURIComponent(a.name)}`}
                    className="underline decoration-rule underline-offset-2 hover:decoration-gold transition-colors duration-200 ease-in-out"
                  >
                    {countFor(a.slug)}
                  </Link>
                ) : (
                  <span className="text-ink-soft">—</span>
                )}
              </td>
              <td className="py-3 pr-4 whitespace-nowrap">{a.revealedOn}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SectionHead({ n, title }: { n: string; title: string }) {
  return (
    <div className="double-rule pt-4 mb-5 flex items-baseline justify-between">
      <h2 className="label !text-sm text-ink">{title}</h2>
      <span className="label text-ink-soft">{n}</span>
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
    <div className="mx-auto max-w-5xl px-5 sm:px-8 pb-20">
      <PageHeader title="The Applicants" current="/applicants" />

      <section className="mb-14">
        <SectionHead n="I" title="Disclosed" />
        <Table rows={disclosed} dateLabel="Disclosed" />
      </section>

      <section className="mb-14">
        <SectionHead n="II" title="Intent" />
        <Table rows={intent} dateLabel="Announced" />
      </section>

      <Footer />
    </div>
  );
}
