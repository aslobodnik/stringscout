import { claims, type Claim } from "@/data/claims";
import { applicants, type Applicant } from "@/data/applicants";
import { cjkGloss } from "@/data/translations";
import { rootZone } from "@/data/rootZone";
import { round } from "@/data/round";
import { MARKS, type Mark } from "./marks";
import type { Issue } from "./issues";

export { MARKS, type Mark };
export { issueLabel, type Issue, type IssueKind } from "./issues";

export type ApplicantMark = { name: string; mark: Mark; sourceIds: string[] };

export type StringRow = {
  tld: string;
  punycode: string; // A-label; identical to tld for ASCII strings
  gloss?: string; // English translation for non-Latin strings
  existing: boolean; // already a delegated TLD in the IANA root zone
  issues: Issue[];
  claims: Claim[];
  applicants: ApplicantMark[]; // one entry per applicant, strongest marker
  count: number; // distinct applicants: one cited by two sources is one
  contested: boolean; // count > 1
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

export function stringRows(): StringRow[] {
  const byTld = new Map<string, Claim[]>();
  for (const c of claims) {
    const rows = byTld.get(c.tld) ?? [];
    rows.push(c);
    byTld.set(c.tld, rows);
  }
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
        existing: issues.some((i) => i.kind === "delegated"),
        issues,
        claims: rows,
        applicants: applicantMarks(rows),
        count: owners.size,
        contested: owners.size > 1,
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
// link equals the number where it lands. The stored applicationCount goes
// stale the moment a scrape adds strings, so nothing reads that field.
const namedStrings = new Map<string, Set<string>>();
for (const c of claims) {
  const set = namedStrings.get(c.applicantSlug) ?? new Set<string>();
  set.add(c.tld);
  namedStrings.set(c.applicantSlug, set);
}
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
  const best = new Map<string, Mark>();
  const srcs = new Map<string, Set<string>>();
  for (const c of rows) {
    const m = markOf(c.kind);
    const prev = best.get(c.applicantSlug);
    if (!prev || RANK[m] < RANK[prev]) best.set(c.applicantSlug, m);
    const set = srcs.get(c.applicantSlug) ?? new Set<string>();
    for (const id of c.sourceIds) set.add(id);
    srcs.set(c.applicantSlug, set);
  }
  return [...best]
    .map(([slug, mark]) => ({
      name: applicantName.get(slug) ?? slug,
      mark,
      sourceIds: [...(srcs.get(slug) ?? [])],
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

// The disclosed count set against what ICANN said the round holds. One unit
// per applicant and string, which is what an application is: an overlap is
// two. ICANN's figure counts primary applications and most disclosures do
// not say which strings are primary, so the split is carried, not collapsed.
// An intent that the same applicant later filed is a filing, not an intent.
export function roundStats() {
  const best = new Map<string, Mark>();
  for (const c of claims) {
    const k = `${c.applicantSlug}|${c.tld}`;
    const m = markOf(c.kind);
    const prev = best.get(k);
    if (!prev || RANK[m] < RANK[prev]) best.set(k, m);
  }
  const count = (mark: Mark) => [...best.values()].filter((m) => m === mark).length;
  const primary = count("p");
  const replacement = count("r"); // a filed application too, AGB §5.1
  const unknown = count("u");
  return {
    received: round.received,
    primary,
    replacement,
    unknown,
    intent: count("i"),
    undisclosed: round.received - primary - replacement - unknown,
  };
}

// Disclosed units per applicant, largest first: what the round rule draws.
// One unit per applicant and string, applied kinds only, so the counts sum
// to the disclosed total the rule sets against ICANN's figure.
export function roundShares(): { slug: string; name: string; count: number }[] {
  const per = new Map<string, Set<string>>();
  for (const c of claims) {
    if (c.kind === "intent") continue;
    const set = per.get(c.applicantSlug) ?? new Set<string>();
    set.add(c.tld);
    per.set(c.applicantSlug, set);
  }
  return [...per]
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
    contested: rows.filter((r) => r.contested).length,
    issues: rows.filter((r) => r.issues.length).length,
    claims: claims.filter((c) => c.kind !== "intent").length,
  };
}
