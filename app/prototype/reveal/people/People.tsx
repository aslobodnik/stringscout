"use client";

// The page that starts from who is named. One row per person; the name opens
// the entities that name them, each with the role the record gives. A copy of
// the entities table, so the two read the same.
//
// Searching reads the name, the entities naming the person, their roles and
// their strings. A row reached through an entity or a role says so under the
// row; a matched string moves to the front of its list. While a query is in
// the box the two sections become one list.
import Link from "next/link";
import { Fragment, useDeferredValue, useMemo, useState } from "react";
import Tip from "@/components/Tip";
import SectionHead from "@/components/SectionHead";
import { ENTITIES, LINK, StringFold, StringList, TAG, TH } from "../bits";
import SearchBox from "../SearchBox";
import { personHit, stringHit, stringNames, term, type PersonHit } from "../search";
import type { MockData, MockPerson } from "../mock";

const NUM = "label !tracking-[0.06em] sm:!tracking-[0.18em] text-ink-soft pb-2 pr-4 font-medium text-right whitespace-nowrap";
const CELL = "py-2 pr-4 text-right tabular-nums";

const ROLE_SHORT: Record<string, string> = {
  Directors: "director",
  "Officers & partners": "officer",
  "Executive responsibility": "executive",
};
const shortRoles = (roles: string[]) => roles.map((r) => ROLE_SHORT[r] ?? r).join(", ");

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

const Apps = ({ n, sets }: { n: number; sets: number }) => (
  <span className="inline-flex flex-col items-end leading-tight">
    <span>{n}</span>
    {n - sets > 0 && <span className="text-[11px] text-oxblood">{n - sets}</span>}
  </span>
);

// Why the query reached this row when the name did not match: the entity
// that names the person, or the role. Strings move to the front instead.
function Why({ hit, colSpan }: { hit: PersonHit; colSpan: number }) {
  if (hit.name || (!hit.entities.length && !hit.roles.length)) return null;
  const line = (word: string, names: string[]) =>
    names.length > 0 && (
      <span className="mr-4">
        <span className="serif italic text-ink-soft">{word}</span> {names.slice(0, 3).join(", ")}
        {names.length > 3 && <span className="text-ink-soft"> and {names.length - 3} more</span>}
      </span>
    );
  return (
    <tr className="text-xs">
      <td colSpan={colSpan} className="pb-2 pl-4 pt-0">
        {line(hit.entities.length === 1 ? "named by" : "named by", hit.entities)}
        {line("as", hit.roles.map((r) => ROLE_SHORT[r] ?? r))}
      </td>
    </tr>
  );
}

