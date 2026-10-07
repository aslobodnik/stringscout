"use client";

// PROTOTYPE, throwaway. The post-reveal strings view on mock data: the
// homepage's table, one line per application, with a Replacement column
// ahead of the applicant and its Parent after.
//
//   replacement printed plain  = usable
//   replacement struck through = knocked out; superscript = by how many, named on hover
//   a dash                     = none named, or no parent

import Link from "next/link";
import { Fragment, memo, useDeferredValue, useEffect, useMemo, useState } from "react";
import Tld from "@/components/Tld";
import KindRule from "./KindRule";
import Choice from "./Choice";
import Tip from "@/components/Tip";
import { pressDelay } from "@/lib/press";
import {
  DASH,
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

const INPUT =
  "border border-ink bg-transparent px-3 h-10 text-base sm:text-sm w-full placeholder:text-ink-soft focus:border-gold focus:outline-none transition-colors duration-200 ease-in-out";
// replacement, applicant, parent: the head and every line share it
// minmax(0,1fr): a long applicant name truncates instead of widening the column
const LINE =
  "grid grid-cols-[6rem_minmax(0,1fr)] sm:grid-cols-[11rem_minmax(0,1fr)_16rem] gap-x-4";

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
const KINDS: { value: Kind | "all"; label: string }[] = [
  { value: "all", label: "All types" },
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

// what the search box reads: everything, or one column
type By = "all" | "string" | "applicant" | "parent";
const BY: { value: By; label: string }[] = [
  { value: "all", label: "Anything" },
  { value: "string", label: "String" },
  { value: "applicant", label: "Applicant" },
  { value: "parent", label: "Parent" },
];
const matches = (
  a: MockApp,
  q: string,
  group: MockGroup | undefined,
  by: By,
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

// The replacement legend, the shipped table's marker legend copied: the
// definition and the way to isolate it in one control. A mark per state.
type RMark = "live" | "blocked" | "none";
type CMark = "contention" | "uncontested";
type LMark = RMark | CMark;
const RMARKS: { mark: LMark; glyph: string; label: string; detail: string }[] =
  [
    {
      mark: "contention",
      glyph: "n",
      label: "contested",
      detail: "Two or more applications for the string: a contention set.",
    },
    {
      mark: "uncontested",
      glyph: "1",
      label: "uncontested",
      detail: "One application for the string.",
    },
    {
      mark: "live",
      glyph: "r",
      label: "replacement live",
      detail:
        "Replacement named, and nobody else applied for it or named it (AGB §5.1).",
    },
    {
      mark: "blocked",
      glyph: "r",
      label: "replacement blocked",
      detail:
        "Replacement named, but another applicant applied for it or named it too (AGB §5.1).",
    },
    {
      mark: "none",
      glyph: "–",
      label: "no replacement",
      detail: "No replacement string named.",
    },
  ];
const RBLOCK: Record<LMark, string> = {
  contention: "border-oxblood text-oxblood",
  uncontested: "border-ink text-ink",
  live: "bg-ink text-paper border-ink",
  blocked: "border-oxblood text-oxblood line-through",
  none: "border-rule-faint text-ink-soft",
};
const isScope = (m: LMark): m is CMark =>
  m === "contention" || m === "uncontested";
const rmarkOf = (a: MockApp): RMark =>
  !a.replacement ? "none" : a.blockers.length ? "blocked" : "live";

function RBlock({ mark, inverted }: { mark: LMark; inverted?: boolean }) {
  const m = RMARKS.find((x) => x.mark === mark)!;
  return (
    <span
      aria-hidden
      className={`inline-flex items-center justify-center w-[13px] h-[13px] text-[9px] font-medium uppercase leading-none border ${
        inverted ? "border-paper/45 text-paper" : RBLOCK[mark]
      }`}
    >
      {m.glyph}
    </span>
  );
}

// Contention on the left, replacement state on the right, a rule between:
// one of each may be on, since they are different questions.
function RLegend({
  scope,
  rmark,
  onScope,
  onMark,
}: {
  scope: Scope;
  rmark: RMark | null;
  onScope: (m: CMark) => void;
  onMark: (m: RMark) => void;
}) {
  return (
    <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2">
      {RMARKS.map(({ mark, label, detail }, i) => {
        const on = isScope(mark) ? scope === mark : rmark === mark;
        return (
          <Fragment key={mark}>
            {i === 2 && (
              <span aria-hidden className="hidden sm:block w-px h-4 bg-rule" />
            )}
            <button
              type="button"
              aria-pressed={on}
              aria-label={`${on ? "Show every string" : `Show only ${label}`}. ${detail}`}
              onClick={() => (isScope(mark) ? onScope(mark) : onMark(mark))}
              className={`group relative flex items-center gap-1.5 cursor-pointer px-1.5 -mx-1.5 py-1 transition-colors duration-200 ease-in-out focus-visible:outline-2 focus-visible:outline-gold ${
                on ? "bg-ink text-paper" : "hover:bg-paper-deep"
              }`}
            >
              <Tip className="max-md:!whitespace-normal max-md:w-max max-md:max-w-56">
                {detail}
              </Tip>
              <RBlock mark={mark} inverted={on} />
              <span
                className={`label !text-[10px] !tracking-[0.08em] ${on ? "text-paper" : "text-ink-soft"}`}
              >
                {label}
              </span>
            </button>
          </Fragment>
        );
      })}
    </div>
  );
}

function Chip({
  label,
  verbatim,
  onClear,
}: {
  label: string;
  verbatim?: boolean;
  onClear: () => void;
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

// Who stands behind the applicant, linking to its group. A declared parent
// prints as its name; an inferred tie prints as the evidence, so nothing reads
// as ownership that the applicant did not state.
function Parent({ a, g }: { a: MockApp; g: MockGroup }) {
  if (!g.link) return DASH;
  const href = `${ENTITIES}#g-${g.slug}`;
  if (!inferred(g.link))
    return (
      <Hover tip={() => <Above a={a} g={g} />}>
        <Link href={href} className={LINK}>
          {g.name}
        </Link>
      </Hover>
    );
  const others = g.entities.filter((e) => e.slug !== a.slug);
  return (
    <Link href={href} className={`${LINK} serif italic text-ink-soft`}>
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
function Above({ g }: { a: MockApp; g: MockGroup }) {
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
  if (!roles.length) return null;
  const n = g.entities.length;
  return (
    <Tip side="right" className="!whitespace-normal w-max max-w-[28rem]">
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
// AGB question. 1,613 of 1,614 applications name at least one person.
const LONG = 34; // characters of applicant name the column holds on one line
function Behind({ a }: { a: MockApp }) {
  const roles = a.entity.roles ?? [];
  const long = a.applicant.length > LONG;
  if (!roles.length && !long) return null;
  return (
    <Tip className="!whitespace-normal w-max max-w-[28rem]">
      {long && <span className="block font-medium">{a.applicant}</span>}
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
  const kinds: Exclude<By, "all">[] = ["string", "applicant", "parent"];
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
        <Shown a={r.apps[0]} />
      </td>
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
                <Hover
                  tip={() => <Behind a={a} />}
                  className="inline-block max-w-full align-bottom"
                >
                  <button
                    type="button"
                    aria-current={applicant === a.applicant || undefined}
                    aria-label={a.applicant}
                    onClick={() => onPick(a.applicant)}
                    className={`text-left inline-block max-w-full sm:truncate align-bottom ${LINK} ${applicant === a.applicant ? "text-gold decoration-gold" : ""}`}
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
                {/* below sm the parent has no column: it sits under the name */}
                {g.link && (
                  <span className="block text-xs mt-0.5 sm:hidden">
                    <Parent a={a} g={g} />
                  </span>
                )}
              </span>
              <span className="hidden sm:block">
                <Parent a={a} g={g} />
              </span>
            </div>
          );
        })}
      </td>
    </tr>
  );
});

export default function Reveal({ data: d }: { data: MockData }) {
  const [scope, setScope] = useState<Scope>("all");
  const [q, setQ] = useState("");
  const [applicant, setApplicant] = useState<string | null>(null);
  const [kind, setKind] = useState<Kind | "all">("all");
  const [by, setBy] = useState<By>("all");
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
  const names = useMemo(
    () => ({
      string: [...new Set(d.apps.map((a) => a.uLabel ?? a.tld))].sort(),
      applicant: [...new Set(d.apps.map((a) => a.applicant))].sort(),
      parent: d.groups
        .filter((g) => g.link === "parent")
        .map((g) => g.name)
        .sort(),
    }),
    [d.apps, d.groups],
  );
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
    const order = (a: MockApp) => a.replacement ?? "~";
    return [...m.entries()].map(([tld, apps]) => ({
      tld,
      apps: [...apps].sort(
        (x, y) =>
          order(x).localeCompare(order(y)) ||
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
      matches(a, dq, groupOf.get(a.group), by) &&
      (!rmark || rmarkOf(a) === rmark) &&
      (!applicant || a.applicant === applicant) &&
      (kind === "all" || kindOf(a) === kind);
  }, [scope, dq, by, rmark, applicant, kind, groupOf]);
  const filtering =
    scope !== "all" || dq.trim() || rmark || applicant || kind !== "all";
  const rows = useMemo(
    () => strings.filter((r) => r.apps.some(keep)),
    [strings, keep],
  );
  const stale = dq !== q; // the table is still catching up with the box
  const pickApplicant = (name: string) =>
    setApplicant((cur) => (cur === name ? null : name));

  // row one: what state the strings are in; row two: what kind they are
  const tiles: { v: number; s: Scope }[] = [
    { v: d.stats.strings, s: "all" },
    { v: d.stats.sets, s: "contention" },
    { v: d.stats.strings - d.stats.sets, s: "uncontested" },
  ];
  const kinds = KINDS.filter((k) => k.value !== "all").map((k) => ({
    k: k.value as Kind,
    label: k.label,
    v: strings.filter((r) => kindOfRow(r.apps) === k.value).length,
  }));
  const tileClass = (on: boolean, rules: string) =>
    `p-3 sm:p-4 text-left w-full cursor-pointer transition-colors duration-200 ease-in-out focus-visible:outline-2 focus-visible:outline-gold ${rules} ${
      on ? "bg-paper-deep" : "hover:bg-paper-deep"
    }`;
  const Tile = ({
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
  }) => (
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
      <div className="mb-5">
        {/* the box and, beside it, which column it reads */}
        <div className="flex flex-wrap gap-3">
          <div className="relative w-full sm:w-80">
            <input
              type="search"
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
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
                      className={`flex items-baseline justify-between gap-4 w-full text-left px-3 py-2 cursor-pointer border-t border-rule-faint first:border-t-0 transition-colors duration-200 ease-in-out ${
                        i === cursor ? "bg-paper-deep" : ""
                      }`}
                    >
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
          <div className="w-36 shrink-0">
            <Choice
              label="Search by"
              value={by}
              options={BY}
              onChange={(v) => setBy(v as By)}
            />
          </div>
        </div>
        <RLegend
          scope={scope}
          rmark={rmark}
          onScope={(m) => setScope(scope === m ? "all" : m)}
          onMark={(m) => setRmark(rmark === m ? null : m)}
        />
        <div className="flex flex-wrap items-center gap-3 mt-3 min-h-7">
          <span className="label text-ink-soft tabular-nums shrink-0 sm:w-80">
            {rows.length} {rows.length === 1 ? "string" : "strings"}
          </span>
          {scope !== "all" && (
            <Chip label={SCOPE_LABEL[scope]} onClear={() => setScope("all")} />
          )}
          {kind !== "all" && (
            <Chip
              label={KINDS.find((k) => k.value === kind)!.label}
              onClear={() => setKind("all")}
            />
          )}
          {rmark && (
            <Chip
              label={RMARKS.find((m) => m.mark === rmark)!.label}
              onClear={() => setRmark(null)}
            />
          )}
          {applicant && (
            <Chip
              label={applicant}
              verbatim
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
              verbatim
              onClear={() => setQ("")}
            />
          )}
        </div>
      </div>

      <table className="w-full table-fixed text-sm border-collapse">
        <colgroup>
          <col className="w-24 sm:w-44" />
          <col />
        </colgroup>
        <thead>
          <tr>
            <th className={TH}>String</th>
            <th className="pb-2 font-medium">
              <span className={LINE}>
                <span className={`${TH} !pb-0 !pr-0`}>Replacement</span>
                <span className={`${TH} !pb-0 !pr-0`}>Applicant</span>
                <span className={`${TH} !pb-0 !pr-0 hidden sm:block`}>
                  Parent
                </span>
              </span>
            </th>
          </tr>
        </thead>
        <tbody
          key={`${scope}|${by}|${rmark}|${applicant}|${kind}`}
          className={`transition-opacity duration-200 ease-in-out ${stale ? "opacity-60" : ""}`}
        >
          {rows.map((r, vi) => (
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
              <td colSpan={2} className="py-6 text-ink-soft serif italic">
                No strings match.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </section>
  );
}
