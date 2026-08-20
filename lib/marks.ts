// Standalone so the client bundle can read the marker vocabulary without
// pulling data/claims.ts and data/applicants.ts in behind it.
export type Mark = "p" | "u" | "i";

export const MARKS: { mark: Mark; label: string }[] = [
  { mark: "p", label: "stated primary" },
  { mark: "u", label: "unknown if primary or secondary" },
  { mark: "i", label: "intent to apply" },
];
