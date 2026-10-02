"use client";

// PROTOTYPE, throwaway. The post-reveal strings view on mock data: the
// homepage's table, one line per application, with a Replacement column
// ahead of the applicant and its Parent after.
//
//   replacement printed plain  = usable
//   replacement struck through = knocked out; superscript = by how many, named on hover
//   a dash                     = none named, or no parent

import Link from "next/link";
import { useMemo, useState } from "react";
import Tld from "@/components/Tld";
import Tip from "@/components/Tip";
import { pressDelay } from "@/lib/press";
import { DASH, ENTITIES, LINK, MockTag, Replacement, TAG, TH, inferred } from "./bits";
import type { MockApp, MockData, MockGroup } from "./mock";

const INPUT =
  "border border-ink bg-transparent px-3 h-10 text-base sm:text-sm w-full placeholder:text-ink-soft focus:border-gold focus:outline-none transition-colors duration-200 ease-in-out";
// replacement, applicant, parent: the head and every line share it
const LINE = "grid grid-cols-[6rem_1fr] sm:grid-cols-[11rem_1fr_16rem] gap-x-4";

const matches = (a: MockApp, q: string) => {
  const t = q.trim().toLowerCase().replace(/^\./, "");
  return !t || a.tld.includes(t) || a.applicant.toLowerCase().includes(t) || (a.replacement ?? "").includes(t);
};

type Scope = "all" | "contention" | "open" | "blocked";
const SCOPE_LABEL: Record<Scope, string> = {
  all: "Strings",
  contention: "Contention sets",
  open: "Can switch",
  blocked: "Blocked",
};

function Chip({ label, verbatim, onClear }: { label: string; verbatim?: boolean; onClear: () => void }) {
  return (
    <button
      type="button"
      onClick={onClear}
      aria-label={`Clear the ${label.toLowerCase()} filter`}
      className="group relative label !text-[10px] border border-oxblood text-oxblood px-2 h-7 cursor-pointer hover:bg-oxblood hover:text-paper transition-colors duration-200 ease-in-out flex items-center gap-2"
    >
      <Tip>Clear the {label.toLowerCase()} filter</Tip>
      {verbatim ? <span className="normal-case tracking-normal text-xs">{label}</span> : label}
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
      <Link href={href} className={LINK}>
        {g.name}
      </Link>
    );
  const others = g.entities.filter((e) => e.slug !== a.slug);
  return (
    <Link href={href} className={`${LINK} serif italic text-ink-soft`}>
      {g.link === "person" ? "shares a director with" : "shares an address with"} {others[0].name}
      {others.length > 1 && ` + ${others.length - 1}`}
    </Link>
  );
}

