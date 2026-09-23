import { claims, type Claim } from "@/data/claims";
import { applicants, type Applicant } from "@/data/applicants";
import { cjkGloss } from "@/data/translations";
import { rootZone } from "@/data/rootZone";
import { MARKS, type Mark } from "./marks";
import type { Issue } from "./issues";

export { MARKS, type Mark };
export { issueLabel, type Issue, type IssueKind } from "./issues";

export type ApplicantMark = { name: string; mark: Mark; sourceIds: string[] };

export type StringRow = {
  tld: string;
  punycode: string; // A-label; identical to tld for ASCII strings
  gloss?: string; // English translation for non-Latin strings
  issues: Issue[];
  applicants: ApplicantMark[]; // one entry per applicant, strongest marker
  count: number; // distinct applicants: one cited by two sources is one
  overlap: boolean; // count > 1
};

const rootSet = new Set(rootZone);

// Two-letter entries are ccTLDs. A word that merely ends in "s" is not
// confusable with a country code, so they would be pure noise here.
const isCc = (t: string) => t.length === 2;

const variantsOf = (t: string) =>
  [`${t}s`, t.endsWith("s") ? t.slice(0, -1) : null].filter(
    (v): v is string => v !== null
  );

// A-label form of a string. URL parsing does the IDNA conversion; ASCII
// strings come back unchanged.
function toPunycode(tld: string): string {
  try {
    return new URL(`http://${tld}`).hostname;
  } catch {
    return tld;
  }
}

// distinct strings in a set of claims, per applicant
const stringsBy = (list: Claim[]) =>
  new Map(
    [...Map.groupBy(list, (c) => c.applicantSlug)].map(([slug, cs]) => [
      slug,
      new Set(cs.map((c) => c.tld)),
    ])
  );

export function stringRows(): StringRow[] {
  const byTld = Map.groupBy(claims, (c) => c.tld);
  return [...byTld.entries()]
    .map(([tld, rows]) => {
      const punycode = toPunycode(tld);
      const issues: Issue[] = [];
      if (rootSet.has(punycode)) {
        issues.push({ kind: "delegated" });
      } else {
        for (const v of variantsOf(punycode)) {
          if (rootSet.has(v) && !isCc(v)) issues.push({ kind: "plural", other: v });
        }
      }
      const owners = new Set(rows.map((c) => c.applicantSlug));
      for (const v of variantsOf(tld)) {
        const other = byTld.get(v);
        if (!other) continue;
        if (other.some((c) => !owners.has(c.applicantSlug)))
          issues.push({ kind: "similar", other: v });
      }
      return {
        tld,
        punycode,
        gloss: cjkGloss[tld],
        issues,
        applicants: applicantMarks(rows),
        count: owners.size,
        overlap: owners.size > 1,
      };
    })
    .sort((a, b) => a.tld.localeCompare(b.tld));
}

export const applicantName = new Map(applicants.map((a) => [a.slug, a.name]));

// name -> backers, sent once instead of repeated on all 812 claim rows
export const applicantBackers = new Map(
  applicants.map((a) => [a.name, a.backers])
);

// Distinct strings each applicant has named, every claim kind: the count the
// applicants column, its sort and the dateline all print, so the number in a
// link equals the number where it lands. Counted, never stored: a stored
// count goes stale the moment a scrape adds strings.
const namedStrings = stringsBy(claims);
export const stringCount = (slug: string) => namedStrings.get(slug)?.size ?? 0;

const RANK: Record<Mark, number> = { p: 0, r: 1, u: 2, i: 3 };

function markOf(kind: Claim["kind"]): Mark {
  if (kind === "primary") return "p";
  if (kind === "backup") return "r"; // the designated replacement, AGB §5.1
  if (kind === "intent") return "i";
  return "u";
}

// One entry per applicant on a string. An applicant claiming the same string
// more than once keeps its strongest marker.
export function applicantMarks(rows: Claim[]): ApplicantMark[] {
  return [...Map.groupBy(rows, (c) => c.applicantSlug)]
    .map(([slug, cs]) => ({
      name: applicantName.get(slug) ?? slug,
      mark: cs.map((c) => markOf(c.kind)).sort((a, b) => RANK[a] - RANK[b])[0],
      sourceIds: [...new Set(cs.flatMap((c) => c.sourceIds))],
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

// The newest disclosure: every disclosed applicant on the latest revealedOn,
// in list order. Intent rows are announcements, not reveals, so they never
// qualify. Derived, so nothing stores "latest".
export function latestReveal(list: Applicant[] = applicants): Applicant[] {
  const disclosed = list.filter((a) => a.status === "disclosed");
  const max = disclosed.map((a) => a.revealedOn).sort().at(-1);
  return disclosed.filter((a) => a.revealedOn === max);
}

// Disclosed units per applicant, largest first: what the round rule draws.
// One unit per applicant and string, applied kinds only, so the counts sum
// to the disclosed total the rule sets against ICANN's figure.
export function roundShares(): { slug: string; name: string; count: number }[] {
  return [...stringsBy(claims.filter((c) => c.kind !== "intent"))]
    .map(([slug, set]) => ({
      slug,
      name: applicantName.get(slug) ?? slug,
      count: set.size,
    }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

export function stats() {
  const rows = stringRows();
  // Applicant and string counts are applied-only: an intent announcement is
  // not a disclosed string. Overlaps do count intent, since a pre-window
  // announcement on the same string is exactly the collision worth seeing.
  return {
    applicants: applicants.filter((a) => a.status === "disclosed").length,
    strings: rows.length,
    overlap: rows.filter((r) => r.overlap).length,
    issues: rows.filter((r) => r.issues.length).length,
  };
}
