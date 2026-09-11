import { issueLabel } from "@/lib/issues";
import type { Citations, UiStringRow } from "./types";

// applicants, markers and sources stay parallel: index n of each describes
// the same applicant on that string.
const CSV_COLS = [
  "string",
  "punycode",
  "english",
  "applicants",
  "markers",
  "sources",
  "applicant_count",
  "overlap",
  "existing_tld",
  "issues",
] as const;

const csvCell = (v: string) =>
  /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;

export function toCsv(rows: UiStringRow[], cites: Citations): string {
  const lines = rows.map((r) =>
    [
      r.tld,
      r.punycode,
      r.gloss ?? "",
      r.applicants.map((a) => a.name).join("; "),
      r.applicants.map((a) => a.mark).join("; "),
      r.applicants
        .map((a) =>
          a.sourceIds
            .map((id) => cites[id]?.n)
            .filter(Boolean)
            .join("+")
        )
        .join("; "),
      String(r.count),
      r.overlap ? "yes" : "no",
      r.existing ? "yes" : "no",
      r.issues.map(issueLabel).join("; "),
    ]
      .map(csvCell)
      .join(",")
  );
  // BOM keeps the CJK strings readable when the file is opened in Excel
  return `\uFEFF${CSV_COLS.join(",")}\n${lines.join("\n")}\n`;
}

export function downloadCsv(rows: UiStringRow[], scope: string, cites: Citations) {
  const stamp = new Date().toISOString().slice(0, 10);
  const url = URL.createObjectURL(
    new Blob([toCsv(rows, cites)], { type: "text/csv;charset=utf-8" })
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = `stringscout-${scope}-${stamp}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // revoking synchronously cancels the download in Safari and Firefox
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
