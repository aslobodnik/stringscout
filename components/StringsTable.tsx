"use client";

import { useMemo, useState } from "react";
import { MARKS, type Issue, type Mark } from "@/lib/derive";

export type UiStringRow = {
  tld: string;
  punycode: string; // A-label; same as tld for ASCII strings
  gloss?: string; // English translation, shown on hover for non-Latin strings
  existing: boolean; // already a delegated TLD in the IANA root zone
  issues: Issue[];
  applicants: { name: string; mark: Mark }[];
  overlap: boolean;
  count: number;
};

const PAGE = 25;

const CSV_COLS = [
  "string",
  "punycode",
  "english",
  "applicants",
  "markers",
  "applicant_count",
  "overlap",
  "existing_tld",
  "issues",
] as const;

const csvCell = (v: string) =>
  /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;

function toCsv(rows: UiStringRow[]): string {
  const lines = rows.map((r) =>
    [
      r.tld,
      r.punycode,
      r.gloss ?? "",
      r.applicants.map((a) => a.name).join("; "),
      r.applicants.map((a) => a.mark).join("; "),
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

function downloadCsv(rows: UiStringRow[]) {
  const stamp = new Date().toISOString().slice(0, 10);
  const url = URL.createObjectURL(
    new Blob([toCsv(rows)], { type: "text/csv;charset=utf-8" })
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = `stringscout-${stamp}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function ApplicantSelect({
  options,
  value,
  onChange,
}: {
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const items = ["all", ...options];
  const labelFor = (v: string) => (v === "all" ? "All applicants" : v);

  return (
    <div className="relative">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="label border border-ink text-ink px-3 h-10 w-56 cursor-pointer hover:bg-paper-deep transition-colors duration-200 ease-in-out flex items-center justify-between gap-2"
      >
        <span className="truncate">{labelFor(value)}</span>
        <span aria-hidden className="text-[8px] shrink-0">
          {open ? "▲" : "▼"}
        </span>
      </button>
      {open && (
        <>
          <Backdrop onClose={() => setOpen(false)} />
          <ul
            role="listbox"
            className="absolute left-0 top-full z-20 mt-1 min-w-full w-max max-h-[50vh] overflow-y-auto border border-ink bg-paper"
          >
            {items.map((v) => (
              <li key={v} role="option" aria-selected={v === value}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(v);
                    setOpen(false);
                  }}
                  className={`label block w-full text-left px-3 py-3 cursor-pointer transition-colors duration-200 ease-in-out ${
                    v === value
                      ? "bg-ink text-paper"
                      : "text-ink hover:bg-paper-deep"
                  }`}
                >
                  {labelFor(v)}
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

const TIP_BOX =
  "pointer-events-none absolute left-0 bottom-full mb-1.5 z-30 hidden sm:block whitespace-nowrap border border-ink border-l-2 border-l-gold bg-paper-deep text-ink px-2.5 py-1.5 text-xs font-normal normal-case tracking-normal opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 ease-in-out";

const MARK_LABEL = Object.fromEntries(MARKS.map((m) => [m.mark, m.label]));

// Superscript on an applicant's name: how firmly that applicant tied itself
// to this string.
function Marker({ mark }: { mark: Mark }) {
  return (
    <span className="group relative">
      <sup className="ml-px text-[9px] text-gold cursor-help">{mark}</sup>
      <span role="tooltip" className={TIP_BOX}>
        {MARK_LABEL[mark]}
      </span>
    </span>
  );
}

function issueLabel(issue: Issue) {
  if (issue.kind === "delegated") return "existing tld";
  if (issue.kind === "plural") return `plural of .${issue.other}`;
  return `near .${issue.other}`;
}

const ISSUE_TIP: Record<Issue["kind"], string> = {
  delegated: "Already delegated — see it in the IANA root zone",
  plural: "Singular or plural of a delegated TLD",
  similar: "Singular or plural of another applicant's string",
};

const TAG =
  "group relative label text-oxblood ml-2 !text-[9px] whitespace-nowrap";

function IssueTag({ issue, punycode }: { issue: Issue; punycode: string }) {
  const tip = (
    <span role="tooltip" className={TIP_BOX}>
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

function Legend({ present }: { present: Mark[] }) {
  return (
    <dl className="mt-4 flex flex-wrap gap-x-6 gap-y-1">
      {MARKS.filter((m) => present.includes(m.mark)).map(({ mark, label }) => (
        <div key={mark} className="flex items-baseline gap-1.5">
          <dt className="text-gold text-[11px]">
            <sup>{mark}</sup>
          </dt>
          <dd className="label text-ink-soft !text-[10px] !tracking-[0.08em]">
            {label}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function Backdrop({ onClose }: { onClose: () => void }) {
  return <div className="fixed inset-0 z-10" aria-hidden onClick={onClose} />;
}

type SortKey = "tld" | "applicants" | "overlap";

// dir: default sort direction (overlaps = most-contested first); short: sub-sm header label
const SORT_COLS: {
  key: SortKey;
  label: string;
  short?: string;
  right?: boolean;
  dir?: -1;
}[] = [
  { key: "tld", label: "String" },
  { key: "applicants", label: "Applicants" },
  { key: "overlap", label: "Overlaps", short: "×", right: true, dir: -1 },
];

const collator = new Intl.Collator();

export default function StringsTable({ rows }: { rows: UiStringRow[] }) {
  const [q, setQ] = useState("");
  const [applicant, setApplicant] = useState("all");
  const [contestedOnly, setContestedOnly] = useState(false);
  const [issuesOnly, setIssuesOnly] = useState(false);
  const [page, setPage] = useState(0);
  const [pinned, setPinned] = useState<string | null>(null);
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({
    key: "tld",
    dir: 1,
  });

  const issueCount = useMemo(
    () => rows.filter((r) => r.issues.length).length,
    [rows]
  );

  const presentMarks = useMemo(
    () => [...new Set(rows.flatMap((r) => r.applicants.map((a) => a.mark)))],
    [rows]
  );

  const applicantOptions = useMemo(
    () => [...new Set(rows.flatMap((r) => r.applicants.map((a) => a.name)))].sort(),
    [rows]
  );

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (contestedOnly && !r.overlap) return false;
      if (issuesOnly && !r.issues.length) return false;
      if (applicant !== "all" && !r.applicants.some((a) => a.name === applicant))
        return false;
      if (
        needle &&
        !r.tld.includes(needle) &&
        !r.applicants.some((a) => a.name.toLowerCase().includes(needle))
      )
        return false;
      return true;
    });
  }, [rows, q, applicant, contestedOnly, issuesOnly]);

  const sorted = useMemo(() => {
    const { key, dir } = sort;
    // rows arrive pre-sorted A–Z from stringRows(), and filtering keeps order
    if (key === "tld") return dir === 1 ? filtered : [...filtered].reverse();
    const primary =
      key === "overlap"
        ? (a: UiStringRow, b: UiStringRow) => a.count - b.count
        : (a: UiStringRow, b: UiStringRow) =>
            collator.compare(a.applicants[0].name, b.applicants[0].name);
    return [...filtered].sort(
      (a, b) => primary(a, b) * dir || collator.compare(a.tld, b.tld)
    );
  }, [filtered, sort]);

  const pageCount = Math.max(1, Math.ceil(sorted.length / PAGE));
  const current = Math.min(page, pageCount - 1);
  const visible = sorted.slice(current * PAGE, (current + 1) * PAGE);

  const countLabel =
    filtered.length === rows.length
      ? `${rows.length} strings`
      : `${filtered.length} match`;

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <input
          type="search"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setPage(0);
          }}
          placeholder="Search…"
          aria-label="Search strings"
          className="border border-ink bg-transparent px-3 h-10 text-base sm:text-sm w-full sm:w-44 placeholder:text-ink-soft focus:border-gold focus:outline-none transition-colors duration-200 ease-in-out"
        />
        <ApplicantSelect
          options={applicantOptions}
          value={applicant}
          onChange={(v) => {
            setApplicant(v);
            setPage(0);
          }}
        />
        <button
          type="button"
          aria-pressed={contestedOnly}
          onClick={() => {
            setContestedOnly((v) => !v);
            setPage(0);
          }}
          className={`label border px-3 h-10 cursor-pointer transition-colors duration-200 ease-in-out ${
            contestedOnly
              ? "bg-oxblood text-paper border-oxblood"
              : "border-ink text-ink hover:bg-paper-deep"
          }`}
        >
          Overlaps only
        </button>
        <button
          type="button"
          onClick={() => downloadCsv(sorted)}
          title="Download the strings below as CSV, punycode included"
          className="group label border border-ink text-ink px-3 h-10 cursor-pointer hover:bg-paper-deep hover:border-gold transition-colors duration-200 ease-in-out flex items-center gap-2"
        >
          CSV
          <span
            aria-hidden
            className="text-[9px] text-rule group-hover:text-gold transition-colors duration-200 ease-in-out"
          >
            ↓
          </span>
        </button>
        {issueCount > 0 && (
          <button
            type="button"
            aria-pressed={issuesOnly}
            onClick={() => {
              setIssuesOnly((v) => !v);
              setPage(0);
            }}
            title="Already delegated, or confusingly similar to a delegated TLD or another disclosed string"
            className={`label !text-[10px] cursor-pointer border-b border-dotted transition-colors duration-200 ease-in-out ${
              issuesOnly
                ? "text-oxblood border-oxblood"
                : "text-ink-soft border-rule hover:text-oxblood hover:border-oxblood"
            }`}
          >
            Potential issues ({issueCount})
          </button>
        )}
        <span className="label text-ink-soft ml-auto">{countLabel}</span>
      </div>

      {pinned && <Backdrop onClose={() => setPinned(null)} />}

      {/* overflow-visible on sm+ so hover tooltips aren't clipped; tooltips are hidden below sm */}
      <div className="overflow-x-auto sm:overflow-visible sm:min-h-[970px]">
        <table className="w-full table-fixed text-sm border-collapse sm:min-w-[420px]">
          {/* fixed layout so column widths don't shift with sort/page/filter */}
          <colgroup>
            <col className="w-32 sm:w-44" />
            <col />
            <col className="w-14 sm:w-24" />
          </colgroup>
          <thead>
            <tr className="text-left">
              {SORT_COLS.map(({ key, label, short, right, dir }) => {
                const active = sort.key === key;
                return (
                  <th
                    key={key}
                    aria-sort={
                      active
                        ? sort.dir === 1
                          ? "ascending"
                          : "descending"
                        : undefined
                    }
                    className={`pb-2 font-medium whitespace-nowrap ${
                      right ? "text-right" : "pr-4"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setSort((s) =>
                          s.key === key
                            ? { key, dir: s.dir === 1 ? -1 : 1 }
                            : { key, dir: dir ?? 1 }
                        );
                        setPage(0);
                      }}
                      className={`label cursor-pointer transition-colors duration-200 ease-in-out ${
                        active ? "text-ink" : "text-ink-soft hover:text-ink"
                      }`}
                    >
                      {short ? (
                        <>
                          <span className="hidden sm:inline">{label}</span>
                          <span className="sm:hidden">{short}</span>
                        </>
                      ) : (
                        label
                      )}
                      <span
                        aria-hidden
                        className={`text-[8px] ml-1.5 transition-colors duration-200 ease-in-out ${
                          active ? "text-gold" : "text-rule"
                        }`}
                      >
                        {active && sort.dir === -1 ? "▼" : "▲"}
                      </span>
                    </button>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {visible.map((r) => (
              <tr key={r.tld} className="border-t border-rule-faint align-top">
                <td className="py-2 pr-4 font-medium">
                  {r.gloss ? (
                    <>
                      <button
                        type="button"
                        aria-expanded={pinned === r.tld}
                        aria-label={`.${r.tld}, English: ${r.gloss}`}
                        onClick={() =>
                          setPinned(pinned === r.tld ? null : r.tld)
                        }
                        className="group relative cursor-pointer border-b border-dotted border-ink-soft font-medium hover:border-gold transition-colors duration-200 ease-in-out"
                      >
                        .{r.tld}
                        <span role="tooltip" className={`${TIP_BOX} serif italic`}>
                          “{r.gloss}”
                        </span>
                      </button>
                      {pinned === r.tld && (
                        <span className="serif italic text-ink-soft ml-2">
                          “{r.gloss}”
                        </span>
                      )}
                    </>
                  ) : (
                    <>.{r.tld}</>
                  )}
                  {r.issues.map((issue) => (
                    <IssueTag key={issue.kind + issue.other} issue={issue} punycode={r.punycode} />
                  ))}
                </td>
                <td className="py-2 pr-4">
                  {r.applicants.map(({ name, mark }, i) => (
                    <span key={name}>
                      {i > 0 && <span className="text-ink-soft"> · </span>}
                      <button
                        type="button"
                        aria-pressed={applicant === name}
                        title={
                          applicant === name ? "Clear filter" : `Only ${name}`
                        }
                        onClick={() => {
                          setApplicant(applicant === name ? "all" : name);
                          setPage(0);
                        }}
                        className={`cursor-pointer text-left underline decoration-rule underline-offset-2 hover:decoration-gold transition-colors duration-200 ease-in-out ${
                          applicant === name ? "text-gold decoration-gold" : ""
                        }`}
                      >
                        {name}
                      </button>
                      <Marker mark={mark} />
                    </span>
                  ))}
                </td>
                <td className="py-2 whitespace-nowrap text-right">
                  {r.overlap && (
                    <span className="label text-oxblood">×{r.count}</span>
                  )}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr className="border-t border-rule-faint">
                <td colSpan={3} className="py-6 text-ink-soft serif italic">
                  No strings match.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Legend present={presentMarks} />

      {rows.length > PAGE && (
        <div className="flex flex-wrap items-center gap-3 mt-4">
          <button
            type="button"
            disabled={current === 0}
            onClick={() => setPage(current - 1)}
            className="label border border-ink text-ink hover:bg-paper-deep px-3 h-10 cursor-pointer transition-colors duration-200 ease-in-out disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
          >
            Prev
          </button>
          <button
            type="button"
            disabled={current === pageCount - 1}
            onClick={() => setPage(current + 1)}
            className="label border border-ink text-ink hover:bg-paper-deep px-3 h-10 cursor-pointer transition-colors duration-200 ease-in-out disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
          >
            Next
          </button>
          <span className="label text-ink-soft">
            Page {current + 1} of {pageCount}
          </span>
          <span className="label text-ink-soft ml-auto">{countLabel}</span>
        </div>
      )}
    </div>
  );
}
