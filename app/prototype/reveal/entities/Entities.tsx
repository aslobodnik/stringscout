"use client";

// PROTOTYPE, throwaway. The page that starts from who applied, as one table,
// most applications first, with three levels of disclosure:
//   group     one row each; the name opens its entities
//   entity    one row each under its group; the name opens its people
//   people    the names the record gives, by the AGB question that asked
//
// A group is entities tied by the applicant's own statement: the same
// declared parent (AGB Q26, Q36). Nothing is inferred.
//
// Searching reads every level. A row the query reached through something the
// row does not show (an entity name, a person, a string behind the fold) says
// so on a line under the row, and a matched string moves to the front of its
// list. While a query is in the box the two sections become one list.

import Link from "next/link";
import { Fragment, useDeferredValue, useMemo, useState } from "react";
import Tip from "@/components/Tip";
import SectionHead from "@/components/SectionHead";
import { LINK, PEOPLE, PERSON_ROLES, StringFold, TAG, TH, ToStrings } from "../bits";
import SearchBox from "../SearchBox";
import { groupHit, stringHit, stringNames, term, type GroupHit } from "../search";
import type { MockData, MockEntity, MockGroup, Role } from "../mock";

// A caret that turns when its row is open. The name is the label, not a
// link, and keeps to one line: cut with an ellipsis, whole on hover.
function Toggle({ open, onClick, name, strong }: { open: boolean; onClick: () => void; name: string; strong?: boolean }) {
  return (
    <span className="group relative block max-w-full">
      <Tip>{name}</Tip>
      <button
        type="button"
        aria-expanded={open}
        aria-label={name}
        onClick={onClick}
        className={`cursor-pointer text-left flex items-baseline gap-2 max-w-full hover:text-gold transition-colors duration-200 ease-in-out focus-visible:outline-2 focus-visible:outline-gold focus:outline-none ${strong ? "font-medium" : ""}`}
      >
        <span aria-hidden className={`inline-block w-2 shrink-0 text-[10px] text-ink-soft transition-transform duration-200 ease-in-out ${open ? "rotate-90" : ""}`}>
          ▶
        </span>
        <span className="truncate">{name}</span>
      </button>
    </span>
  );
}

const NUM = "label !tracking-[0.06em] sm:!tracking-[0.18em] text-ink-soft pb-2 pr-4 font-medium text-right whitespace-nowrap";
const CELL = "py-2 pr-4 text-right tabular-nums";

// the count, and under it, small and in oxblood, how many stand alone:
// applications for a string nobody else applied for
const Apps = ({ n, sets }: { n: number; sets: number }) => (
  <span className="inline-flex flex-col items-end leading-tight">
    <span>{n}</span>
    {n - sets > 0 && <span className="text-[11px] text-oxblood">{n - sets}</span>}
  </span>
);

const inSets = (e: MockEntity) => e.apps.filter((a) => a.setSize > 1).length;

// every entity in the group names the same people: print them once
const sharedRoles = (g: MockGroup): Role[] | null => {
  if (g.entities.length < 2) return null;
  const key = (e: MockEntity) => JSON.stringify(e.roles ?? []);
  const first = key(g.entities[0]);
  if (!first || first === "[]") return null;
  return g.entities.every((e) => key(e) === first) ? g.entities[0].roles! : null;
};

// The people a record names, one line per AGB question. A name the query
// matched is set in gold, the strings page's mark for the active pick. A name
// links to the people page searched for it, which opens that person.
function People({ roles, note, match }: { roles: Role[] | undefined; note?: string; match: string }) {
  if (!roles?.length)
    return <p className="serif italic text-ink-soft">No names in the published record.</p>;
  const hot = (n: string) => match.length > 0 && n.toLowerCase().includes(match);
  return (
    <div className="grid sm:grid-cols-[minmax(0,10rem)_1fr] gap-x-4 gap-y-1">
      {note && (
        <p className={`${TAG} text-ink-soft col-span-2 mb-1`}>{note}</p>
      )}
      {roles.map((r) => (
        <Fragment key={r.role}>
          <span className={`${TAG} text-ink-soft pt-0.5`}>{r.role}</span>
          <span className="mb-1 sm:mb-0">
            {r.names.map((n, i) => (
              <span key={n}>
                {i > 0 && ", "}
                {PERSON_ROLES.has(r.role) ? (
                  <Link
                    href={`${PEOPLE}?q=${encodeURIComponent(n)}`}
                    scroll={false}
                    aria-current={hot(n) || undefined}
                    className={`${LINK} ${hot(n) ? "text-gold decoration-gold font-medium" : ""}`}
                  >
                    {n}
                  </Link>
                ) : (
                  <span className={hot(n) ? "text-gold font-medium" : ""}>{n}</span>
                )}
              </span>
            ))}
          </span>
        </Fragment>
      ))}
    </div>
  );
}

