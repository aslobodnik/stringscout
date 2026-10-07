"use client";

// The page that starts from who is named. One row per person; the name opens
// the entities that name them, each with the role the record gives. A copy of
// the entities table, so the two read the same.
import Link from "next/link";
import { Fragment, useDeferredValue, useState } from "react";
import Tip from "@/components/Tip";
import SectionHead from "@/components/SectionHead";
import { ENTITIES, LINK, StringFold, StringList, TAG, TH } from "../bits";
import type { MockData, MockPerson } from "../mock";

const NUM = "label !tracking-[0.06em] sm:!tracking-[0.18em] text-ink-soft pb-2 pr-4 font-medium text-right whitespace-nowrap";
const CELL = "py-2 pr-4 text-right tabular-nums";
const INPUT =
  "border border-ink bg-transparent px-3 h-10 text-base sm:text-sm w-full placeholder:text-ink-soft focus:border-gold focus:outline-none transition-colors duration-200 ease-in-out";

const ROLE_SHORT: Record<string, string> = {
  Directors: "director",
  "Officers & partners": "officer",
  "Executive responsibility": "executive",
};

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

const Strings = ({ p }: { p: MockPerson }) => <StringFold apps={p.apps} />;

// name, any entity naming them, any string they stand behind
const matches = (p: MockPerson, q: string) => {
  const t = q.trim().toLowerCase().replace(/^\./, "");
  return (
    !t ||
    p.name.toLowerCase().includes(t) ||
    p.entities.some((e) => e.name.toLowerCase().includes(t)) ||
    p.apps.some((a) => a.tld.includes(t))
  );
};

export default function People({ data: d }: { data: MockData }) {
  const [open, setOpen] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const dq = useDeferredValue(q); // the table follows the box when idle
  const all = d.people ?? [];
  const rows = all.filter((p) => matches(p, dq));
  const auto = dq.trim().length > 2 && rows.length <= 3;
  // the long tail, named by one entity for one application, sits below
  const several = (p: MockPerson) => p.apps.length > 1 || p.entities.length > 1;
  const main = rows.filter(several);
  const single = rows.filter((p) => !several(p));

  return (
    <section className="mb-14">
      <SectionHead n="I" title="People" count={main.length} />
      <div className="mb-5">
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search…"
          aria-label="Search people, entities and strings"
          className={`${INPUT} sm:w-44`}
        />
      </div>
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
        <tbody>
          {main.map((p) => {
            const isOpen = open === p.slug || auto;
            return (
              <Fragment key={p.slug}>
                <tr
                  id={`p-${p.slug}`}
                  className={`border-t align-top scroll-mt-4 target:bg-paper-deep ${isOpen ? "border-ink" : "border-rule-faint"}`}
                >
                  <td className="py-2 pr-4">
                    <Toggle open={isOpen} onClick={() => setOpen(isOpen && !auto ? null : p.slug)} name={p.name} strong />
                  </td>
                  <td className="py-2 pr-4 text-ink-soft hidden sm:table-cell">{p.roles.map((r) => ROLE_SHORT[r] ?? r).join(", ")}</td>
                  <td className={CELL}>{p.entities.length}</td>
                  <td className={CELL}>
                    <Apps n={p.apps.length} sets={p.inSets} />
                  </td>
                  <td className="py-2 pl-4 leading-6 hidden sm:table-cell">{!isOpen && <Strings p={p} />}</td>
                </tr>
                {!isOpen && (
                  <tr className="sm:hidden">
                    <td colSpan={3} className="pb-2 leading-6 text-xs">
                      <Strings p={p} />
                    </td>
                  </tr>
                )}
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
                            <span className="block text-xs text-ink-soft mt-0.5 sm:hidden">{e.roles.map((r) => ROLE_SHORT[r] ?? r).join(", ")}</span>
                          </td>
                          <td className="py-1.5 pr-4 text-ink-soft hidden sm:table-cell">{e.roles.map((r) => ROLE_SHORT[r] ?? r).join(", ")}</td>
                          <td className={`${CELL} py-1.5`} />
                          <td className={`${CELL} py-1.5`}>
                            <Apps n={own.length} sets={own.filter((a) => a.setSize > 1).length} />
                          </td>
                          <td className="py-1.5 pl-4 leading-6 hidden sm:table-cell">
                            <StringFold apps={own} />
                          </td>
                        </tr>
                        <tr className="sm:hidden bg-paper-deep">
                          <td colSpan={3} className="pl-9 pb-2 leading-6 text-xs">
                            <StringFold apps={own} />
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
    </section>
  );
}
