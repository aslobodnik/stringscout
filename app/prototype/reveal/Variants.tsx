"use client";

// PROTOTYPE, throwaway. The post-reveal strings view on mock data: the
// homepage's table, one line per application, with a Replacement column
// ahead of the applicant and its Parent after.
//
//   replacement printed plain  = usable
//   replacement struck through = knocked out; superscript = by how many, named on hover
//   a dash                     = none named, or no parent

import Link from "next/link";
import { memo, useCallback, useDeferredValue, useEffect, useMemo, useState } from "react";
import KindRule from "./KindRule";
import Tip from "@/components/Tip";
import { pressDelay } from "@/lib/press";
import {
  DASH,
  FIT,
  ENTITIES,
  Hover,
  LINK,
  MockTag,
  Replacement,
  TAG,
  TH,
  inferred,
  Shown,
} from "./bits";
import type { MockApp, MockData, MockGroup } from "./mock";
import { SortHead, type Sort, type SortCol } from "@/components/SortButton";
import { csvText, saveCsv } from "@/components/strings-table/csv";
import { slugify } from "@/lib/format";

const INPUT =
  "border border-ink bg-transparent px-3 h-10 text-base sm:text-sm w-full placeholder:text-ink-soft focus:border-gold focus:outline-none transition-colors duration-200 ease-in-out";
// replacement, applicant, parent: the head and every line share it
// minmax(0,1fr): a long applicant name truncates instead of widening the column
const LINE =
  "grid grid-cols-[4.5rem_minmax(0,1fr)] sm:grid-cols-[8rem_minmax(0,1fr)] lg:grid-cols-[8rem_minmax(0,1fr)_12rem] gap-x-4";

// the heads that sort: the string A to Z, or its applications, most first
type SortKey = "string" | "apps";
const SORT_COLS: SortCol<SortKey>[] = [
  { key: "string", label: "String" },
  { key: "apps", label: "Apps", dir: -1 },
];
const SORT_TH = "label !tracking-[0.06em] sm:!tracking-[0.18em]";

// The CSV is the table as shown: its rows, filtered and sorted, one per
// string. Each string's applications run as parallel "; " lists, so entry n
// of applicants, parents, replacements and the rest is the same application.
const CSV_COLS = [
  "string",
  "punycode",
  "english",
  "applications",
  "contested",
  "applicants",
  "parents",
  "replacements",
  "replacement_status",
  "kinds",
] as const;

// What the applicant designated the string as (AGB Q179, Q158, Module 1),
// else open. A registry that asked to keep every name for itself without a
// brand (AGB Q185-187) is marked closed.
type Kind = "open" | "brand" | "community" | "geo" | "closed";
const kindOf = (a: MockApp): Kind =>
  a.registration === "brand" || a.type === "brand"
    ? "brand"
    : a.type === "community"
      ? "community"
      : a.type === "geo"
        ? "geo"
        : a.registration === "closed"
          ? "closed"
          : "open";
const KINDS: { value: Kind; label: string }[] = [
  { value: "open", label: "Open" },
  { value: "brand", label: "Brand" },
  { value: "community", label: "Community" },
  { value: "geo", label: "Geo" },
  { value: "closed", label: "Closed" },
];
// a string is counted once: by its first designation in this order, open last
const KIND_ORDER: Kind[] = ["brand", "community", "geo", "closed", "open"];
const kindOfRow = (apps: MockApp[]): Kind => {
  const have = new Set(apps.map(kindOf));
  return KIND_ORDER.find((k) => have.has(k))!;
};
const KIND_TAG: Record<Kind, string> = {
  open: "",
  brand: ".brand",
  community: "community",
  geo: "geo",
  closed: "closed",
};

// what the search box reads: every column, or the one a picked suggestion or
// a ?by= link set. A person is read only when picked: the names behind 1,614
// applications would flood an open search with rows the query does not name.
type By = "all" | "string" | "applicant" | "parent" | "person";
const BY: { value: Exclude<By, "all">; label: string }[] = [
  { value: "string", label: "String" },
  { value: "applicant", label: "Applicant" },
  { value: "parent", label: "Parent" },
  { value: "person", label: "Person" },
];
const matches = (
  a: MockApp,
  q: string,
  group: MockGroup | undefined,
  by: By,
  people: string[] | undefined, // the names on the application, lowercased
) => {
  const t = q.trim().toLowerCase().replace(/^\./, "");
  if (!t) return true;
  const string = a.tld.includes(t) || (a.uLabel ?? "").toLowerCase().includes(t); // the primary; replacements are a filter, not a search
  const applicant = a.applicant.toLowerCase().includes(t);
  const parent =
    (a.entity.parent ?? "").toLowerCase().includes(t) ||
    (group?.link === "parent" && group.name.toLowerCase().includes(t));
  switch (by) {
    case "string":
      return string;
    case "applicant":
      return applicant;
    case "parent":
      return parent;
    case "person":
      return (people ?? []).some((n) => n.includes(t));
    default:
      return string || applicant || parent;
  }
};

