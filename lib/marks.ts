// Standalone so the client bundle can read the marker vocabulary without
// pulling data/claims.ts and data/applicants.ts in behind it.
export type Mark = "p" | "r" | "u" | "i";

// label is the word in the legend; detail is the sentence under the mouse.
export const MARKS: { mark: Mark; label: string; detail: string }[] = [
  {
    mark: "p",
    label: "primary",
    detail: "Primary string of an application.",
  },
  {
    mark: "r",
    label: "replacement",
    detail: "Replacement string of an application (AGB §5.1).",
  },
  {
    mark: "u",
    label: "unstated",
    detail: "Applicant did not state if primary or replacement string.",
  },
  {
    mark: "i",
    label: "intent",
    detail: "Intent to apply announced.",
  },
];
