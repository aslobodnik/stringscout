// The shapes the table is handed from the server. Declared here so the
// leaf components can share them without importing the table.
import type { Issue } from "@/lib/issues";
import type { Mark } from "@/lib/marks";


// Passed in from the server rather than imported: this is the only client
// component, and importing @/data/sources drags the whole announced dataset
// and every claim into the browser bundle for 62 entries it actually reads.
export type Citation = { n: number; outlet: string; date: string };
export type Citations = Record<string, Citation>;

export type UiStringRow = {
  tld: string;
  punycode: string; // A-label; same as tld for ASCII strings
  gloss?: string; // English translation, shown on hover for non-Latin strings
  existing: boolean; // already a delegated TLD in the IANA root zone
  issues: Issue[];
  applicants: { name: string; mark: Mark; sourceIds: string[] }[];
  overlap: boolean;
  count: number;
};

export type UiStats = {
  applicants: number;
  strings: number;
  contested: number;
  issues: number;
};
