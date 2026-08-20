import type { Metadata } from "next";
import PageHeader from "@/components/PageHeader";
import { applicants, type Applicant } from "@/data/applicants";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Applicants — Stringscout",
};

const byCount = (a: Applicant, b: Applicant) =>
  parseInt(b.applicationCount) - parseInt(a.applicationCount);

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
              <td className="py-3 pr-4 font-medium whitespace-nowrap">
                {a.name}
              </td>
              <td className="py-3 pr-4 text-ink-soft max-w-xs">
                {a.backers}
                {a.note && (
                  <span className="serif italic block mt-1 text-[13px]">
                    {a.note}
                  </span>
                )}
              </td>
              <td className="py-3 pr-4">{a.applicationCount}</td>
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
  const intent = applicants.filter((a) => a.status === "intent").sort(byCount);

  return (
    <div className="mx-auto max-w-5xl px-5 sm:px-8 pb-20">
      <PageHeader title="The Applicants" current="/applicants" />

      <section className="mb-14">
        <SectionHead n="I" title="Disclosed" />
        <Table rows={disclosed} dateLabel="Disclosed" />
      </section>

      <section className="mb-14">
        <SectionHead n="II" title="Intent" />
        <p className="text-sm text-ink-soft mb-5 max-w-2xl">
          Announced before the application window opened, with no confirmed
          filing. Their strings carry an{" "}
          <sup className="text-gold">i</sup> in the table and are not counted as
          disclosed.
        </p>
        <Table rows={intent} dateLabel="Announced" />
      </section>

      <Footer />
    </div>
  );
}
