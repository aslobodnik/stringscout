"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { MARKS, type Issue, type Mark } from "@/lib/derive";
import { sourceIndex, sources, type Source } from "@/data/sources";

const sourceById = new Map(sources.map((s) => [s.id, s]));

export type UiStringRow = {
  tld: string;
  punycode: string; // A-label; same as tld for ASCII strings
  gloss?: string; // English translation, shown on hover for non-Latin strings
  existing: boolean; // already a delegated TLD in the IANA root zone
  issues: Issue[];
  applicants: {
    name: string;
    mark: Mark;
    backers?: string;
    sourceIds: string[];
  }[];
  overlap: boolean;
  count: number;
};

const PAGE = 25;

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

function toCsv(rows: UiStringRow[]): string {
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
            .map((id) => sourceIndex.get(id))
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

function downloadCsv(rows: UiStringRow[], scope: string) {
  const stamp = new Date().toISOString().slice(0, 10);
  const url = URL.createObjectURL(
    new Blob([toCsv(rows)], { type: "text/csv;charset=utf-8" })
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
            className="paper-scroll absolute left-0 top-full z-20 mt-1 min-w-full w-max max-h-[50vh] overflow-y-auto border border-ink bg-paper"
          >
            {items.map((v) => (
              <li
                key={v}
                role="option"
                aria-selected={v === value}
                className="border-t border-dotted border-rule first:border-t-0"
              >
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

// How firmly an applicant tied itself to a string. Every claim carries one:
// "u" is 83% of them and says only that nobody stated which, which a reader
// should be told rather than left to infer from an absence. It is drawn at
// hairline weight so the two marks that carry information still read first.
const BLOCK: Record<Mark, string> = {
  p: "bg-ink text-paper border-ink",
  u: "border-rule-faint text-ink-soft",
  i: "text-oxblood border-oxblood",
};

function Marker({
  mark,
  onFilter,
}: {
  mark: Mark;
  onFilter: (m: Mark) => void;
}) {
  return (
    // inline-block keeps the applicant button's underline from running beneath
    // the block: decorations are not drawn through an atomic inline
    <span className="group relative inline-block no-underline align-[0.1em]">
      <button
        type="button"
        aria-label={MARK_LABEL[mark]}
        onClick={(e) => {
          e.stopPropagation();
          onFilter(mark);
        }}
        className={`ml-1 border w-[13px] h-[13px] leading-none text-[9px] font-medium uppercase cursor-pointer transition-colors duration-200 ease-in-out ${BLOCK[mark]}`}
      >
        {mark}
      </button>
      <span role="tooltip" className={TIP_BOX}>
        {MARK_LABEL[mark]}
      </span>
    </span>
  );
}

// The number in the /sources list. The native title carries the outlet, so a
// reader can identify the source without a box covering the row.
function Cite({ ids }: { ids: string[] }) {
  const nums = ids
    .map((id) => ({ id, n: sourceIndex.get(id), s: sourceById.get(id) }))
    .filter((x): x is { id: string; n: number; s: Source } => !!x.n && !!x.s);
  if (!nums.length) return null;
  return (
    <sup className="src ml-0.5 text-[9px] no-underline">
      {nums.map(({ id, n, s }, i) => (
        <span key={id}>
          {i > 0 && <span className="text-rule">,</span>}
          <a href={`/sources#src-${n}`} title={`${s.outlet} · ${s.date}`}>
            {n}
          </a>
        </span>
      ))}
    </sup>
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

// The string column is a fixed 128px below sm, so an inline tag has nowhere
// to go and spills under the applicants column. Stack it under the string
// there and only sit it alongside once there is room.
const TAG =
  "group relative label text-oxblood !text-[9px] block mt-1 w-fit sm:inline sm:mt-0 sm:ml-2 sm:whitespace-nowrap";

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

function FilterChip({
  label,
  onClear,
}: {
  label: string;
  onClear: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClear}
      aria-label={`Clear the ${label.toLowerCase()} filter`}
      title={`Clear the ${label.toLowerCase()} filter`}
      className="label !text-[10px] border border-oxblood text-oxblood px-2 h-7 cursor-pointer hover:bg-oxblood hover:text-paper transition-colors duration-200 ease-in-out flex items-center gap-2"
    >
      {label}
      <span aria-hidden className="text-[11px] leading-none">
        ×
      </span>
    </button>
  );
}

// The legend doubles as a filter: the markers are the only way to separate a
// confirmed application from an announcement, so the definition and the way to
// isolate it belong in the same control.
function Legend({
  present,
  active,
  onToggle,
}: {
  present: Mark[];
  active: Mark | null;
  onToggle: (m: Mark) => void;
}) {
  return (
    <div className="mt-4 mb-4 flex flex-wrap items-center gap-x-5 gap-y-2">
      {MARKS.filter((m) => present.includes(m.mark)).map(({ mark, label }) => {
        const on = active === mark;
        return (
          <button
            key={mark}
            type="button"
            aria-pressed={on}
            title={on ? "Show every marker" : `Show only ${label}`}
            onClick={() => onToggle(mark)}
            className={`flex items-center gap-1.5 cursor-pointer px-1.5 -mx-1.5 py-1 transition-colors duration-200 ease-in-out focus-visible:outline-2 focus-visible:outline-gold ${
              on ? "bg-ink text-paper" : "hover:bg-paper-deep"
            }`}
          >
            {/* selected, the whole control is one ink field — a bordered
                swatch inside it just reads as a box in a box */}
            <span
              aria-hidden
              className={`inline-flex items-center justify-center w-[13px] h-[13px] text-[9px] font-medium uppercase leading-none border ${
                on ? "border-paper/45 text-paper" : BLOCK[mark]
              }`}
            >
              {mark}
            </span>
            <span
              className={`label !text-[10px] !tracking-[0.08em] ${
                on ? "text-paper" : "text-ink-soft"
              }`}
            >
              {label}
            </span>
          </button>
        );
      })}
    </div>
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

export type UiStats = {
  applicants: number;
  strings: number;
  contested: number;
  issues: number;
};

// Every tile is a way in: two filter the table, one clears it, one leaves for
// the applicants page. The number and the way to see behind it belong in the
// same place.
function StatTiles({
  s,
  contestedOnly,
  issuesOnly,
  onAll,
  onContested,
  onIssues,
}: {
  s: UiStats;
  contestedOnly: boolean;
  issuesOnly: boolean;
  onAll: () => void;
  onContested: () => void;
  onIssues: () => void;
}) {
  const cell = "p-3 sm:p-4 text-left w-full";
  const num = "text-2xl sm:text-3xl font-light";
  const cap =
    "label mt-2 text-ink-soft !tracking-[0.08em] !text-[10px] sm:!tracking-[0.18em] sm:!text-[0.6875rem] border-b border-dotted border-rule inline-block";
  const tiles = [
    { v: s.applicants, l: "Applicants", href: "/applicants" },
    { v: s.strings, l: "Strings disclosed", act: onAll, title: "Show every string" },
    {
      v: s.contested,
      l: "Overlapping strings",
      on: contestedOnly,
      act: onContested,
    },
    { v: s.issues, l: "Potential issues", on: issuesOnly, act: onIssues },
  ];
  return (
    <section className="grid grid-cols-2 sm:grid-cols-4 border border-ink mb-10">
      {tiles.map(({ v, l, on, act, href, title }, i) => {
        const divider = [
          i % 2 === 1 ? "border-l border-rule" : "",
          i > 1 ? "border-t border-rule sm:border-t-0" : "",
          i === 2 ? "sm:border-l sm:border-rule" : "",
        ].join(" ");
        const inner = (
          <>
            <div className={`${num} ${on ? "text-oxblood" : ""}`}>{v}</div>
            <div className={`${cap} ${on ? "!text-oxblood" : ""}`}>{l}</div>
          </>
        );
        const shell = `${cell} ${divider} cursor-pointer transition-colors duration-200 ease-in-out focus-visible:outline-2 focus-visible:outline-gold ${
          on ? "bg-paper-deep" : "hover:bg-paper-deep"
        }`;
        if (href)
          return (
            <Link key={l} href={href} title="See every applicant" className={`${shell} block`}>
              {inner}
            </Link>
          );
        return (
          <button
            key={l}
            type="button"
            aria-pressed={on}
            title={title ?? (on ? "Show all strings" : `Show only these ${v}`)}
            onClick={act}
            className={shell}
          >
            {inner}
          </button>
        );
      })}
    </section>
  );
}

export default function StringsTable({
  rows,
  stats,
}: {
  rows: UiStringRow[];
  stats: UiStats;
}) {
  const [q, setQ] = useState("");
  // /?applicant=Name — how the applicants page hands off to this table
  const [applicant, setApplicant] = useState(() => {
    if (typeof window === "undefined") return "all";
    return new URLSearchParams(window.location.search).get("applicant") ?? "all";
  });
  const [contestedOnly, setContestedOnly] = useState(false);
  const [issuesOnly, setIssuesOnly] = useState(false);
  const [markFilter, setMarkFilter] = useState<Mark | null>(null);
  const [page, setPage] = useState(0);
  const [pinned, setPinned] = useState<string | null>(null);
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({
    key: "tld",
    dir: 1,
  });
  const toolbarRef = useRef<HTMLDivElement>(null);

  // A tile sits above the fold and the rows it filters sit below it, so the
  // filtering is invisible without this.
  const revealResults = () =>
    toolbarRef.current?.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
      block: "start",
    });

  const presentMarks = useMemo(
    () => [...new Set(rows.flatMap((r) => r.applicants.map((a) => a.mark)))],
    [rows]
  );

  const applicantOptions = useMemo(
    () => [...new Set(rows.flatMap((r) => r.applicants.map((a) => a.name)))].sort(),
    [rows]
  );

  const filtered = useMemo(() => {
    const raw = q.trim().toLowerCase();
    // A leading dot means the reader wants the string itself. Without it the
    // search also reaches glosses and the people behind each applicant —
    // otherwise "anime" drags in every string backed by Animecoin.
    const stringOnly = raw.startsWith(".");
    const needle = raw.replace(/^\./, "");
    return rows.filter((r) => {
      if (contestedOnly && !r.overlap) return false;
      if (issuesOnly && !r.issues.length) return false;
      if (markFilter && !r.applicants.some((a) => a.mark === markFilter))
        return false;
      if (applicant !== "all" && !r.applicants.some((a) => a.name === applicant))
        return false;
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
    });
  }, [rows, q, applicant, contestedOnly, issuesOnly, markFilter]);

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

  // the filename should say which slice of the table it holds
  const csvScope =
    filtered.length === rows.length
      ? "all"
      : [
          contestedOnly && "overlapping",
          issuesOnly && "issues",
          markFilter && MARK_LABEL[markFilter].split(" ")[0],
          applicant !== "all" && applicant.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
          q.trim() && "search",
        ]
          .filter(Boolean)
          .join("-") || "filtered";

  const countLabel =
    filtered.length === rows.length
      ? `${rows.length} strings`
      : `${filtered.length} of ${rows.length} strings`;

  return (
    <div>
      <StatTiles
        s={stats}
        contestedOnly={contestedOnly}
        issuesOnly={issuesOnly}
        onAll={() => {
          setQ("");
          setApplicant("all");
          setContestedOnly(false);
          setIssuesOnly(false);
          setMarkFilter(null);
          setPage(0);
          revealResults();
        }}
        onContested={() => {
          setContestedOnly((v) => !v);
          setPage(0);
          revealResults();
        }}
        onIssues={() => {
          setIssuesOnly((v) => !v);
          setPage(0);
          revealResults();
        }}
      />

      <div className="double-rule pt-4 mb-5 flex items-baseline justify-between">
        <h2 className="label !text-sm text-ink">All Applied Strings</h2>
        <span className="label text-ink-soft">I</span>
      </div>

      <div
        ref={toolbarRef}
        className="flex flex-wrap items-center gap-3 mb-5 scroll-mt-14"
      >
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
          onClick={() => downloadCsv(sorted, csvScope)}
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
        {contestedOnly && (
          <FilterChip
            label="Overlapping strings"
            onClear={() => {
              setContestedOnly(false);
              setPage(0);
            }}
          />
        )}
        {issuesOnly && (
          <FilterChip
            label="Potential issues"
            onClear={() => {
              setIssuesOnly(false);
              setPage(0);
            }}
          />
        )}
        <span className="label text-ink-soft ml-auto">{countLabel}</span>
      </div>

      <Legend
        present={presentMarks}
        active={markFilter}
        onToggle={(m) => {
          setMarkFilter((v) => (v === m ? null : m));
          setPage(0);
        }}
      />

      {pinned && <Backdrop onClose={() => setPinned(null)} />}

      {/* overflow-visible on sm+ so hover tooltips aren't clipped; tooltips are hidden below sm */}
      <div className="overflow-x-auto sm:overflow-visible">
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
                        <span className="text-gold">.</span>
                        {r.tld}
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
                    <>
                      <span className="text-gold">.</span>
                      {r.tld}
                    </>
                  )}
                  {r.issues.map((issue) => (
                    <IssueTag key={issue.kind + issue.other} issue={issue} punycode={r.punycode} />
                  ))}
                </td>
                <td className="py-2 pr-4">
                  <span className="flex items-baseline gap-2">
                  <span>
                  {r.applicants.map(({ name, mark, sourceIds }, i) => {
                    // keep the block and cite glued to the last word so they
                    // can't wrap onto a line of their own on narrow screens
                    const cut = name.lastIndexOf(" ");
                    const head = cut === -1 ? "" : name.slice(0, cut + 1);
                    const tail = cut === -1 ? name : name.slice(cut + 1);
                    return (
                      <span key={name}>
                        {i > 0 && <span className="text-ink-soft"> · </span>}
                        <span className="whitespace-nowrap">
                          <button
                            type="button"
                            aria-pressed={applicant === name}
                            title={
                              applicant === name ? "Clear filter" : `Only ${name}`
                            }
                            onClick={() => {
                              setApplicant(applicant === name ? "all" : name);
                              setPage(0);
                              revealResults();
                            }}
                            className={`cursor-pointer text-left underline decoration-rule underline-offset-2 hover:decoration-gold transition-colors duration-200 ease-in-out ${
                              applicant === name ? "text-gold decoration-gold" : ""
                            }`}
                          >
                            {head}
                            <span className="whitespace-nowrap">{tail}</span>
                          </button>
                          <Marker
                            mark={mark}
                            onFilter={(m) => {
                              setMarkFilter((v) => (v === m ? null : m));
                              setPage(0);
                              revealResults();
                            }}
                          />
                          <Cite ids={sourceIds} />
                        </span>
                      </span>
                    );
                  })}
                  </span>
                  {/* dot leader binds the row to its overlap tally, index-style */}
                  <span
                    aria-hidden
                    className={`flex-1 min-w-4 -translate-y-[3px] border-b border-dotted ${
                      r.overlap ? "border-oxblood/40" : "border-rule-faint"
                    }`}
                  />
                  </span>
                </td>
                <td className="py-2 whitespace-nowrap text-right">
                  {r.overlap && (
                    <>
                      {/* ledger tally: one stroke per applicant */}
                      <span
                        aria-hidden
                        className="inline-flex items-baseline gap-[3px]"
                      >
                        {Array.from({ length: r.count }, (_, i) => (
                          <i key={i} className="inline-block w-px h-3.5 bg-oxblood" />
                        ))}
                      </span>
                      <span className="sr-only">{r.count} applicants</span>
                    </>
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


      {sorted.length > PAGE && (
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
