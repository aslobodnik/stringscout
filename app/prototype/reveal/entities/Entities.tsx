"use client";

// PROTOTYPE, throwaway. The page that starts from who applied, as one table
// with three levels of disclosure:
//   group     one row each; the name opens its entities
//   entity    one row each under its group; the name opens its people
//   people    the names the record gives, by the AGB question that asked
//
// A group is entities tied by the applicant's own statement: the same
// declared parent (AGB Q26, Q36). Nothing is inferred.

import Link from "next/link";
import { Fragment, useDeferredValue, useState } from "react";
import Tip from "@/components/Tip";
import SectionHead from "@/components/SectionHead";
import { LINK, PEOPLE, PERSON_ROLES, StringFold, StringLink, TAG, TH, ToStrings, slugify } from "../bits";
import type { MockData, MockEntity, MockGroup, Role } from "../mock";

// A caret that turns when its row is open. The name is the label, not a link.
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

// a group worth a row of its own: more than one application or entity
const several = (g: MockGroup) => g.apps.length > 1 || g.entities.length > 1;

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

// The people a record names, one line per AGB question.
function People({ roles, note }: { roles: Role[] | undefined; note?: string }) {
  if (!roles?.length)
    return <p className="serif italic text-ink-soft">No names in the published record.</p>;
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
                  <Link href={`${PEOPLE}#p-${slugify(n)}`} className={LINK}>
                    {n}
                  </Link>
                ) : (
                  n
                )}
              </span>
            ))}
          </span>
        </Fragment>
      ))}
    </div>
  );
}

// The long tail: a group that is one entity with one application.
function Singles({ groups, n }: { groups: MockGroup[]; n: string }) {
  const single = groups.filter((g) => !several(g));
  return (
    <>
      <SectionHead n={n} title="One application" count={single.length} className="mt-12" />
      <div className="grid sm:grid-cols-2 gap-x-12 text-sm">
        {single.map((g) => (
          <div
            key={g.slug}
            id={`g-${g.slug}`}
            className="flex items-baseline justify-between gap-4 py-1.5 border-b border-rule-faint scroll-mt-4 target:bg-paper-deep"
          >
            <span className="min-w-0 flex items-baseline">
              <span className="truncate">{g.name}</span>
              <ToStrings by="applicant" name={g.entities[0].name} />
            </span>
            <StringLink a={g.apps[0]} />
          </div>
        ))}
      </div>
    </>
  );
}

const INPUT =
  "border border-ink bg-transparent px-3 h-10 text-base sm:text-sm w-full placeholder:text-ink-soft focus:border-gold focus:outline-none transition-colors duration-200 ease-in-out";

// group name, each entity, everyone named under it, and its strings
const matches = (g: MockGroup, q: string) => {
  const t = q.trim().toLowerCase().replace(/^\./, "");
  if (!t) return true;
  if (g.name.toLowerCase().includes(t)) return true;
  for (const e of g.entities) {
    if (e.name.toLowerCase().includes(t) || e.people.toLowerCase().includes(t)) return true;
    for (const r of e.roles ?? []) if (r.names.some((n) => n.toLowerCase().includes(t))) return true;
  }
  return g.apps.some((a) => a.tld.includes(t) || (a.replacement ?? "").includes(t));
};

export default function Entities({ data: d }: { data: MockData }) {
  const [open, setOpen] = useState<string | null>(null); // group slug
  const [openEntity, setOpenEntity] = useState<string | null>(null); // entity slug
  const [q, setQ] = useState("");
  const dq = useDeferredValue(q); // the table follows the box when idle
  const hit = d.groups.filter((g) => matches(g, dq));
  const rows = hit.filter(several);
  // a search for a person opens the groups it lands on, so the name is in view
  const auto = dq.trim().length > 2 && rows.length <= 3;

  const toggleGroup = (slug: string) => {
    setOpen(open === slug ? null : slug);
    setOpenEntity(null);
  };

  return (
    <section className="mb-14">
      <SectionHead n="I" title="Groups" count={rows.length} />
      <div className="mb-5">
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search…"
          aria-label="Search groups, entities, people and strings"
          className={`${INPUT} sm:w-44`}
        />
      </div>
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
              <th className={`${TH} sm:w-72`}>Group</th>
              <th className={`${NUM} w-16 hidden sm:table-cell`}>Entities</th>
              <th className={`${NUM} w-16`}>Apps</th>
              <th className={`${TH} pl-4 !pr-0 hidden sm:table-cell`}>Strings</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((g) => {
              const isOpen = open === g.slug || auto;
              const shared = isOpen ? sharedRoles(g) : null;
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
                    </td>
                    <td className={`${CELL} hidden sm:table-cell`}>{g.entities.length}</td>
                    <td className={CELL}>
                      <Apps n={g.apps.length} sets={g.inSets} />
                    </td>
                    {/* open, the entity rows carry the strings instead */}
                    <td className="py-2 pl-4 leading-6 hidden sm:table-cell">{!isOpen && <StringFold apps={g.apps} />}</td>
                  </tr>
                  {/* below sm the strings take a line of their own */}
                  {!isOpen && (
                    <tr className="sm:hidden">
                      <td colSpan={2} className="pb-2 leading-6 text-xs">
                        <StringFold apps={g.apps} />
                      </td>
                    </tr>
                  )}

                  {/* level two: one row per entity, strings narrowed to its own */}
                  {isOpen &&
                    g.entities.map((e) => {
                      const eOpen = openEntity === e.slug;
                      const own = g.entities.length > 1;
                      return (
                        <Fragment key={e.slug}>
                          <tr className="bg-paper-deep align-top">
                            <td className="py-1.5 pr-4 pl-5">
                              <span className="flex items-baseline max-w-full">
                                {own ? (
                                  <Toggle open={eOpen} onClick={() => setOpenEntity(eOpen ? null : e.slug)} name={e.name} />
                                ) : (
                                  <span className="pl-4 block truncate">{e.name}</span>
                                )}
                                <ToStrings by="applicant" name={e.name} />
                              </span>
                              {e.jurisdiction && <span className="block text-xs text-ink-soft mt-0.5 pl-4">{e.jurisdiction}</span>}
                            </td>
                            <td className={`${CELL} py-1.5 hidden sm:table-cell`} />
                            <td className={`${CELL} py-1.5`}>
                              <Apps n={e.apps.length} sets={inSets(e)} />
                            </td>
                            <td className="py-1.5 pl-4 leading-6 hidden sm:table-cell">
                              <StringFold apps={e.apps} />
                            </td>
                          </tr>
                          <tr className="sm:hidden bg-paper-deep">
                            <td colSpan={2} className="pl-9 pb-2 leading-6 text-xs">
                              <StringFold apps={e.apps} />
                            </td>
                          </tr>
                          {/* level three: people, per entity when they differ */}
                          {own && eOpen && !shared && (
                            <tr className="bg-paper-deep">
                              <td colSpan={4} className="pl-9 pr-4 pb-3 pt-1">
                                <People roles={e.roles} />
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      );
                    })}
                  {/* people once, when every entity names the same ones or there is one entity */}
                  {isOpen && (shared || g.entities.length === 1) && (
                    <tr className="bg-paper-deep">
                      <td colSpan={4} className="pl-9 pr-4 pb-3 pt-2 border-t border-rule-faint">
                        <People
                          roles={shared ?? g.entities[0].roles}
                          note={shared ? `Named by each of the ${g.entities.length} entities` : undefined}
                        />
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
      <Singles groups={hit} n="II" />
    </section>
  );
}
