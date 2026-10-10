"use client";

// Who shares a string with you. Pick yourself and read the people most shared
// first; pick the person you are talking to and only your shared strings
// stay, or pick the company and every row it is behind stays, or an entity
// under a parent and every row it is on. Both picks live in the URL
// (?me=&with=) so a link restores them, and nothing after load needs the
// network. The section count is the people on the rows shown. A name opens
// the strings page filtered to that person.
//
// The list is one list, a hundred a page, as the people page: no fold for
// the tail, since a second heading hides most of a list. A row is the people
// behind the same parents on the same strings, a name a line, who is behind
// them under the names, and the shared strings three lines deep, opening to
// the rest in place.
import Link from "next/link";
import { Fragment, useMemo, useState, useSyncExternalStore } from "react";
import Tip from "@/components/Tip";
import { ENTITIES, LINK, StringFold, StringList, TH, stringsFor } from "@/app/prototype/reveal/bits";
import Pager, { PAGE } from "@/app/prototype/reveal/Pager";
import { mergeByParent, overlapsFor, personPick, type OverlapRow, type Pick } from "@/lib/overlap";
import { subscribeToUrl } from "@/lib/url";
import type { MockApp, MockData, MockGroup } from "@/app/prototype/reveal/mock";
import PickBox from "./PickBox";

const NUM = "label !tracking-[0.06em] sm:!tracking-[0.18em] text-ink-soft pb-2 pr-4 font-medium text-right whitespace-nowrap";
const GOLD = "text-gold decoration-gold";

// Who is behind a set of applications: a declared parent prints once as its
// name, its entities behind "n entities", which opens them in place; an
// entity with no parent prints as itself. Three, then "and n more".
type Behind = { slug: string; name: string; href: string; under: string[] }; // slug: the group
function behind(apps: MockApp[], groups: MockGroup[]): Behind[] {
  const byGroup = Map.groupBy(apps, (a) => a.group);
  return [...byGroup.entries()].map(([slug, as]) => {
    const g = groups.find((x) => x.slug === slug);
    const entities = [...new Set(as.map((a) => a.applicant))];
    if (g?.link === "parent") return { slug, name: g.name, href: stringsFor("parent", g.name), under: entities };
    return { slug, name: entities[0], href: `${ENTITIES}?q=${encodeURIComponent(entities[0])}`, under: [] };
  });
}

const FOLD = "cursor-pointer text-ink-soft hover:text-gold transition-colors duration-200 ease-in-out focus-visible:outline-2 focus-visible:outline-gold";

const entityLinks = (names: string[]) =>
  names.map((n, i) => (
    <span key={n}>
      {i > 0 && ", "}
      <Link href={`${ENTITIES}?q=${encodeURIComponent(n)}`} scroll={false} className={LINK}>
        {n}
      </Link>
    </span>
  ));

function Under({ names }: { names: string[] }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      {" "}
      <button type="button" aria-expanded={open} onClick={() => setOpen(!open)} className={FOLD}>
        {open ? "fewer" : `${names.length} entities`}
      </button>
      {open && <span className="block pl-3">{entityLinks(names)}</span>}
    </>
  );
}

// Who is behind your own strings, on one line under your box.
function Few({ items }: { items: Behind[] }) {
  const [open, setOpen] = useState(false);
  const shown = open ? items : items.slice(0, 3);
  const more = items.length - 3;
  return (
    <>
      {shown.map((b, i) => (
        <span key={b.slug}>
          {i > 0 && ", "}
          <Link href={b.href} scroll={false} className={LINK}>
            {b.name}
          </Link>
          {b.under.length > 1 && <Under names={b.under} />}
        </span>
      ))}
      {more > 0 && (
        <button type="button" aria-expanded={open} onClick={() => setOpen(!open)} className={FOLD}>
          {open ? ", fewer" : ` and ${more} more`}
        </button>
      )}
    </>
  );
}

// One behind a row, a line each. Above sm a long name is cut and shows
// whole on hover; below sm, where there is no hover, it wraps instead.
function BehindLine({ b, hot }: { b: Behind; hot: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <div className="sm:flex sm:items-baseline sm:gap-2 max-w-full">
        <span className="group relative min-w-0">
          <Tip>{b.name}</Tip>
          <Link href={b.href} scroll={false} className={`${LINK} sm:block sm:truncate ${hot ? GOLD : ""}`}>
            {b.name}
          </Link>
        </span>
        {b.under.length > 1 && (
          <>
            {" "}
            <button type="button" aria-expanded={open} onClick={() => setOpen(!open)} className={`${FOLD} whitespace-nowrap sm:shrink-0`}>
              {open ? "fewer" : `${b.under.length} entities`}
            </button>
          </>
        )}
      </div>
      {open && <div className="pl-3">{entityLinks(b.under)}</div>}
    </div>
  );
}

