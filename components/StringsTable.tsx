"use client";

import { pressDelay } from "@/lib/press";
import Egg from "@/components/eggs/Egg";
import Link from "next/link";
import {
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { MARKS, type Mark } from "@/lib/marks";
import type { Issue } from "@/lib/derive";
import { matches, type Scope } from "@/lib/search";
import { formatDate, slugify } from "@/lib/format";

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

const PAGE_SIZES = [25, 100] as const;
const PAGE = PAGE_SIZES[0]; // default
const MIN_ROWS = 12; // floor, so typing never collapses the page under the reader
const DEBOUNCE_MS = 180;

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

function toCsv(rows: UiStringRow[], cites: Citations): string {
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

function downloadCsv(rows: UiStringRow[], scope: string, cites: Citations) {
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

function MarkBlock({ mark, inverted }: { mark: Mark; inverted?: boolean }) {
  return (
    <span
      aria-hidden
      className={`inline-flex items-center justify-center w-[13px] h-[13px] text-[9px] font-medium uppercase leading-none border ${
        inverted ? "border-paper/45 text-paper" : BLOCK[mark]
      }`}
    >
      {mark}
    </span>
  );
}

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
    // no tooltip: the legend defines all three marks four lines above the
    // table and never scrolls out from under them
    <span className="inline-block no-underline align-[0.1em]">
      <button
        type="button"
        aria-label={MARK_LABEL[mark]}
        title={MARK_LABEL[mark]}
        onClick={(e) => {
          e.stopPropagation();
          onFilter(mark);
        }}
        className="ml-1 cursor-pointer align-middle"
      >
        <MarkBlock mark={mark} />
      </button>
    </span>
  );
}

// The number in the /sources list. The native title carries the outlet, so a
// reader can identify the source without a box covering the row.
function Cite({ ids, cites }: { ids: string[]; cites: Citations }) {
  const nums = ids
    .map((id) => ({ id, c: cites[id] }))
    .filter((x): x is { id: string; c: Citation } => !!x.c);
  if (!nums.length) return null;
  return (
    <sup className="src ml-0.5 text-[9px] no-underline">
      {nums.map(({ id, c }, i) => (
        <span key={id}>
          {i > 0 && <span className="text-rule">,</span>}
          <Link
            href={`/sources#src-${c.n}`}
            title={`${c.outlet} · ${formatDate(c.date)}`}
          >
            {c.n}
          </Link>
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
  verbatim,
}: {
  label: string;
  onClear: () => void;
  verbatim?: boolean; // a string is a string: .grit, not .GRIT
}) {
  return (
    <button
      type="button"
      onClick={onClear}
      aria-label={`Clear the ${label.toLowerCase()} filter`}
      title={`Clear the ${label.toLowerCase()} filter`}
      className="label !text-[10px] border border-oxblood text-oxblood px-2 h-7 cursor-pointer hover:bg-oxblood hover:text-paper transition-colors duration-200 ease-in-out flex items-center gap-2"
    >
      {verbatim ? (
        <span className="normal-case tracking-normal text-xs">{label}</span>
      ) : (
        label
      )}
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
            <MarkBlock mark={mark} inverted={on} />
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

const applicantParam = () =>
  new URLSearchParams(window.location.search).get("applicant");

// history.pushState does not emit an event, so a client-side navigation from
// /applicants to /?applicant=Name has to be caught by patching it. Next routes
// through pushState, and back/forward arrive as popstate.
const subscribeToUrl = (onChange: () => void) => {
  const push = history.pushState;
  const replace = history.replaceState;
  history.pushState = function (...args: Parameters<typeof push>) {
    push.apply(this, args);
    onChange();
  };
  history.replaceState = function (...args: Parameters<typeof replace>) {
    replace.apply(this, args);
    onChange();
  };
  window.addEventListener("popstate", onChange);
  return () => {
    history.pushState = push;
    history.replaceState = replace;
    window.removeEventListener("popstate", onChange);
  };
};

type Sort = { key: SortKey; dir: 1 | -1 };

function SortButton({
  col,
  sort,
  onSort,
}: {
  col: (typeof SORT_COLS)[number];
  sort: Sort;
  onSort: (s: Sort) => void;
}) {
  const active = sort.key === col.key;
  return (
    <button
      type="button"
      onClick={() =>
        onSort(
          active
            ? { key: col.key, dir: sort.dir === 1 ? -1 : 1 }
            : { key: col.key, dir: col.dir ?? 1 }
        )
      }
      className={`label cursor-pointer transition-colors duration-200 ease-in-out ${
        active ? "text-ink" : "text-ink-soft hover:text-ink"
      }`}
    >
      {col.short ? (
        <>
          <span className="hidden sm:inline">{col.label}</span>
          <span className="sm:hidden">{col.short}</span>
        </>
      ) : (
        col.label
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
  );
}

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
  scope,
  clean,
  onAll,
  onScope,
}: {
  s: UiStats;
  scope: Scope;
  clean: boolean; // nothing filtered at all, which is what tile two names
  onAll: () => void;
  onScope: (next: Scope) => void;
}) {
  const cell = "p-3 sm:p-4 text-left w-full";
  const num = "text-2xl sm:text-3xl font-light";
  const cap =
    "label mt-2 text-ink-soft !tracking-[0.08em] !text-[10px] sm:!tracking-[0.18em] sm:!text-[0.6875rem] border-b border-dotted border-rule inline-block";
  const tiles = [
    { v: s.applicants, l: "Applicants", href: "/applicants" },
    {
      v: s.strings,
      l: "Strings disclosed",
      on: clean,
      act: onAll,
      title: "Show every string",
    },
    {
      v: s.contested,
      l: "Overlapping strings",
      on: scope === "overlap",
      accent: true,
      act: () => onScope("overlap"),
    },
    {
      v: s.issues,
      l: "Potential issues",
      on: scope === "issues",
      accent: true,
      act: () => onScope("issues"),
    },
  ];
  return (
    <section className="grid grid-cols-2 sm:grid-cols-4 border border-ink mb-10">
      {tiles.map(({ v, l, on, accent, act, href, title }, i) => {
        const divider = [
          i % 2 === 1 ? "border-l border-rule" : "",
          i > 1 ? "border-t border-rule sm:border-t-0" : "",
          i === 2 ? "sm:border-l sm:border-rule" : "",
        ].join(" ");
        const inner = (
          <>
            {/* shading says which view you are in; oxblood is kept for a
                filter being on, so the default does not load looking filtered */}
            <div
              className={`${num} press-word ${on && accent ? "text-oxblood" : ""}`}
              style={pressDelay(150 + i * 120)}
            >
              {v}
            </div>
            <div className={`${cap} ${on && accent ? "!text-oxblood" : ""}`}>
              {l}
            </div>
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

// A reader meets the 29 pages at the foot of page one, so the way out of them
// belongs there as well as in the toolbar. Both carry the count: "show all" on
// its own is a mode switch, "show all 722" answers how many there are.
// Fixed width, the search box's, so the count changing and the two labels
// swapping never move the CSV button beside it; disabled rather than absent
// when the table already fits on one page, for the same reason.
function ShowAll({
  all,
  total,
  onToggle,
  disabled,
}: {
  all: boolean;
  total: number;
  onToggle: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      className={`label px-3 h-10 w-44 text-left cursor-pointer border transition-colors duration-200 ease-in-out disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-gold ${
        all
          ? "border-ink text-ink hover:bg-paper-deep hover:border-gold"
          : "border-gold text-gold hover:bg-gold hover:text-paper"
      }`}
    >
      {all ? "Back to table" : `Show all ${total}`}
    </button>
  );
}

// 25, 100 or every string: one question, how much sits on the page. "All" is
// the index view, which has its own footer, so it never reads as selected here.
function PageSize({
  size,
  total,
  onPick,
  onAll,
  className,
}: {
  size: number;
  total: number;
  onPick: (n: number) => void;
  onAll: () => void;
  className?: string;
}) {
  const seg = "label px-3 cursor-pointer transition-colors duration-200 ease-in-out";
  return (
    <span className={`flex border border-ink h-10 ${className ?? ""}`}>
      {PAGE_SIZES.map((n, i) => (
        <button
          key={n}
          type="button"
          aria-pressed={size === n}
          onClick={() => onPick(n)}
          className={`${seg} ${i ? "border-l border-ink" : ""} ${
            size === n ? "bg-ink text-paper" : "text-ink hover:bg-paper-deep"
          }`}
        >
          {n}
        </button>
      ))}
      <button
        type="button"
        onClick={onAll}
        className={`${seg} border-l border-ink text-ink hover:bg-paper-deep`}
      >
        All {total}
      </button>
    </span>
  );
}

function IndexEntry({
  r,
  onJump,
}: {
  r: UiStringRow;
  onJump: (tld: string) => void;
}) {
  // no P/U/I here: at index density the boxes read as noise, and the click
  // opens the table row that carries them
  const title = [
    r.gloss && `“${r.gloss}”`,
    r.overlap && `${r.count} applicants`,
    ...r.issues.map((i) => ISSUE_TIP[i.kind]),
  ]
    .filter(Boolean)
    .join(" · ");
  return (
    <li className="break-inside-avoid row-press">
      <button
        type="button"
        title={title || undefined}
        onClick={() => onJump(r.tld)}
        className="block w-full truncate text-left py-[3px] cursor-pointer hover:text-gold transition-colors duration-200 ease-in-out"
      >
        <span className="text-gold">.</span>
        {r.tld}
        {r.overlap && (
          <sup className="ml-0.5 text-[9px] text-oxblood">{r.count}</sup>
        )}
        {r.issues.length > 0 && (
          <sup className="ml-0.5 text-[9px] text-oxblood">†</sup>
        )}
      </button>
    </li>
  );
}

// Every string on one page, always A–Z: an index is looked up, not sorted.
// Columns flow down before across, so the alphabet still reads top-to-bottom
// the way it does in a book index; a grid would lay it out in rows and scatter
// it.
function IndexView({
  rows,
  onJump,
}: {
  rows: UiStringRow[];
  onJump: (tld: string) => void;
}) {
  // The entries flow down each column, so staggering by list position fills
  // column one before the others exist. Stagger by the visual row instead,
  // measured after layout and before paint, at the table's own pace: 22ms a
  // row, everything past the first 23 rows together. Arithmetic on rows per
  // column drifts, since the browser balances the columns a row unevenly.
  const list = useRef<HTMLUListElement>(null);
  useLayoutEffect(() => {
    const ul = list.current;
    if (!ul) return;
    const top = ul.getBoundingClientRect().top;
    const items = [...ul.children] as HTMLElement[];
    const tops = items.map((li) => li.getBoundingClientRect().top - top);
    const rowHeight = Math.max(1, ...tops.slice(0, 2).map((t, i) => (i ? t - tops[0] : 0)));
    items.forEach((li, i) => {
      const row = Math.round(tops[i] / rowHeight);
      li.style.setProperty("--press-delay", `${Math.min(row * 22, 500)}ms`);
    });
  }, [rows]);
  return (
    <ul ref={list} className="columns-2 sm:columns-3 md:columns-4 lg:columns-5 gap-6 text-sm">
      {rows.map((r) => (
        <IndexEntry key={r.tld} r={r} onJump={onJump} />
      ))}
    </ul>
  );
}

// Search, applicant and marker still intersect, so an empty table is still
// reachable. It should not be a dead end: the chips that would clear it are
// above the fold the reader just scrolled past.
function NoMatch({ onClear }: { onClear: () => void }) {
  return (
    <span className="text-ink-soft serif italic">
      No strings match.{" "}
      <button
        type="button"
        onClick={onClear}
        className="cursor-pointer underline decoration-rule underline-offset-2 hover:decoration-gold hover:text-ink transition-colors duration-200 ease-in-out"
      >
        Clear filters
      </button>
    </span>
  );
}

export default function StringsTable({
  rows,
  stats,
  cites,
  backers,
}: {
  rows: UiStringRow[];
  stats: UiStats;
  cites: Citations;
  backers: Record<string, string>;
}) {
  const backerMap = useMemo(() => new Map(Object.entries(backers)), [backers]);
  const [q, setQ] = useState(""); // what the input shows
  const [query, setQuery] = useState(""); // what the table filters on
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  // /?applicant=Name — how the applicants page hands off to this table. Read
  // from the URL rather than through useSearchParams: that hook client-renders
  // everything up to the nearest Suspense boundary, which is this whole table,
  // so all 722 rows would be absent from the prerendered HTML for the sake of
  // one deep link. The server snapshot is null, so the prerender says "all"
  // and React swaps in the real value after hydration without a mismatch.
  const fromUrl = useSyncExternalStore(subscribeToUrl, applicantParam, () => null);
  // the URL supplies the opening value; touching any control takes over from it
  const [picked, setPicked] = useState<string | null>(null);
  const applicant = picked ?? fromUrl ?? "all";
  const setApplicant = setPicked;
  const [scope, setScope] = useState<Scope>("all");
  const [markFilter, setMarkFilter] = useState<Mark | null>(null);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState<number>(PAGE);
  const [pinned, setPinned] = useState<string | null>(null);
  const [view, setView] = useState<"paged" | "all">("paged");
  // the string an index entry sent the reader to, held so it stands out among
  // the strings its dotted search also matches (.con reaches .concert too)
  const [focused, setFocused] = useState<string | null>(null);
  const [sort, setSort] = useState<Sort>({ key: "tld", dir: 1 });
  const toolbarRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  // the foot of the table in either view: whichever footer is mounted
  const footRef = useRef<HTMLDivElement>(null);
  const footTop = useRef<number | null>(null);

  // A tile sits above the fold and the rows it filters below, so a tile click
  // scrolls to the toolbar. A filter clicked on the results themselves (the
  // legend, a marker, an applicant name) scrolls only once the toolbar has
  // left the window: scrolling a control the reader can see moves it out
  // from under the cursor.
  const revealResults = (onlyIfHidden = false) => {
    const el = toolbarRef.current;
    if (!el) return;
    const { top } = el.getBoundingClientRect();
    if (onlyIfHidden && top >= 0 && top <= window.innerHeight) return;
    el.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
      block: "start",
    });
  };

  const toggleMark = (m: Mark) => {
    setMarkFilter((v) => (v === m ? null : m));
    setPage(0);
    revealResults(true);
  };

  const toggleScope = (next: Scope) => {
    setScope((v) => (v === next ? "all" : next));
    setPage(0);
    revealResults();
  };

  // A change made from the foot of the table holds the foot where it is:
  // the rows above it grow or shrink, and the control the reader just used
  // stays under the cursor rather than the page leaping to the toolbar.
  const holdFoot = () => {
    footTop.current = footRef.current?.getBoundingClientRect().top ?? null;
  };
  useLayoutEffect(() => {
    if (footTop.current === null || !footRef.current) return;
    const delta = footRef.current.getBoundingClientRect().top - footTop.current;
    footTop.current = null;
    if (delta) window.scrollBy(0, delta);
  }, [pageSize, view]);

  const resize = (n: number) => {
    if (n === pageSize) return;
    holdFoot();
    // keep the reader on the page holding the rows they were reading
    setPage((p) => Math.floor((p * pageSize) / n));
    setPageSize(n);
  };

  const toggleView = (fromFoot = false) => {
    if (fromFoot) holdFoot();
    setView((v) => (v === "all" ? "paged" : "all"));
    setFocused(null);
    if (!fromFoot) revealResults();
  };

  // box and filter together, and drop a keystroke still waiting on the debounce
  const search = (v: string) => {
    if (debounce.current) clearTimeout(debounce.current);
    setQ(v);
    setQuery(v);
    setPage(0);
  };

  const clearAll = () => {
    search("");
    setApplicant("all");
    setScope("all");
    setMarkFilter(null);
    setFocused(null);
  };

  const presentMarks = useMemo(
    () => [...new Set(rows.flatMap((r) => r.applicants.map((a) => a.mark)))],
    [rows]
  );

  const applicantOptions = useMemo(
    () => [...new Set(rows.flatMap((r) => r.applicants.map((a) => a.name)))].sort(),
    [rows]
  );

  const filtered = useMemo(
    () =>
      rows.filter((r) =>
        matches(r, { q: query, applicant, scope, mark: markFilter }, backerMap)
      ),
    [rows, query, applicant, scope, markFilter, backerMap]
  );

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

  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize));
  const current = Math.min(page, pageCount - 1);
  const visible = sorted.slice(current * pageSize, (current + 1) * pageSize);
  // hold a full page while paging, and a floor under short result sets
  const padRows = Math.max(
    0,
    Math.max(MIN_ROWS, Math.min(sorted.length, pageSize)) - visible.length
  );

  // an index entry names a string: put it in the search, dotted so only the
  // string column is read, and open the table on it
  const jumpTo = (tld: string) => {
    search(`.${tld}`);
    setFocused(tld);
    setView("paged");
    revealResults();
    // the gold focus border says where the string went; not on touch, where
    // focus raises the keyboard
    const box = searchRef.current;
    if (box && window.matchMedia("(hover: hover)").matches) {
      box.focus({ preventScroll: true });
      box.setSelectionRange(box.value.length, box.value.length);
    }
  };

  const clean =
    !query.trim() && applicant === "all" && scope === "all" && !markFilter;

  // the filename should say which slice of the table it holds
  const csvScope = clean
      ? "all"
      : [
          scope === "overlap" && "overlapping",
          scope === "issues" && "issues",
          markFilter && MARK_LABEL[markFilter].split(" ")[0],
          applicant !== "all" && slugify(applicant),
          query.trim() && "search",
        ]
          .filter(Boolean)
          .join("-");

  const countLabel =
    filtered.length === rows.length
      ? `${rows.length} strings`
      : `${filtered.length} of ${rows.length} strings`;

  // Re-press: the rows are keyed on the slice they show, so a new page, filter,
  // sort or view remounts them and the press flourish runs again, in either
  // direction of Show all / Back to table.
  const slice = [
    current, query, applicant, scope, markFilter, sort.key, sort.dir, pageSize, view,
  ].join("|");

  return (
    <div>
      <StatTiles
        s={stats}
        scope={scope}
        clean={clean}
        onAll={() => {
          clearAll();
          revealResults();
        }}
        onScope={toggleScope}
      />

      {/* separates the summary from the table's own controls — the rule the
          removed section heading used to carry */}
      <div className="double-rule mb-5" />

      <div ref={toolbarRef} className="mb-5 scroll-mt-4">
        <div className="flex flex-wrap items-center gap-3">
        <input
          ref={searchRef}
          type="search"
          value={q}
          onChange={(e) => {
            const v = e.target.value;
            setQ(v);
            if (debounce.current) clearTimeout(debounce.current);
            debounce.current = setTimeout(() => {
              setQuery(v);
              setPage(0);
            }, DEBOUNCE_MS);
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
        <ShowAll
          all={view === "all"}
          total={sorted.length}
          onToggle={() => toggleView()}
          disabled={view === "paged" && sorted.length <= pageSize}
        />
        <button
          type="button"
          onClick={() => downloadCsv(sorted, csvScope, cites)}
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
        </div>

        {/* What the table is currently showing, rather than a control acting on
            it. Right-aligned it wrapped to a line of its own and read as
            unattached; set flush left it lines up with the strings it counts.
            The count leads in a slot the width of the search box, so the chips
            start under the applicant menu and a chip coming or going, or the
            count changing, moves nothing; tabular figures keep the number
            changing in place. */}
        <div className="flex flex-wrap items-center gap-3 mt-3">
          <span className="label text-ink-soft tabular-nums shrink-0 sm:w-44">
            {countLabel}
          </span>
          {scope !== "all" && (
            <FilterChip
              label={
                scope === "overlap" ? "Overlapping strings" : "Potential issues"
              }
              onClear={() => {
                setScope("all");
                setPage(0);
              }}
            />
          )}
          {query.trim() && (
            <FilterChip
              label={query.trim()}
              verbatim
              onClear={() => {
                search("");
                setFocused(null);
              }}
            />
          )}
        </div>
      </div>

      <Legend
        present={presentMarks}
        active={markFilter}
        onToggle={toggleMark}
      />

      {pinned && <Backdrop onClose={() => setPinned(null)} />}

      {view === "all" ? (
        sorted.length === 0 ? (
          <div className="py-6">
            <NoMatch onClear={clearAll} />
          </div>
        ) : (
          <>
            {/* the key to the two superscripts, flush left with the strings it reads on */}
            <div className="pb-2 mb-4 border-b border-rule">
              <span className="label !text-[10px] text-ink-soft">
                <sup className="text-oxblood">n</sup> applicants
                <span className="text-rule mx-2">·</span>
                <span className="text-oxblood">†</span> potential issue
              </span>
            </div>
            <IndexView key={slice} rows={filtered} onJump={jumpTo} />
            {/* right, where the page-size box sits in the table's own footer */}
            <div ref={footRef} className="flex flex-wrap items-center justify-end gap-3 mt-6">
              <span className="label text-ink-soft">{countLabel}</span>
              <ShowAll all total={sorted.length} onToggle={() => toggleView(true)} />
            </div>
          </>
        )
      ) : (
        <>
        {/* overflow-visible on sm+ so hover tooltips aren't clipped; tooltips are hidden below sm */}
        {/* While paging, every page holds the same height so Prev/Next does not
            move the footer, and a short result set keeps a floor under it so
            typing does not collapse the page. Filler rows rather than a pixel
            constant, so this tracks whatever padding a real row has. */}
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
                {SORT_COLS.map((col) => {
                  const active = sort.key === col.key;
                  return (
                    <th
                      key={col.key}
                      aria-sort={
                        active
                          ? sort.dir === 1
                            ? "ascending"
                            : "descending"
                          : undefined
                      }
                      className={`pb-2 font-medium whitespace-nowrap ${
                        col.right ? "text-right" : "pr-4"
                      }`}
                    >
                      <SortButton
                        col={col}
                        sort={sort}
                        onSort={(v) => {
                          setSort(v);
                          setPage(0);
                        }}
                      />
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody key={slice}>
              {visible.map((r, vi) => (
                <tr
                  key={r.tld}
                  className={`border-t border-rule-faint align-top row-press ${
                    focused === r.tld ? "bg-paper-deep" : ""
                  }`}
                  style={pressDelay(Math.min(vi * 22, 500))}
                >
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
                      <span>
                        <span className="text-gold">.</span>
                        {r.tld}
                      </span>
                    )}
                    {r.issues.map((issue) => (
                      <IssueTag key={issue.kind + issue.other} issue={issue} punycode={r.punycode} />
                    ))}
                  </td>
                  <td className="py-2 pr-4">
                    <span className="flex items-baseline gap-2">
                    <span>
                    {r.applicants.map(({ name, mark, sourceIds }, i) => {
                      return (
                        <span key={name}>
                          {i > 0 && <span className="text-ink-soft"> · </span>}
                          <span className="whitespace-nowrap">
                            <Egg name={name}>
                            <button
                              type="button"
                              aria-pressed={applicant === name}
                              onClick={() => {
                                setApplicant(applicant === name ? "all" : name);
                                setPage(0);
                                revealResults(true);
                              }}
                              className={`cursor-pointer text-left underline decoration-rule underline-offset-2 hover:decoration-gold transition-colors duration-200 ease-in-out ${
                                applicant === name ? "text-gold decoration-gold" : ""
                              }`}
                            >
                              {name}
                            </button>
                            </Egg>
                            <Marker
                              mark={mark}
                              onFilter={toggleMark}
                            />
                            <Cite ids={sourceIds} cites={cites} />
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
                            <i
                              key={i}
                              className="inline-block w-px h-3.5 bg-oxblood tally-ink"
                              style={pressDelay(Math.min(vi * 22, 500) + 120 + i * 55)}
                            />
                          ))}
                        </span>
                        <span className="sr-only">{r.count} applicants</span>
                      </>
                    )}
                  </td>
                </tr>
              ))}
              {Array.from({ length: padRows }, (_, i) => (
                <tr key={`pad-${i}`} className="border-t border-rule-faint" aria-hidden>
                  <td className="py-2" colSpan={3}>
                    &nbsp;
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr className="border-t border-rule-faint">
                  <td colSpan={3} className="py-6">
                    <NoMatch onClear={clearAll} />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        </>
      )}

      {/* Prev and Next stay put: the reader is at the foot of the table, and
          the next page's rows replace these where they stand */}
      {view === "paged" && sorted.length > pageSize && (
        <div ref={footRef} className="flex flex-wrap items-center gap-3 mt-4">
          <button
            type="button"
            disabled={current === 0}
            onClick={() => setPage(current - 1)}
            className="label border border-ink text-ink hover:bg-paper-deep px-3 h-10 cursor-pointer transition-colors duration-200 ease-in-out disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
          >
            Prev
          </button>
          <span className="label text-ink-soft tabular-nums">
            {current + 1} of {pageCount}
          </span>
          <button
            type="button"
            disabled={current === pageCount - 1}
            onClick={() => setPage(current + 1)}
            className="label border border-ink text-ink hover:bg-paper-deep px-3 h-10 cursor-pointer transition-colors duration-200 ease-in-out disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
          >
            Next
          </button>
          <PageSize
            size={pageSize}
            total={sorted.length}
            onPick={resize}
            onAll={() => toggleView(true)}
            className="ml-auto"
          />
        </div>
      )}
    </div>
  );
}
