import { claims, type Claim } from "@/data/claims";
import { applicants } from "@/data/applicants";
import { cjkGloss } from "@/data/translations";
import { existingTlds } from "@/data/existingTlds";

export type StringRow = {
  tld: string;
  punycode: string; // A-label; identical to tld for ASCII strings
  gloss?: string; // English translation for non-Latin strings
  existing: boolean; // already a delegated TLD in the IANA root zone
  claims: Claim[];
  contested: boolean;
};

const existingSet = new Set(existingTlds);

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
    .map(([tld, rows]) => ({
      tld,
      punycode: toPunycode(tld),
      gloss: cjkGloss[tld],
      existing: existingSet.has(tld),
      claims: rows,
      contested: new Set(rows.map((c) => c.applicantSlug)).size > 1,
    }))
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
): { name: string; mark: Mark }[] {
  const best = new Map<string, Mark>();
  for (const c of rows) {
    const m = markOf(c.kind);
    const prev = best.get(c.applicantSlug);
    if (!prev || RANK[m] < RANK[prev]) best.set(c.applicantSlug, m);
  }
  return [...best].map(([slug, mark]) => ({
    name: applicantName.get(slug) ?? slug,
    mark,
  }));
}

export function stats() {
  const rows = stringRows();
  return {
    applicants: applicants.length,
    strings: rows.length,
    contested: rows.filter((r) => r.contested).length,
    claims: claims.length,
  };
}