export default function People({ data: d }: { data: MockData }) {
  // what the reader opened or closed by hand, and under which query
  const [pick, setPick] = useState<{ for: string; slug?: string | null }>({ for: "" });
  const [q, setQ] = useState("");
  const dq = useDeferredValue(q); // the table follows the box when idle
  const searching = term(dq).length > 0;
  const all = useMemo(() => d.people ?? [], [d.people]);
  const hits = useMemo(() => {
    const m = new Map<string, PersonHit>();
    for (const p of all) {
      const hit = personHit(p, dq);
      if (hit) m.set(p.slug, hit);
    }
    return m;
  }, [all, dq]);
  const rows = all.filter((p) => hits.has(p.slug));
  // the long tail, named by one entity for one application, sits below
  const several = (p: MockPerson) => p.apps.length > 1 || p.entities.length > 1;
  // idle: people with several applications above, the rest below;
  // searching: everyone the query reached, in one list
  const main = searching ? rows : rows.filter(several);
  const single = rows.filter((p) => !several(p));
  const names = useMemo(
    () => [
      { kind: "person", items: all.map((p) => p.name).sort() },
      { kind: "entity", items: [...new Set(all.flatMap((p) => p.entities.map((e) => e.name)))].sort() },
      { kind: "string", items: stringNames(d.apps) },
    ],
    [all, d.apps],
  );
  const pin = searching ? (a: Parameters<typeof stringHit>[0]) => stringHit(a, term(dq)) : undefined;
  // A query that lands on one person opens them, so the entities naming them
  // sit under the name. Derived, not set: the caret still closes it, and a
  // pick made by hand belongs to the query it was made under.
  const auto = searching && main.length === 1 ? main[0].slug : null;
  const openSlug = pick.for === dq && pick.slug !== undefined ? pick.slug : auto;
  const toggle = (slug: string) => setPick({ for: dq, slug: openSlug === slug ? null : slug });

  return (
    <section className="mb-14">
      <SectionHead n="I" title="People" count={main.length} />
      <SearchBox
        id="people-search"
        value={q}
        onChange={setQ}
        names={names}
        ariaLabel="Search people, entities, roles and strings"
        count={`${main.length} ${main.length === 1 ? "person" : "people"}`}
      />
      <p className={`${TAG} text-ink-soft mb-4`}>
        <sup className="text-oxblood">n</sup> applications for the string
        <span className="text-rule mx-2">·</span>
        <span className="text-oxblood">n</span> under apps, uncontested
      </p>
      <table className="w-full text-sm border-collapse table-fixed">
        <thead>
          <tr>
            <th className={`${TH} sm:w-56`}>Person</th>
            <th className={`${TH} w-28 hidden sm:table-cell`}>Named as</th>
            <th className={`${NUM} w-16`}>Entities</th>
            <th className={`${NUM} w-16`}>Apps</th>
            <th className={`${TH} pl-4 !pr-0 hidden sm:table-cell`}>Strings</th>
          </tr>
        </thead>
        <tbody className={`transition-opacity duration-200 ease-in-out ${dq !== q ? "opacity-60" : ""}`}>
          {main.map((p) => {
            const isOpen = openSlug === p.slug;
            return (
              <Fragment key={p.slug}>
                <tr
                  id={`p-${p.slug}`}
                  className={`border-t align-top scroll-mt-4 target:bg-paper-deep ${isOpen ? "border-ink" : "border-rule-faint"}`}
                >
                  <td className="py-2 pr-4">
                    <Toggle open={isOpen} onClick={() => toggle(p.slug)} name={p.name} strong />
                  </td>
                  <td className="py-2 pr-4 text-ink-soft hidden sm:table-cell">{shortRoles(p.roles)}</td>
                  <td className={CELL}>{p.entities.length}</td>
                  <td className={CELL}>
                    <Apps n={p.apps.length} sets={p.inSets} />
                  </td>
                  <td className="py-2 pl-4 leading-6 hidden sm:table-cell">{!isOpen && <StringFold apps={p.apps} pin={pin} />}</td>
                </tr>
                {!isOpen && (
                  <tr className="sm:hidden">
                    <td colSpan={3} className="pb-2 leading-6 text-xs">
                      <StringFold apps={p.apps} pin={pin} />
                    </td>
                  </tr>
                )}
                {!isOpen && <Why hit={hits.get(p.slug)!} colSpan={5} />}
                {isOpen &&
                  p.entities.map((e) => {
                    const own = p.apps.filter((a) => a.slug === e.slug);
                    return (
                      <Fragment key={e.slug}>
                        <tr className="bg-paper-deep align-top">
                          <td className="py-1.5 pr-4 pl-9">
                            <Link href={`${ENTITIES}#g-${e.group}`} className={LINK}>
                              {e.name}
                            </Link>
                            <span className="block text-xs text-ink-soft mt-0.5 sm:hidden">{shortRoles(e.roles)}</span>
                          </td>
                          <td className="py-1.5 pr-4 text-ink-soft hidden sm:table-cell">{shortRoles(e.roles)}</td>
                          <td className={`${CELL} py-1.5`} />
                          <td className={`${CELL} py-1.5`}>
                            <Apps n={own.length} sets={own.filter((a) => a.setSize > 1).length} />
                          </td>
                          <td className="py-1.5 pl-4 leading-6 hidden sm:table-cell">
                            <StringFold apps={own} pin={pin} />
                          </td>
                        </tr>
                        <tr className="sm:hidden bg-paper-deep">
                          <td colSpan={3} className="pl-9 pb-2 leading-6 text-xs">
                            <StringFold apps={own} pin={pin} />
                          </td>
                        </tr>
                      </Fragment>
                    );
                  })}
              </Fragment>
            );
          })}
          {main.length === 0 && (
            <tr className="border-t border-rule-faint">
              <td colSpan={5} className="py-6 text-ink-soft serif italic">
                No one matches.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {!searching && (
        <>
          <SectionHead n="II" title="One application" count={single.length} className="mt-12" />
          <div className="grid sm:grid-cols-2 gap-x-12 text-sm">
            {single.map((p) => (
              <div
                key={p.slug}
                id={`p-${p.slug}`}
                className="flex items-baseline justify-between gap-4 py-1.5 border-b border-rule-faint scroll-mt-4 target:bg-paper-deep"
              >
                <span>
                  {p.name}
                  <span className="text-xs text-ink-soft ml-2">{p.entities[0].name}</span>
                </span>
                <StringList apps={p.apps} />
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