type Scope = "all" | "contention" | "uncontested";
const SCOPE_LABEL: Record<Scope, string> = {
  all: "Strings",
  contention: "Contested",
  uncontested: "Uncontested",
};

// The table's two filters, each a segmented control under its own name: what
// state the string is in, and what its replacement is. One of each may be on,
// since they are different questions. The rows show the states their own way
// (lines, strike, dash), so the controls carry words, not marks.
type RMark = "live" | "blocked" | "none";
const rmarkOf = (a: MockApp): RMark =>
  !a.replacement ? "none" : a.blockers.length ? "blocked" : "live";
type Opt<T> = { value: T; short: string; detail: string };
const SCOPE_OPTS: Opt<Exclude<Scope, "all">>[] = [
  { value: "contention", short: SCOPE_LABEL.contention, detail: "Two or more applications for the string: a contention set." },
  { value: "uncontested", short: SCOPE_LABEL.uncontested, detail: "One application for the string." },
];
const RMARK_OPTS: Opt<RMark>[] = [
  { value: "live", short: "Live", detail: "Replacement named, and nobody else applied for it or named it (AGB §5.1)." },
  { value: "blocked", short: "Blocked", detail: "Replacement named, but another applicant applied for it or named it too (AGB §5.1)." },
  { value: "none", short: "None", detail: "No replacement string named." },
];

// The name, then the control: two grid cells, so the names of both filters
// share a column and the controls one width, the narrower control's segments
// growing to fill it.
function Segmented<T extends string>({
  label,
  value,
  options,
  onPick,
  className = "",
}: {
  label: string;
  value: T | null;
  options: Opt<T>[];
  onPick: (v: T) => void;
  className?: string;
}) {
  return (
    <>
      <span className={`label text-ink-soft ${className}`}>{label}</span>
      <div role="group" aria-label={label} className="flex border border-ink">
        {options.map((o, i) => {
          const on = value === o.value;
          return (
            <button
              key={o.value}
              type="button"
              aria-pressed={on}
              aria-label={`${on ? "Show every string" : `Show only ${o.short}`}. ${o.detail}`}
              onClick={() => onPick(o.value)}
              className={`group relative grow flex items-center justify-center h-7 px-2.5 cursor-pointer transition-colors duration-200 ease-in-out focus-visible:outline-2 focus-visible:outline-gold ${
                i ? "border-l border-ink" : ""
              } ${on ? "bg-rule-faint" : "hover:bg-paper-deep"}`}
            >
              <Tip className="max-md:!whitespace-normal max-md:w-max max-md:max-w-56">{o.detail}</Tip>
              {/* on: a ground darker than hover's, the word in oxblood */}
              <span className={`label !text-[10px] !tracking-[0.08em] transition-colors duration-200 ease-in-out ${on ? "text-oxblood" : "text-ink"}`}>{o.short}</span>
            </button>
          );
        })}
      </div>
    </>
  );
}

function Chip({ label, onClear }: { label: string; onClear: () => void }) {
  return (
    <button
      type="button"
      onClick={onClear}
      aria-label={`Clear the ${label} filter`}
      className="group relative label !text-[10px] border border-oxblood text-oxblood px-2 h-7 cursor-pointer hover:bg-oxblood hover:text-paper transition-colors duration-200 ease-in-out flex items-center gap-2"
    >
      <Tip>Clear the {label} filter</Tip>
      <span className="normal-case tracking-normal text-xs">{label}</span>
      <span aria-hidden className="text-[11px] leading-none">
        ×
      </span>
    </button>
  );
}

