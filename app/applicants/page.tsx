import type { Metadata } from "next";
import PageHeader from "@/components/PageHeader";
import { applicants } from "@/data/applicants";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Applicants — Stringscout",
};

export default function ApplicantsPage() {
  return (
    <div className="mx-auto max-w-5xl px-5 sm:px-8 pb-20">
      <PageHeader title="The Applicants" current="/applicants" />
      <section className="mb-14">
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse sm:min-w-[640px]">
            <thead>
              <tr className="text-left">
                {["Applicant", "Who", "Strings", "Disclosed"].map(
                  (h) => (
                    <th key={h} className="label text-ink-soft pb-2 pr-4 font-medium">
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {[...applicants]
                .sort(
                  (a, b) =>
                    parseInt(b.applicationCount) - parseInt(a.applicationCount)
                )
                .map((a) => (
                <tr key={a.slug} className="border-t border-rule-faint align-top">
                  <td className="py-3 pr-4 font-medium whitespace-nowrap">{a.name}</td>
                  <td className="py-3 pr-4 text-ink-soft max-w-xs">
                    {a.backers}
                    {a.note && (
                      <span className="serif italic block mt-1 text-[13px]">{a.note}</span>
                    )}
                  </td>
                  <td className="py-3 pr-4">{a.applicationCount}</td>
                  <td className="py-3 pr-4 whitespace-nowrap">{a.revealedOn}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <Footer />
    </div>
  );
}