export default function Reveal({ data: d }: { data: MockData }) {
  const [scope, setScope] = useState<Scope>("all");
  const [q, setQ] = useState("");
  const [applicant, setApplicant] = useState<string | null>(null);

  const groupOf = useMemo(() => new Map(d.groups.map((g) => [g.slug, g])), [d.groups]);
  const strings = useMemo(() => {
    const m = new Map<string, MockApp[]>();
    for (const a of d.apps) m.set(a.tld, [...(m.get(a.tld) ?? []), a]);
    // within a string: applications with a replacement first, by replacement
    const order = (a: MockApp) => a.replacement ?? "~";
    return [...m.entries()].map(([tld, apps]) => ({
      tld,
      apps: [...apps].sort((x, y) => order(x).localeCompare(order(y)) || x.applicant.localeCompare(y.applicant)),
    }));
  }, [d.apps]);

  const hit = (a: MockApp) =>
    scope === "all" ||
    (scope === "contention" && a.setSize > 1) ||
    (scope === "open" && a.setSize > 1 && a.status === "open") ||
    (scope === "blocked" && a.blockers.length > 0);
  const rows = strings.filter(
    (r) =>
      r.apps.some(hit) &&
      r.apps.some((a) => matches(a, q)) &&
      (!applicant || r.apps.some((a) => a.applicant === applicant))
  );

  const tiles: { v: number; s: Scope }[] = [
    { v: d.stats.strings, s: "all" },
    { v: d.stats.sets, s: "contention" },
    { v: d.stats.canSwitch, s: "open" },
    { v: d.stats.blocked, s: "blocked" },
  ];
  return (
    <section className="mb-14">
      <div className="grid grid-cols-2 sm:grid-cols-4 border border-ink mb-10">
        {tiles.map((t, i) => {
          const on = scope === t.s;
          const accent = on && t.s !== "all";
          return (
            <button
              key={t.s}
              type="button"
              aria-pressed={on}
              onClick={() => setScope(on ? "all" : t.s)}
              className={`p-3 sm:p-4 text-left w-full cursor-pointer transition-colors duration-200 ease-in-out focus-visible:outline-2 focus-visible:outline-gold ${
                i % 2 ? "border-l border-rule" : ""
              } ${i > 1 ? "border-t border-rule sm:border-t-0" : ""} ${i === 2 ? "sm:border-l sm:border-rule" : ""} ${
                on ? "bg-paper-deep" : "hover:bg-paper-deep"
              }`}
            >
              <div className={`text-2xl sm:text-3xl font-light press-word ${accent ? "text-oxblood" : ""}`} style={pressDelay(150 + i * 120)}>
                {t.v}
              </div>
              <div
                className={`label mt-2 !tracking-[0.08em] !text-[10px] sm:!tracking-[0.18em] sm:!text-[0.6875rem] border-b border-dotted border-rule inline-block ${
                  accent ? "!text-oxblood" : "text-ink-soft"
                }`}
              >
                {SCOPE_LABEL[t.s]}
              </div>
            </button>
          );
        })}
      </div>

      <div className="double-rule mb-5" />
      <div className="mb-5">
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search…"
          aria-label="Search strings"
          className={`${INPUT} sm:w-44`}
        />
        <div className="flex flex-wrap items-center gap-3 mt-3 min-h-7">
          <span className="label text-ink-soft tabular-nums shrink-0 sm:w-44">
            {rows.length} {rows.length === 1 ? "string" : "strings"}
          </span>
          {scope !== "all" && <Chip label={SCOPE_LABEL[scope]} onClear={() => setScope("all")} />}
          {applicant && <Chip label={applicant} verbatim onClear={() => setApplicant(null)} />}
          {q.trim() && <Chip label={q.trim()} verbatim onClear={() => setQ("")} />}
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
                <span className={`${TH} !pb-0 !pr-0 hidden sm:block`}>Parent</span>
              </span>
            </th>
          </tr>
        </thead>
        <tbody key={`${scope}|${q}|${applicant}`}>
          {rows.map((r, vi) => {
            const kind = r.apps.find((a) => a.type !== "standard");
            return (
              <tr
                key={r.tld}
                id={`s-${r.tld}`}
                className="border-t border-rule-faint align-top row-press scroll-mt-4 target:bg-paper-deep"
                style={pressDelay(Math.min(vi * 22, 500))}
              >
                <td className="py-2 pr-4 font-medium">
                  <Tld>{r.tld}</Tld>
                  {kind && <span className={`${TAG} text-gold ml-2`}>{kind.type === "brand" ? ".brand" : kind.type}</span>}
                </td>
                {/* one line per application: its replacement, who applied, who is behind them */}
                <td className="py-2">
                  {r.apps.map((a, li) => {
                    const g = groupOf.get(a.group)!;
                    return (
                      <div key={a.id} className={`${LINE} ${li ? "mt-1.5" : ""}`}>
                        <span>
                          <Replacement a={a} />
                        </span>
                        <span>
                          <button
                            type="button"
                            aria-current={applicant === a.applicant || undefined}
                            onClick={() => setApplicant(applicant === a.applicant ? null : a.applicant)}
                            className={`text-left ${LINK} ${applicant === a.applicant ? "text-gold decoration-gold" : ""}`}
                          >
                            {a.applicant}
                          </button>
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
          })}
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
