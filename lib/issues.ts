// Things worth a reader's attention before they trust a row.
// delegated: the string is already a TLD, so it cannot be applied for.
// plural:    singular/plural of a delegated TLD, which ICANN treats as
//            confusingly similar.
// similar:   singular/plural of a string another applicant disclosed.
// Kept apart from derive.ts so the table can import the label without
// pulling the data into the client bundle.
export type IssueKind = "delegated" | "plural" | "similar";

export type Issue = {
  kind: IssueKind;
  other?: string; // the TLD or string it collides with
};

// One wording for the table, the CSV and the JSON feed.
export function issueLabel(issue: Issue): string {
  if (issue.kind === "delegated") return "existing tld";
  if (issue.kind === "plural") return `plural of .${issue.other}`;
  return `near .${issue.other}`;
}
