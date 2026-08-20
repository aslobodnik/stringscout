import type { Mark } from "./derive";

export type Searchable = {
  tld: string;
  gloss?: string;
  overlap: boolean;
  issues: { kind: string }[];
  applicants: { name: string; mark: Mark; backers?: string }[];
};

export type Filters = {
  q: string;
  applicant: string;
  contestedOnly: boolean;
  issuesOnly: boolean;
  mark: Mark | null;
};

// A leading dot means the reader wants the string itself. Without it the
// search also reaches glosses and the people behind each applicant —
// otherwise "anime" drags in every string backed by Animecoin.
export function matches(r: Searchable, f: Filters): boolean {
  if (f.contestedOnly && !r.overlap) return false;
  if (f.issuesOnly && !r.issues.length) return false;
  if (f.mark && !r.applicants.some((a) => a.mark === f.mark)) return false;
  if (f.applicant !== "all" && !r.applicants.some((a) => a.name === f.applicant))
    return false;

  const raw = f.q.trim().toLowerCase();
  const stringOnly = raw.startsWith(".");
  const needle = raw.replace(/^\./, "");
  if (!needle) return true;
  if (r.tld.includes(needle)) return true;
  if (stringOnly) return false;
  return (
    !!r.gloss?.toLowerCase().includes(needle) ||
    r.applicants.some(
      (a) =>
        a.name.toLowerCase().includes(needle) ||
        a.backers?.toLowerCase().includes(needle)
    )
  );
}