function Behinds({ items, hot }: { items: Behind[]; hot: string | null }) {
  const [open, setOpen] = useState(false);
  const shown = open ? items : items.slice(0, 3);
  const more = items.length - 3;
  return (
    <div className="mt-0.5 text-xs text-ink-soft">
      {shown.map((b) => (
        <BehindLine key={b.slug} b={b} hot={b.slug === hot} />
      ))}
      {more > 0 && (
        <button type="button" aria-expanded={open} onClick={() => setOpen(!open)} className={`${FOLD} block`}>
          {open ? "fewer" : `and ${more} more`}
        </button>
      )}
    </div>
  );
}

// The people on a row, a line each: they share every string on it. A name
// longer than the column wraps inside itself rather than running into the
// next.
function Names({ people, hot }: { people: OverlapRow[]; hot: string | null }) {
  return (
    <div>
      {people.map(({ person: p }) => (
        <div key={p.slug}>
          <Link href={stringsFor("person", p.name)} scroll={false} className={`${LINK} font-medium ${p.slug === hot ? GOLD : ""}`}>
            {p.name}
          </Link>
        </div>
      ))}
    </div>
  );
}

export default function Overlap({ data: d }: { data: MockData }) {
  const people = useMemo(() => d.people ?? [], [d.people]);
  const bySlug = useMemo(() => new Map(people.map((p) => [p.slug, p])), [people]);
  const mePicks = useMemo(() => people.map(personPick), [people]);
  // the URL is the state: both picks read from it, so a link restores them
  const search = useSyncExternalStore(subscribeToUrl, () => window.location.search, () => "");
  const [meSlug, withSlug] = useMemo(() => {
    const u = new URLSearchParams(search);
    return [u.get("me"), u.get("with")];
  }, [search]);
  const set = (key: "me" | "with", p: Pick | null) => {
    const u = new URLSearchParams(window.location.search);
    if (p) u.set(key, p.slug);
    else u.delete(key);
    if (key === "me") u.delete("with");
    history.replaceState(null, "", `${window.location.pathname}${u.size ? `?${u}` : ""}`);
  };
  // what the second box offers: everyone, every company, and every entity
  // under a parent, not only the list, so a name off the list gets an
  // answer rather than silence. An entity's slug carries a prefix, since
  // one can equal a group's.
  const [withPicks, entityOf] = useMemo(() => {
    const companies = d.groups.map<Pick>((g) => {
      const n = new Set(g.apps.map((a) => a.tld)).size;
      return {
        kind: "company",
        slug: g.slug,
        name: g.name,
        sub: g.entities.length > 1 ? `${g.entities.length} entities` : `${n} ${n === 1 ? "string" : "strings"}`,
      };
    });
    const under = new Map<string, { entity: string; group: string }>();
    const entities: Pick[] = [];
    for (const g of d.groups) {
      if (g.link !== "parent") continue;
      for (const e of g.entities) {
        if (e.name.toLowerCase() === g.name.toLowerCase()) continue; // the parent's pick is it
        const slug = `entity-${e.slug}`;
        under.set(slug, { entity: e.slug, group: g.slug });
        entities.push({ kind: "company", slug, name: e.name, sub: g.name });
      }
    }
    return [[...mePicks, ...companies, ...entities] as Pick[], under] as const;
  }, [mePicks, d.groups]);
  // you: a person, a parent company or an entity under one, picked from the
  // same list as the second box; what counts is the applications behind it
  const mePick = meSlug ? (withPicks.find((k) => k.slug === meSlug) ?? null) : null;
  const me = useMemo(() => {
    if (!mePick) return null;
    if (mePick.kind === "person") {
      const p = bySlug.get(mePick.slug);
      return p ? { slug: p.slug, apps: p.apps, entities: p.entities.map((e) => e.name) } : null;
    }
    const e = entityOf.get(mePick.slug);
    const g = d.groups.find((x) => x.slug === (e ? e.group : mePick.slug));
    if (!g) return null;
    return { slug: mePick.slug, apps: e ? g.apps.filter((a) => a.slug === e.entity) : g.apps, entities: undefined };
  }, [mePick, bySlug, entityOf, d.groups]);
  const rows = useMemo(() => (me ? overlapsFor(me, d) : []), [me, d]);
  const merged = useMemo(() => mergeByParent(rows), [rows]);
  const them = withSlug ? (withPicks.find((k) => k.slug === withSlug) ?? null) : null;
  const ent = them ? entityOf.get(them.slug) : undefined;
  // talking to one person: their row, holding only their own strings; to a
  // company: every row it is behind, every name on it; to an entity: every
  // row it is on
  const shown = useMemo(() => {
    if (!them) return merged;
    if (them.kind === "person") {
      const r = rows.find((x) => x.person.slug === them.slug);
      return r ? [{ people: [r], apps: r.apps, theirs: r.theirs }] : [];
    }
    return merged.filter((g) => g.theirs.some((a) => (ent ? a.slug === ent.entity : a.group === them.slug)));
  }, [them, ent, rows, merged]);
  // a pick that shares nothing: the entity both are named by, or your own company
  const aside = useMemo(() => {
    if (!me || !them || shown.length) return null;
    if (them.kind === "person") {
      const theirs = new Set(bySlug.get(them.slug)?.entities.map((e) => e.name));
      const both = (me.entities ?? []).filter((n) => theirs.has(n));
      return both.length ? `Both named by ${both.join(", ")}.` : null;
    }
    return me.apps.some((a) => (ent ? a.slug === ent.entity : a.group === them.slug)) ? "Your own company." : null;
  }, [me, them, ent, shown, bySlug]);
  const [page, setPage] = useState(0);
  const slice = shown.slice(page * PAGE, (page + 1) * PAGE);
  const turn = (n: number) => {
    setPage(n);
    document.getElementById("overlap")?.scrollIntoView({ block: "start" });
  };
  const mine = me ? behind(me.apps, d.groups) : [];
  const hotPerson = them?.kind === "person" ? them.slug : null;
  const hotCompany = them?.kind === "company" ? (ent?.group ?? them.slug) : null; // an entity lights its parent's line

  return (
    <section id="overlap" className="mb-14 scroll-mt-4">
      <div className="double-rule mb-5" />
      {/* side by side from md, stacked below; the you box keeps its width,
          so a pick in one moves nothing in the other */}
      <div className="flex flex-col md:flex-row md:items-start gap-x-8 gap-y-3 mb-6">
        <div className="w-full sm:w-80 md:shrink-0">
          <PickBox id="me" picks={withPicks} picked={me ? mePick : null} onPick={(p) => { set("me", p); setPage(0); }} autoFocus={!meSlug} />
          <p role="status" className="text-xs text-ink-soft mt-1.5 leading-4 min-h-4">
            {me && <Few items={mine} />}
            {meSlug && !me && <span className="serif italic">No one by that name in the records.</span>}
          </p>
        </div>
        {me && (
          <div className="flex-1 md:flex-none min-w-0">
            <div className="flex items-start gap-3">
              <label
                htmlFor="with-input"
                className="label text-ink-soft h-10 flex items-center shrink-0 cursor-pointer !text-[10px] !tracking-[0.08em] sm:!text-[0.6875rem] sm:!tracking-[0.18em]"
              >
                Talking to
              </label>
              <div className="flex-1 md:flex-none md:w-60 lg:w-80 min-w-0">
                <PickBox id="with" label="Talking to" alignRight picks={withPicks} picked={them} onPick={(p) => { set("with", p); setPage(0); }} />
                <p role="status" className="text-xs serif italic text-ink-soft mt-1.5 leading-4 min-h-4">
                  {withSlug && !them && "No one by that name in the records."}
                  {them && shown.length === 0 && `No shared string.${aside ? ` ${aside}` : ""}`}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
      {me && (
        <>
          {!them && rows.length === 0 && (
            <p className="border-t border-rule-faint py-6 serif italic text-ink-soft">No one in the records shares a string with you.</p>
          )}
          {slice.length > 0 && (
            <>
              <table className="w-full text-sm border-collapse table-fixed">
                <thead>
                  <tr>
                    <th className={`${TH} sm:w-56`}>Person ({shown.reduce((n, g) => n + g.people.length, 0)})</th>
                    <th className={`${NUM} w-14`}>Shared</th>
                    <th className={`${TH} pl-4 !pr-0 hidden sm:table-cell`}>Strings</th>
                  </tr>
                </thead>
                <tbody>
                  {slice.map(({ people: ps, apps, theirs }) => {
                    // who is on the shared strings, not everything the people sit on
                    const who = behind(theirs, d.groups);
                    const strings = them ? <StringList apps={apps} /> : <StringFold apps={apps} />;
                    return (
                      <Fragment key={ps[0].person.slug}>
                        <tr className="border-t border-rule-faint align-top">
                          <td className="py-2 pr-4">
                            <Names people={ps} hot={hotPerson} />
                            <Behinds items={who} hot={hotCompany} />
                          </td>
                          <td className="py-2 pr-4 text-right tabular-nums">{apps.length}</td>
                          <td className="py-2 pl-4 leading-6 hidden sm:table-cell">{strings}</td>
                        </tr>
                        <tr className="sm:hidden">
                          <td colSpan={2} className="pb-3 leading-6 text-xs">{strings}</td>
                        </tr>
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </>
          )}
          {!them && <Pager total={merged.length} page={page} onPage={turn} noun="rows" />}
        </>
      )}
    </section>
  );
}
