import Link from "next/link";
import { claims } from "@/data/claims";
import { lastUpdated } from "@/data/meta";
import { latestReveal } from "@/lib/derive";
import { formatDate } from "@/lib/format";

// Distinct strings the applicant has disclosed; intent rows are not reveals.
const disclosedCount = (slug: string) =>
  new Set(
    claims
      .filter((c) => c.applicantSlug === slug && c.kind !== "intent")
      .map((c) => c.tld)
  ).size;

// The date the record last changed and who disclosed most recently. "filter"
// sends the reader to that applicant's rows on the strings table; "row" jumps
// to its line on the applicants table.
export default function Dateline({
  latestHref,
  className = "",
}: {
  latestHref: "filter" | "row";
  className?: string;
}) {
  const latest = latestReveal();
  return (
    <p className={`label text-ink-soft ${className}`}>
      Updated <time dateTime={lastUpdated}>{formatDate(lastUpdated)}</time>
      {latest.length > 0 && (
        <span className="block mt-1 sm:inline sm:mt-0">
          <span className="hidden sm:inline mx-2 text-rule" aria-hidden="true">
            ·
          </span>
          Latest{" "}
          {latest.map((a, i) => {
            const n = disclosedCount(a.slug);
            return (
              <span key={a.slug} className="text-ink">
                {i > 0 && ", "}
                <Link
                  href={
                    latestHref === "filter"
                      ? `/?applicant=${encodeURIComponent(a.name)}`
                      : `/applicants#${a.slug}`
                  }
                  className="text-oxblood hover:text-ink underline decoration-rule underline-offset-4 hover:decoration-gold transition-colors duration-200 ease-in-out focus-visible:outline-2 focus-visible:outline-gold"
                >
                  {a.name}
                </Link>
                {n > 0 && `, ${n} ${n === 1 ? "string" : "strings"}`}
              </span>
            );
          })}
        </span>
      )}
    </p>
  );
}
