import { TIP_BOX } from "@/components/Tip";
import { issueLabel, type Issue } from "@/lib/issues";

export const ISSUE_TIP: Record<Issue["kind"], string> = {
  delegated: "Already delegated — see it in the IANA root zone",
  plural: "Singular or plural of a delegated TLD",
  similar: "Singular or plural of another applicant's string",
};

// The string column is a fixed 128px below sm, so an inline tag has nowhere
// to go and spills under the applicants column. Stack it under the string
// there and only sit it alongside once there is room.
const TAG =
  "group relative label text-oxblood !text-[9px] block mt-1 w-fit sm:inline sm:mt-0 sm:ml-2 sm:whitespace-nowrap";

export function IssueTag({ issue, punycode }: { issue: Issue; punycode: string }) {
  const tip = (
    <span role="tooltip" className={`${TIP_BOX} left-0`}>
      {ISSUE_TIP[issue.kind]}
    </span>
  );
  const target =
    issue.kind === "delegated" ? punycode : issue.kind === "plural" ? issue.other : null;
  if (!target)
    return (
      <span className={TAG}>
        {issueLabel(issue)}
        {tip}
      </span>
    );
  return (
    <a
      href={`https://www.iana.org/domains/root/db/${target}.html`}
      target="_blank"
      rel="noopener noreferrer"
      className={`${TAG} underline decoration-dotted decoration-oxblood/40 underline-offset-2 hover:decoration-oxblood transition-colors duration-200 ease-in-out`}
    >
      {issueLabel(issue)}
      {tip}
    </a>
  );
}