// Who stands behind the applicant, linking to its group. A declared parent
// prints as its name; an inferred tie prints as the evidence, so nothing reads
// as ownership that the applicant did not state.
function Parent({ a, g }: { a: MockApp; g: MockGroup }) {
  if (!g.link) return DASH;
  const href = `${ENTITIES}?q=${encodeURIComponent(g.name)}`;
  if (!inferred(g.link))
    return (
      // from lg the column cuts a long name short; the tip then leads with it
      <Hover tip={(cut) => <Above g={g} cut={cut} />} className={FIT}>
        <Link href={href} scroll={false} className={`${LINK} ${FIT} lg:truncate`}>
          {g.name}
        </Link>
      </Hover>
    );
  const others = g.entities.filter((e) => e.slug !== a.slug);
  return (
    <Link href={href} scroll={false} className={`${LINK} serif italic text-ink-soft`}>
      {g.link === "person"
        ? "shares a director with"
        : "shares an address with"}{" "}
      {others[0].name}
      {others.length > 1 && ` + ${others.length - 1}`}
    </Link>
  );
}

// Hovering a parent names the people behind it: everyone the records of the
// entities under it list, merged by role. The parent itself files nothing, so
// its people are only ever those its subsidiaries name.
function Above({ g, cut }: { g: MockGroup; cut: boolean }) {
  const byRole = new Map<string, string[]>();
  for (const e of g.entities)
    for (const r of e.roles ?? []) {
      const have = byRole.get(r.role) ?? [];
      for (const n of r.names)
        if (
          n.toLowerCase() !== g.name.toLowerCase() &&
          !have.some((h) => h.toLowerCase() === n.toLowerCase())
        )
          have.push(n);
      byRole.set(r.role, have);
    }
  // keep the record's own role order
  const order = [
    "Directors",
    "Officers & partners",
    "Executive responsibility",
    "Material shareholders",
    "Ultimate control",
  ];
  const roles = [...byRole.entries()]
    .filter(([, names]) => names.length)
    .sort((x, y) => order.indexOf(x[0]) - order.indexOf(y[0]));
  if (!roles.length && !cut) return null;
  const n = g.entities.length;
  return (
    <Tip side="right" className="!whitespace-normal w-max max-w-[28rem]">
      {cut && <span className="block">{g.name}</span>}
      {roles.map(([role, names]) => (
        <span key={role} className="block">
          <span className="serif italic text-ink-soft">
            {role.toLowerCase()}
          </span>{" "}
          {names.join(", ")}
        </span>
      ))}
      {n > 1 && (
        <span className="block text-ink-soft">
          as named across {n} entities
        </span>
      )}
    </Tip>
  );
}

// Hovering an applicant names the people its record lists, one line per
// AGB question, after the whole name when the column cut it short. 1,613 of
// 1,614 applications name at least one person.
function Behind({ a, cut }: { a: MockApp; cut: boolean }) {
  const roles = a.entity.roles ?? [];
  if (!roles.length && !cut) return null;
  return (
    <Tip className="!whitespace-normal w-max max-w-[28rem]">
      {cut && <span className="block font-medium">{a.applicant}</span>}
      {roles.map((r) => (
        <span key={r.role} className="block">
          <span className="serif italic text-ink-soft">
            {r.role.toLowerCase()}
          </span>{" "}
          {r.names.join(", ")}
        </span>
      ))}
    </Tip>
  );
}

// Suggestions under the search box: the full names the typed fragment
// starts or sits in, strings first, then applicants, then parents. Picking
// one puts the whole name in the box and narrows the search to its column.
type Suggestion = { kind: Exclude<By, "all">; text: string };
const SUGGEST = 8;
function suggest(
  q: string,
  names: Record<Exclude<By, "all">, string[]>,
): Suggestion[] {
  const t = q.trim().toLowerCase().replace(/^\./, "");
  if (t.length < 2) return [];
  // every column, whatever the box is set to read: picking one sets the column
  const kinds: Exclude<By, "all">[] = ["string", "applicant", "parent", "person"];
  const starts: Suggestion[] = [];
  const within: Suggestion[] = [];
  for (const kind of kinds)
    for (const text of names[kind]) {
      const l = text.toLowerCase();
      if (l.startsWith(t)) starts.push({ kind, text });
      else if (l.includes(t)) within.push({ kind, text });
    }
  return [...starts, ...within].slice(0, SUGGEST);
}