// Why the query reached this row, when the row itself does not show it:
// the entity or the person it matched. A matched string needs no line; it
// moves to the front of the row's list instead.
function Why({ hit }: { hit: GroupHit }) {
  if (hit.name || (!hit.entities.length && !hit.people.length)) return null;
  const line = (word: string, names: string[]) =>
    names.length > 0 && (
      <span className="mr-4">
        <span className="serif italic text-ink-soft">{word}</span> {names.slice(0, 3).join(", ")}
        {names.length > 3 && <span className="text-ink-soft"> and {names.length - 3} more</span>}
      </span>
    );
  return (
    <tr className="text-xs">
      <td colSpan={4} className="pb-2 pl-4 pt-0">
        {line(hit.entities.length === 1 ? "entity" : "entities", hit.entities)}
        {line("names", hit.people)}
      </td>
    </tr>
  );
}

export default function Entities({ data: d }: { data: MockData }) {
  // what the reader opened or closed by hand, and under which query
  const [pick, setPick] = useState<{ for: string; group?: string | null; entity?: string | null; closedAuto?: boolean }>({ for: "" });
  const [q, setQ] = useState("");
  const dq = useDeferredValue(q); // the table follows the box when idle
  const searching = term(dq).length > 0;
  const hits = useMemo(() => {
    const m = new Map<string, GroupHit>();
    for (const g of d.groups) {
      const hit = groupHit(g, dq);
      if (hit) m.set(g.slug, hit);
    }
    return m;
  }, [d.groups, dq]);
  // one list, most applications first (the data's order); 407 groups render
  // lighter than the strings page, so no paging here
  const rows = d.groups.filter((g) => hits.has(g.slug));
  const names = useMemo(
    () => [
      { kind: "group", items: d.groups.filter((g) => g.entities.length > 1).map((g) => g.name).sort() },
      { kind: "entity", items: [...new Set(d.groups.flatMap((g) => g.entities.map((e) => e.name)))].sort() },
      { kind: "person", items: (d.people ?? []).map((p) => p.name).sort() },
      { kind: "string", items: stringNames(d.apps) },
    ],
    [d.groups, d.people, d.apps],
  );
  const pin = searching ? (a: Parameters<typeof stringHit>[0]) => stringHit(a, term(dq)) : undefined;

  // A query that lands on one group opens it, and when a person matched, the
  // entity naming them, so the name is in view. Derived, not set: the caret
  // still closes it (recorded against this query), and the next query that
  // lands on one group opens that one. A pick made by hand belongs to the
  // query it was made under, so a new query starts from the auto state.
  const auto = (() => {
    if (!searching || rows.length !== 1) return null;
    const g = rows[0];
    const why = hits.get(g.slug)!;
    const named = why.people.length
      ? g.entities.find((e) => e.roles?.some((r) => r.names.some((n) => why.people.includes(n))))
      : undefined;
    return { group: g.slug, entity: g.entities.length > 1 ? named?.slug ?? null : null };
  })();
  const autoOn = auto && pick.for === dq && pick.closedAuto ? null : auto;
  const openSlug = pick.for === dq && pick.group !== undefined ? pick.group : autoOn?.group ?? null;
  const openEntitySlug = pick.for === dq && pick.entity !== undefined ? pick.entity
    : openSlug === autoOn?.group ? autoOn?.entity ?? null : null;

  const toggleGroup = (slug: string) => {
    const closing = openSlug === slug;
    setPick({ for: dq, group: closing ? null : slug, entity: null, closedAuto: closing && autoOn?.group === slug });
  };
  const toggleEntity = (slug: string) =>
    setPick({ ...pick, for: dq, group: openSlug, entity: openEntitySlug === slug ? null : slug });

  return (
    <section className="mb-14">
      <SectionHead n="I" title="Applicants" count={rows.length} />
      <SearchBox
        id="applicants-search"
        value={q}
        onChange={setQ}
        names={names}
        ariaLabel="Search groups, entities, people and strings"
        count={`${rows.length} ${rows.length === 1 ? "applicant" : "applicants"}`}
      />
      <p className={`${TAG} text-ink-soft mb-4`}>
        <sup className="text-oxblood">n</sup> applications for the string
        <span className="text-rule mx-2">·</span>
        <span className="text-oxblood">n</span> under apps, uncontested
      </p>
      {/* no sideways scroll: below sm the entity count goes and the strings
          wrap under the name instead of beside it */}
      <div>
        {/* fixed layout: the strings column takes what is left and wraps,
            so an unfolded list never widens the table */}
        <table className="w-full text-sm border-collapse table-fixed">
          <thead>
            <tr>
              <th className={`${TH} sm:w-72`}>Applicant</th>
              <th className={`${NUM} w-16 hidden sm:table-cell`}>Entities</th>
              <th className={`${NUM} w-16`}>Apps</th>
              <th className={`${TH} pl-4 !pr-0 hidden sm:table-cell`}>Strings</th>
            </tr>
          </thead>
          <tbody className={`transition-opacity duration-200 ease-in-out ${dq !== q ? "opacity-60" : ""}`}>
            {rows.map((g) => {
              const isOpen = openSlug === g.slug;
              const shared = isOpen ? sharedRoles(g) : null;
              const why = hits.get(g.slug)!;
              // one entity: it is the group; no second row repeating it
              const one = g.entities.length === 1 ? g.entities[0] : null;
              const fold = !isOpen || one;
              return (
                <Fragment key={g.slug}>
                  <tr
                    id={`g-${g.slug}`}
                    className={`border-t align-top scroll-mt-4 target:bg-paper-deep ${isOpen ? "border-ink" : "border-rule-faint"}`}
                  >
                    <td className="py-2 pr-4">
                      <span className="flex items-baseline max-w-full">
                        <Toggle open={isOpen} onClick={() => toggleGroup(g.slug)} name={g.name} strong />
                        {/* a declared parent is searched as one; a group of one entity is that applicant */}
                        <ToStrings by={g.link === "parent" ? "parent" : "applicant"} name={g.link === "parent" ? g.name : g.entities[0].name} />
                      </span>
                      {one?.jurisdiction && <span className="block text-xs text-ink-soft mt-0.5 pl-4">{one.jurisdiction}</span>}
                    </td>
                    <td className={`${CELL} hidden sm:table-cell`}>{g.entities.length}</td>
                    <td className={CELL}>
                      <Apps n={g.apps.length} sets={g.inSets} />
                    </td>
                    {/* open, the entity rows carry the strings instead */}
                    <td className="py-2 pl-4 leading-6 hidden sm:table-cell">{fold && <StringFold apps={g.apps} pin={pin} />}</td>
                  </tr>
                  {/* below sm the strings take a line of their own */}
                  {fold && (
                    <tr className="sm:hidden">
                      <td colSpan={2} className="pb-2 leading-6 text-xs">
                        <StringFold apps={g.apps} pin={pin} />
                      </td>
                    </tr>
                  )}
                  {!isOpen && <Why hit={why} />}

                  {/* level two: one row per entity, strings narrowed to its own */}
                  {isOpen && !one &&
                    g.entities.map((e) => {
                      const eOpen = openEntitySlug === e.slug;
                      return (
                        <Fragment key={e.slug}>
                          <tr className="bg-paper-deep align-top">
                            <td className="py-1.5 pr-4 pl-5">
                              <span className="flex items-baseline max-w-full">
                                <Toggle open={eOpen} onClick={() => toggleEntity(e.slug)} name={e.name} />
                                <ToStrings by="applicant" name={e.name} />
                              </span>
                              {e.jurisdiction && <span className="block text-xs text-ink-soft mt-0.5 pl-4">{e.jurisdiction}</span>}
                            </td>
                            <td className={`${CELL} py-1.5 hidden sm:table-cell`} />
                            <td className={`${CELL} py-1.5`}>
                              <Apps n={e.apps.length} sets={inSets(e)} />
                            </td>
                            <td className="py-1.5 pl-4 leading-6 hidden sm:table-cell">
                              <StringFold apps={e.apps} pin={pin} />
                            </td>
                          </tr>
                          <tr className="sm:hidden bg-paper-deep">
                            <td colSpan={2} className="pl-9 pb-2 leading-6 text-xs">
                              <StringFold apps={e.apps} pin={pin} />
                            </td>
                          </tr>
                          {/* level three: people, per entity when they differ */}
                          {eOpen && !shared && (
                            <tr className="bg-paper-deep">
                              <td colSpan={4} className="pl-9 pr-4 pb-3 pt-1">
                                <People roles={e.roles} match={term(dq)} />
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      );
                    })}
                  {/* people once, when every entity names the same ones or there is one entity */}
                  {isOpen && (shared || one) && (
                    <tr className="bg-paper-deep">
                      <td colSpan={4} className={`pl-9 pr-4 pb-3 pt-2 ${one ? "" : "border-t border-rule-faint"}`}>
                        <People
                          roles={shared ?? g.entities[0].roles}
                          note={shared ? `Named by each of the ${g.entities.length} entities` : undefined}
                          match={term(dq)}
                        />
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
            {rows.length === 0 && (
              <tr className="border-t border-rule-faint">
                <td colSpan={4} className="py-6 text-ink-soft serif italic">
                  No applicants match.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
