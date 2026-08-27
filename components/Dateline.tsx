import Link from "next/link";
import { lastUpdated } from "@/data/meta";
import { latestReveal, stringCount } from "@/lib/derive";
import { applicantHref, formatDate } from "@/lib/format";

// The date the record last changed and who disclosed most recently, under
// every page title. The name links to that applicant's rows on the strings
// table; the count is the one printed there and on /applicants.
export default function Dateline() {
  return (
    <p className="label text-ink-soft mt-4">
      Updated <time dateTime={lastUpdated}>{formatDate(lastUpdated)}</time>
      <span className="block mt-1 sm:inline sm:mt-0">
        <span className="hidden sm:inline mx-2 text-rule" aria-hidden="true">
          ·
        </span>
        Latest{" "}
        {latestReveal().map((a, i) => {
          const n = stringCount(a.slug);
          return (
            <span key={a.slug} className="text-ink">
              {i > 0 && ", "}
              <Link
                href={applicantHref(a.name)}
                className="text-oxblood hover:text-ink underline decoration-rule underline-offset-2 hover:decoration-gold transition-colors duration-200 ease-in-out focus-visible:outline-2 focus-visible:outline-gold"
              >
                {a.name}
              </Link>
              , {n} {n === 1 ? "string" : "strings"}
            </span>
          );
        })}
      </span>
    </p>
  );
}
