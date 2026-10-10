import { isDelegated, issueLabel } from "@/lib/issues";
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

// a header and its rows as one file; the BOM keeps the CJK strings readable
// when the file is opened in Excel
export const csvText = (cols: readonly string[], rows: string[][]) =>
  `\uFEFF${cols.join(",")}\n${rows.map((r) => r.map(csvCell).join(",")).join("\n")}\n`;

// hands the file to the browser as name-YYYY-MM-DD.csv
export function saveCsv(name: string, text: string) {
  const stamp = new Date().toISOString().slice(0, 10);
  const url = URL.createObjectURL(new Blob([text], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = `${name}-${stamp}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // revoking synchronously cancels the download in Safari and Firefox
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function toCsv(rows: UiStringRow[], cites: Citations): string {
  return csvText(
    CSV_COLS,
    rows.map((r) => [
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
      isDelegated(r.issues) ? "yes" : "no",
      r.issues.map(issueLabel).join("; "),
    ])
  );
}

export function downloadCsv(rows: UiStringRow[], scope: string, cites: Citations) {
  saveCsv(`stringscout-${scope}`, toCsv(rows, cites));
}