// One string: its line per application. Memoised, keyed on what can change
// it (the picked applicant and which lines are dimmed), so a keystroke only
// re-renders the rows it touches. Off screen, the browser skips its layout.
const Row = memo(function Row({
  r,
  vi,
  dims,
  applicant,
  groupOf,
  onPick,
}: {
  r: { tld: string; apps: MockApp[] };
  vi: number;
  dims: string; // one char per line: 1 dimmed, 0 not
  applicant: string | null;
  groupOf: Map<string, MockGroup>;
  onPick: (name: string) => void;
}) {
  return (
    <tr
      id={`s-${r.tld}`}
      className="border-t border-rule-faint align-top row-press scroll-mt-4 target:bg-paper-deep [content-visibility:auto] [contain-intrinsic-size:auto_2.5rem]"
      style={pressDelay(Math.min(vi * 22, 500))}
    >
      <td className="py-2 pr-4 font-medium">
        <Shown a={r.apps[0]} cell />
      </td>
      <td className="py-2 pr-4 tabular-nums">{r.apps.length}</td>
      {/* one line per application: its replacement, who applied, who is behind them */}
      <td className="py-2">
        {r.apps.map((a, li) => {
          const g = groupOf.get(a.group)!;
          const dim = dims[li] === "1";
          return (
            <div
              key={a.id}
              className={`${LINE} ${li ? "mt-1.5" : ""} ${dim ? "opacity-40" : ""} transition-opacity duration-200 ease-in-out`}
            >
              <span>
                <Replacement a={a} />
              </span>
              <span>
                <Hover tip={(cut) => <Behind a={a} cut={cut} />} className={FIT}>
                  <button
                    type="button"
                    aria-current={applicant === a.applicant || undefined}
                    aria-label={a.applicant}
                    onClick={() => onPick(a.applicant)}
                    className={`text-left ${FIT} sm:truncate ${LINK} ${applicant === a.applicant ? "text-gold decoration-gold" : ""}`}
                  >
                    {a.applicant}
                  </button>
                </Hover>
                {/* the designation is the applicant's, so it sits by the name */}
                {kindOf(a) !== "open" && (
                  <span className={`${TAG} text-gold ml-2`}>
                    {KIND_TAG[kindOf(a)]}
                  </span>
                )}
                <MockTag on={a.fixture} />
                {/* below lg the parent has no column: it sits under the name */}
                {g.link && (
                  <span className="block text-xs mt-0.5 lg:hidden">
                    <Parent a={a} g={g} />
                  </span>
                )}
              </span>
              <span className="hidden lg:block">
                <Parent a={a} g={g} />
              </span>
            </div>
          );
        })}
      </td>
    </tr>
  );
});

// A count tile that is also the filter it counts. Declared at module level on
// purpose: declared inside Reveal it was a new component type on every render,
// so React remounted the tiles and their settle animation replayed on every
// keystroke and click.
const tileClass = (on: boolean, rules: string) =>
  `p-3 sm:p-4 text-left w-full cursor-pointer transition-colors duration-200 ease-in-out focus-visible:outline-2 focus-visible:outline-gold ${rules} ${
    on ? "bg-paper-deep" : "hover:bg-paper-deep"
  }`;
function Tile({
  v,
  label,
  on,
  accent,
  i,
  rules = "",
  onClick,
}: {
  v: number;
  label: string;
  on: boolean;
  accent: boolean;
  i: number;
  rules?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={tileClass(on, rules)}
    >
      <div
        className={`text-2xl sm:text-3xl font-light press-word ${accent ? "text-oxblood" : ""}`}
        style={pressDelay(150 + i * 120)}
      >
        {v}
      </div>
      <div
        className={`label mt-2 !tracking-[0.08em] !text-[10px] sm:!tracking-[0.18em] sm:!text-[0.6875rem] border-b border-dotted border-rule inline-block ${
          accent ? "!text-oxblood" : "text-ink-soft"
        }`}
      >
        {label}
      </div>
    </button>
  );
}

