"use client";

import { pressDelay } from "@/lib/press";
import Egg from "@/components/eggs/Egg";
import Tip from "@/components/Tip";
import Tld from "@/components/Tld";
import RoundRule, { type RoundData } from "@/components/RoundRule";
import {
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import type { Mark } from "@/lib/marks";
import { matches, type Scope } from "@/lib/search";
import { slugify } from "@/lib/format";
import { subscribeToUrl } from "@/lib/url";
import { ApplicantSelect, Backdrop } from "./strings-table/ApplicantSelect";
import { Cite } from "./strings-table/Cite";
import { IndexView } from "./strings-table/IndexView";
import { IssueTag } from "./strings-table/IssueTag";
import { Legend, MARK_LABEL, Marker } from "./strings-table/Marker";
import { ShortcutSheet } from "./strings-table/ShortcutSheet";
import { useTableKeys } from "./strings-table/useTableKeys";
import { StatTiles } from "./strings-table/StatTiles";
import { Tally } from "./strings-table/Tally";
import { downloadCsv } from "./strings-table/csv";
import type { Citations, UiStats, UiStringRow } from "./strings-table/types";

// the shapes page.tsx builds for the table, kept importable from here
export type { Citation, Citations, UiStats, UiStringRow } from "./strings-table/types";

const PAGE_SIZES = [25, 100] as const;
const PAGE = PAGE_SIZES[0]; // default
const MIN_ROWS = 12; // floor, so typing never collapses the page under the reader
const DEBOUNCE_MS = 180;
const PAGER =
  "label border border-ink text-ink hover:bg-paper-deep px-3 h-10 cursor-pointer transition-colors duration-200 ease-in-out disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent";

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
      className="group relative label !text-[10px] border border-oxblood text-oxblood px-2 h-7 cursor-pointer hover:bg-oxblood hover:text-paper transition-colors duration-200 ease-in-out flex items-center gap-2"
    >
      <Tip>Clear the {label.toLowerCase()} filter</Tip>
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

type SortKey = "tld" | "applicants" | "overlap";

// dir: default sort direction (overlaps = most applicants first); short: sub-sm header label
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
  round,
}: {
  rows: UiStringRow[];
  stats: UiStats;
  cites: Citations;
  backers: Record<string, string>;
  // the round rule under the count tiles: the server derives the shares,
  // the table wires its blocks to the applicant filter
  round?: RoundData;
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
  // The URL is the store: a pick writes ?applicant= and the subscription
  // above reads it back, so a deep link, a Dateline link and a tap in a row
  // all agree. replaceState, not push: a filter is not a history entry.
  const applicant = fromUrl ?? "all";
  const setApplicant = (v: string) => {
    const u = new URL(window.location.href);
    if (v === "all") u.searchParams.delete("applicant");
    else u.searchParams.set("applicant", v);
    history.replaceState(history.state, "", u);
  };
  const [scope, setScope] = useState<Scope>("all");
  const [markFilter, setMarkFilter] = useState<Mark | null>(null);
  const [pageSize, setPageSize] = useState<number>(PAGE);
  const [pinned, setPinned] = useState<string | null>(null);
  const [view, setView] = useState<"paged" | "all">("paged");
  // the string an index entry sent the reader to, held so it stands out among
  // the strings its dotted search also matches (.con reaches .concert too)
  const [focused, setFocused] = useState<string | null>(null);
  const [sort, setSort] = useState<Sort>({ key: "tld", dir: 1 });
  // A new filter or sort starts from page one: the page is held against the
  // filter it was turned under and reads as 0 under any other, so no setter
  // has to remember to reset it.
  const filterKey = [query, applicant, scope, markFilter, sort.key, sort.dir].join("|");
  const [paging, setPaging] = useState({ key: filterKey, n: 0 });
  const page = paging.key === filterKey ? paging.n : 0;
  const setPage = (n: number) => setPaging({ key: filterKey, n });
  const [sheet, setSheet] = useState(false);
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
    revealResults(true);
  };

  const toggleScope = (next: Scope) => {
    setScope((v) => (v === next ? "all" : next));
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
    setPage(Math.floor((current * pageSize) / n));
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
    () =>
      [...new Set(rows.flatMap((r) => r.applicants.map((a) => a.name)))].sort(
        collator.compare
      ),
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

  const focusSearch = () => {
    revealResults(true);
    const box = searchRef.current;
    if (!box) return;
    box.focus({ preventScroll: true });
    box.select();
  };
  const turnPage = (p: number) => {
    setPage(p);
    // a reader still above the table is taken to it; at its foot the new
    // rows replace the old where they stand, as they do for Prev and Next
    const el = toolbarRef.current;
    if (el && el.getBoundingClientRect().top > window.innerHeight) revealResults();
  };
  const clean =
    !query.trim() && applicant === "all" && scope === "all" && !markFilter;
  useTableKeys({
    sheet,
    setSheet,
    focusSearch,
    dirty: !clean || !!q || !!pinned,
    clear: () => {
      clearAll();
      setPinned(null);
    },
    paged: view === "paged",
    page: current,
    pageCount,
    turnPage,
  });

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
  const slice = [current, filterKey, pageSize, view].join("|");

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
      {round && (
        <RoundRule
          round={round}
          cites={cites}
          active={applicant}
          onPick={(name) => {
            setApplicant(applicant === name ? "all" : name);
            revealResults(true);
          }}
        />
      )}

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
            debounce.current = setTimeout(() => setQuery(v), DEBOUNCE_MS);
          }}
          placeholder="Search…"
          aria-label="Search strings"
          className="border border-ink bg-transparent px-3 h-10 text-base sm:text-sm w-full sm:w-44 placeholder:text-ink-soft focus:border-gold focus:outline-none transition-colors duration-200 ease-in-out"
        />
        <ApplicantSelect
          options={applicantOptions}
          value={applicant}
          onChange={setApplicant}
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
          aria-label="Download the strings below as CSV, punycode included"
          className="group relative label border border-ink text-ink px-3 h-10 cursor-pointer hover:bg-paper-deep hover:border-gold transition-colors duration-200 ease-in-out flex items-center gap-2"
        >
          <Tip side="right">Download the strings below as CSV, punycode included</Tip>
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
              onClear={() => setScope("all")}
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
      <ShortcutSheet open={sheet} onClose={() => setSheet(false)} />

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
                        onSort={setSort}
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
                          <Tld>{r.tld}</Tld>
                          <Tip className="serif italic">“{r.gloss}”</Tip>
                        </button>
                        {pinned === r.tld && (
                          <span className="serif italic text-ink-soft ml-2">
                            “{r.gloss}”
                          </span>
                        )}
                      </>
                    ) : (
                      <span>
                        <Tld>{r.tld}</Tld>
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
                              data-applicant={i}
                              aria-current={applicant === name || undefined}
                              onClick={() => {
                                // a name already filtered on has nothing to set, so the
                                // click scrolls to the toolbar rather than doing nothing
                                const same = applicant === name;
                                setApplicant(name);
                                revealResults(!same);
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
                      className={`tally-leader flex-1 min-w-4 -translate-y-[3px] border-b border-dotted transition-colors duration-300 ease-in-out ${
                        r.overlap ? "border-oxblood/40" : "border-rule-faint"
                      }`}
                    />
                    </span>
                  </td>
                  <td className="py-2 whitespace-nowrap text-right">
                    {r.overlap && (
                      <>
                        <Tally count={r.count} delay={Math.min(vi * 22, 500) + 120} seed={r.tld} />
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
            className={PAGER}
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
            className={PAGER}
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
