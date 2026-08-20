import { claims, type Claim } from "@/data/claims";
import { applicants } from "@/data/applicants";
import { cjkGloss } from "@/data/translations";
import { rootZone } from "@/data/rootZone";

// Things worth a reader's attention before they trust a row.
// delegated: the string is already a TLD, so it cannot be applied for.
// plural:    singular/plural of a delegated TLD, which ICANN treats as
//            confusingly similar.
// similar:   singular/plural of a string another applicant disclosed.
export type IssueKind = "delegated" | "plural" | "similar";

export type Issue = {
  kind: IssueKind;
  other?: string; // the TLD or string it collides with
};

export type StringRow = {
  tld: string;
  punycode: string; // A-label; identical to tld for ASCII strings
  gloss?: string; // English translation for non-Latin strings
  existing: boolean; // already a delegated TLD in the IANA root zone
  issues: Issue[];
  claims: Claim[];
  contested: boolean;
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
        contested: owners.size > 1,
      };
    })
    .sort((a, b) => a.tld.localeCompare(b.tld));
}

export function contestedRows(): StringRow[] {
  return stringRows()
    .filter((r) => r.contested)
    .sort(
      (a, b) => b.claims.length - a.claims.length || a.tld.localeCompare(b.tld)
    );
}

export const applicantName = new Map(applicants.map((a) => [a.slug, a.name]));

const applicantBackers = new Map(applicants.map((a) => [a.slug, a.backers]));

// Per-string marker shown as a superscript next to an applicant's name.
export type Mark = "p" | "u" | "i";

export const MARKS: { mark: Mark; label: string }[] = [
  { mark: "p", label: "stated primary" },
  { mark: "u", label: "unknown if primary or secondary" },
  { mark: "i", label: "stated intent, application not confirmed" },
];

const RANK: Record<Mark, number> = { p: 0, u: 1, i: 2 };

function markOf(kind: Claim["kind"]): Mark {
  if (kind === "primary") return "p";
  if (kind === "intent") return "i";
  return "u"; // unknown, and backup while no applicant has split the two
}

// One entry per applicant on a string. An applicant claiming the same string
// more than once keeps its strongest marker.
export function applicantMarks(
  rows: Claim[]
): { name: string; mark: Mark; backers?: string; sourceIds: string[] }[] {
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
      backers: applicantBackers.get(slug),
      sourceIds: [...(srcs.get(slug) ?? [])],
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
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