export default function Reveal({ data: d }: { data: MockData }) {
  const [scope, setScope] = useState<Scope>("all");
  const [q, setQ] = useState("");
  const [applicant, setApplicant] = useState<string | null>(null);
  const [kind, setKind] = useState<Kind | "all">("all");
  const [by, setBy] = useState<By>("all");
  const [sort, setSort] = useState<Sort<SortKey>>({ key: "string", dir: 1 });
  // arriving from another page with ?by=applicant&q=Name, the box is filled
  // and the column set once mounted, so the link lands on the rows it means.
  // Read after mount, not with useSearchParams: that would turn the whole
  // table into a client-only render and leave the prerendered page empty.
  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    const q0 = sp.get("q");
    const by0 = sp.get("by");
    if (!q0 && !by0) return;
    queueMicrotask(() => {
      if (q0) setQ(q0);
      if (by0 && BY.some((b) => b.value === by0)) setBy(by0 as By);
    });
    // the link lands on the box and its rows, not the page head; a frame
    // later, after the router's own scroll to the top of the new page
    requestAnimationFrame(() => document.getElementById("strings-search")?.scrollIntoView({ block: "start" }));
  }, []);
  const [rmark, setRmark] = useState<RMark | null>(null);
  const [cursor, setCursor] = useState(-1); // highlighted suggestion
  const [suggesting, setSuggesting] = useState(false);

  const groupOf = useMemo(
    () => new Map(d.groups.map((g) => [g.slug, g])),
    [d.groups],
  );
  // the box updates on every key; the table filters on the deferred value,
  // so typing never waits for 986 rows to re-render
  const dq = useDeferredValue(q);
  const dby = useDeferredValue(by); // a keystroke resets it; the table follows when idle
  const names = useMemo(
    () => ({
      string: [...new Set(d.apps.map((a) => a.uLabel ?? a.tld))].sort(),
      applicant: [...new Set(d.apps.map((a) => a.applicant))].sort(),
      parent: d.groups
        .filter((g) => g.link === "parent")
        .map((g) => g.name)
        .sort(),
      person: [...new Set((d.people ?? []).map((p) => p.name))].sort(),
    }),
    [d.apps, d.groups, d.people],
  );
  // who each application names, for the person column
  const peopleOn = useMemo(() => {
    const m = new Map<string, string[]>();
    for (const p of d.people ?? []) for (const a of p.apps) m.set(a.id, [...(m.get(a.id) ?? []), p.name.toLowerCase()]);
    return m;
  }, [d.people]);
  const suggestions = suggesting ? suggest(q, names) : [];
  const pick = (sg: Suggestion) => {
    setQ(sg.kind === "string" ? `.${sg.text}` : sg.text);
    setBy(sg.kind);
    setSuggesting(false);
    setCursor(-1);
  };
  const strings = useMemo(() => {
    const m = new Map<string, MockApp[]>();
    for (const a of d.apps) m.set(a.tld, [...(m.get(a.tld) ?? []), a]);
    // within a string: applications with a replacement first, by replacement
    return [...m.entries()].map(([tld, apps]) => ({
      tld,
      apps: [...apps].sort(
        (x, y) =>
          Number(!x.replacement) - Number(!y.replacement) ||
          (x.replacement ?? "").localeCompare(y.replacement ?? "") ||
          x.applicant.localeCompare(y.applicant),
      ),
    }));
  }, [d.apps]);

  // every condition on the same application: a row stays when one of its
  // lines meets them all, not when each is met by some line or other
  const keep = useMemo(() => {
    const hit = (a: MockApp) =>
      scope === "all" ||
      (scope === "contention" && a.setSize > 1) ||
      (scope === "uncontested" && a.setSize === 1);
    return (a: MockApp) =>
      hit(a) &&
      matches(a, dq, groupOf.get(a.group), dby, peopleOn.get(a.id)) &&
      (!rmark || rmarkOf(a) === rmark) &&
      (!applicant || a.applicant === applicant) &&
      (kind === "all" || kindOf(a) === kind);
  }, [scope, dq, dby, rmark, applicant, kind, groupOf, peopleOn]);
  const filtering =
    scope !== "all" || dq.trim() || rmark || applicant || kind !== "all";
  const rows = useMemo(
    () => strings.filter((r) => r.apps.some(keep)),
    [strings, keep],
  );
  // rows arrive A to Z; the sort is stable, so equal counts keep that order
  const sorted = useMemo(() => {
    if (sort.key === "string") return sort.dir === 1 ? rows : [...rows].reverse();
    return [...rows].sort((a, b) => (a.apps.length - b.apps.length) * sort.dir);
  }, [rows, sort]);
  const stale = dq !== q || dby !== by; // the table is still catching up with the box
  // stable, so the memoised rows skip a render when only the box changed
  const pickApplicant = useCallback(
    (name: string) => setApplicant((cur) => (cur === name ? null : name)),
    [],
  );

  // the file name says which slice of the table it holds
  const exportCsv = () => {
    const parent = (a: MockApp) => {
      const g = groupOf.get(a.group);
      return g?.link && !inferred(g.link) ? g.name : "";
    };
    const list = (apps: MockApp[], f: (a: MockApp) => string) => apps.map(f).join("; ");
    const slice = [
      scope !== "all" && SCOPE_LABEL[scope],
      rmark && `replacement-${rmark}`,
      kind !== "all" && kind,
      applicant,
      dq.trim(),
    ]
      .filter((x): x is string => !!x)
      .map((x) => slugify(x))
      .join("-");
    saveCsv(
      `stringscout-${slice || "all"}`,
      csvText(
        CSV_COLS,
        sorted.map(({ tld, apps }) => [
          apps[0].uLabel ?? tld,
          tld,
          apps[0].gloss ?? "",
          String(apps.length),
          apps[0].setSize > 1 ? "yes" : "no",
          list(apps, (a) => a.applicant),
          list(apps, parent),
          list(apps, (a) => a.replacementU ?? a.replacement ?? ""),
          list(apps, rmarkOf),
          list(apps, kindOf),
        ]),
      ),
    );
  };

  // row one: what state the strings are in; row two: what kind they are
  const tiles: { v: number; s: Scope }[] = [
    { v: d.stats.strings, s: "all" },
    { v: d.stats.sets, s: "contention" },
    { v: d.stats.strings - d.stats.sets, s: "uncontested" },
  ];
  const kinds = KINDS.map((k) => ({
    k: k.value,
    label: k.label,
    v: strings.filter((r) => kindOfRow(r.apps) === k.value).length,
  }));
  return (
    <section className="mb-14">
      <div className="border border-ink mb-6">
        <div className="grid grid-cols-3 divide-x divide-rule">
          {tiles.map((t, i) => {
            const on = scope === t.s;
            return (
              <Tile
                key={t.s}
                v={t.v}
                label={SCOPE_LABEL[t.s]}
                on={on}
                accent={on && t.s !== "all"}
                i={i}
                onClick={() => setScope(on ? "all" : t.s)}
              />
            );
          })}
        </div>
      </div>
      <KindRule
        shares={kinds.map((k) => ({ key: k.k, label: k.label, count: k.v }))}
        active={kind}
        onPick={(k) => setKind(kind === k ? "all" : (k as Kind))}
      />

      <div className="double-rule mb-5" />
      <div id="strings-search" className="mb-5 scroll-mt-6">
        {/* the column it reads is set by the suggestion picked or by the
            link that brought the reader here, and shows in the chip; the
            export sits at the row's right end */}
        <div className="flex gap-3">
          <div className="relative flex-1 min-w-0 sm:flex-none sm:w-80">
            <input
              type="search"
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setBy("all"); // new text reads every column again
                setSuggesting(true);
                setCursor(-1);
              }}
              onFocus={() => setSuggesting(true)}
              onBlur={() => setTimeout(() => setSuggesting(false), 150)}
              onKeyDown={(e) => {
                if (!suggestions.length) return;
                if (e.key === "ArrowDown") {
                  e.preventDefault();
                  setCursor((c) => (c + 1) % suggestions.length);
                } else if (e.key === "ArrowUp") {
                  e.preventDefault();
                  setCursor((c) => (c <= 0 ? suggestions.length - 1 : c - 1));
                } else if (e.key === "Enter" && cursor >= 0) {
                  e.preventDefault();
                  pick(suggestions[cursor]);
                } else if (e.key === "Escape") {
                  setSuggesting(false);
                }
              }}
              placeholder="Search…"
              aria-label="Search strings"
              role="combobox"
              aria-autocomplete="list"
              aria-expanded={suggestions.length > 0}
              aria-controls="search-suggestions"
              className={`${INPUT} w-full`}
            />
            {suggestions.length > 0 && (
              <ul
                id="search-suggestions"
                role="listbox"
                className="absolute left-0 right-0 top-full mt-1 z-30 border border-ink bg-paper text-sm"
              >
                {suggestions.map((sg, i) => (
                  <li
                    key={`${sg.kind}|${sg.text}`}
                    role="option"
                    aria-selected={i === cursor}
                  >
                    <button
                      type="button"
                      tabIndex={-1}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => pick(sg)}
                      onMouseEnter={() => setCursor(i)}
                      className={`group relative flex items-baseline justify-between gap-4 w-full text-left px-3 py-2 cursor-pointer border-t border-rule-faint first:border-t-0 transition-colors duration-200 ease-in-out ${
                        i === cursor ? "bg-paper-deep" : ""
                      }`}
                    >
                      {sg.text.length > 36 && <Tip>{sg.kind === "string" ? `.${sg.text}` : sg.text}</Tip>}
                      <span className="truncate">
                        {sg.kind === "string" ? `.${sg.text}` : sg.text}
                      </span>
                      <span className="label !text-[9px] text-ink-soft shrink-0">
                        {sg.kind}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <button
            type="button"
            onClick={exportCsv}
            aria-label="Download the strings below as CSV, punycode included"
            className="group relative ml-auto shrink-0 label border border-ink text-ink px-3 h-10 cursor-pointer hover:bg-paper-deep hover:border-gold transition-colors duration-200 ease-in-out flex items-center gap-2 focus-visible:outline-2 focus-visible:outline-gold"
          >
            <Tip side="right">Download the strings below as CSV, punycode included</Tip>
            CSV
            <span aria-hidden className="text-[9px] text-rule group-hover:text-gold transition-colors duration-200 ease-in-out">
              ↓
            </span>
          </button>
        </div>
        {/* a line each until lg, where both fit on one */}
        <div className="mt-3 grid min-[360px]:grid-cols-[max-content_max-content] justify-start items-center gap-x-3 gap-y-2 lg:flex">
          <Segmented
            label="Strings"
            value={scope === "all" ? null : scope}
            options={SCOPE_OPTS}
            onPick={(m) => setScope(scope === m ? "all" : m)}
          />
          <Segmented
            label="Replacement"
            value={rmark}
            options={RMARK_OPTS}
            onPick={(m) => setRmark(rmark === m ? null : m)}
            className="lg:ml-5"
          />
        </div>
        <div className="flex flex-wrap items-center gap-3 mt-3 min-h-7">
          <span className="label text-ink-soft tabular-nums shrink-0 sm:w-80">
            {rows.length} {rows.length === 1 ? "string" : "strings"}
          </span>
          {/* the tiles and the legend show their own state; a chip only for
              what is picked in the rows or typed in the box */}
          {applicant && (
            <Chip
              label={applicant}
              onClear={() => setApplicant(null)}
            />
          )}
          {q.trim() && (
            <Chip
              label={
                by === "all"
                  ? q.trim()
                  : `${BY.find((b) => b.value === by)!.label}: ${q.trim()}`
              }
              onClear={() => setQ("")}
            />
          )}
        </div>
      </div>

      <table className="w-full table-fixed text-sm border-collapse">
        <colgroup>
          <col className="w-24 sm:w-32" />
          <col className="w-14 sm:w-[4.25rem]" />
          <col />
        </colgroup>
        <thead>
          <tr>
            {SORT_COLS.map((col) => (
              <SortHead key={col.key} col={col} sort={sort} onSort={setSort} thClassName={`${TH} align-bottom`} className={SORT_TH} />
            ))}
            <th className="pb-2 font-medium align-bottom">
              <span className={LINE}>
                <span className={`${TH} !pb-0 !pr-0`}>Replacement</span>
                <span className={`${TH} !pb-0 !pr-0`}>Applicant</span>
                <span className={`${TH} !pb-0 !pr-0 hidden lg:block`}>
                  Parent
                </span>
              </span>
            </th>
          </tr>
        </thead>
        <tbody
          key={`${scope}|${dby}|${rmark}|${applicant}|${kind}|${sort.key}|${sort.dir}`}
          className={`transition-opacity duration-200 ease-in-out ${stale ? "opacity-60" : ""}`}
        >
          {sorted.map((r, vi) => (
            <Row
              key={r.tld}
              r={r}
              vi={vi}
              dims={
                filtering
                  ? r.apps.map((a) => (keep(a) ? "0" : "1")).join("")
                  : ""
              }
              applicant={applicant}
              groupOf={groupOf}
              onPick={pickApplicant}
            />
          ))}
          {rows.length === 0 && (
            <tr className="border-t border-rule-faint">
              <td colSpan={3} className="py-6 text-ink-soft serif italic">
                No strings match.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </section>
  );
}
