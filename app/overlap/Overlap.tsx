"use client";

// Who shares a string with you. Pick yourself, read the people most shared
// first; pick the person you are talking to and only your shared strings
// stay, or pick the company and every name behind it stays. Both picks live
// in the URL (?me=&with=) so a link restores them, and
// nothing after load needs the network.
//
// The list is one list, a hundred a page, as the people page: no fold for
// the tail, since a second heading hides most of a list. A row prints the
// shared strings three lines deep and opens to the rest in place.
import Link from "next/link";
import { Fragment, useMemo, useState, useSyncExternalStore } from "react";
import SectionHead from "@/components/SectionHead";
import { ENTITIES, LINK, PEOPLE, StringFold, StringList, TH, stringsFor } from "@/app/prototype/reveal/bits";
import Pager, { PAGE } from "@/app/prototype/reveal/Pager";
import { mergeByParent, overlapsFor, personPick, type Pick } from "@/lib/overlap";
import { subscribeToUrl } from "@/lib/url";
import type { MockApp, MockData, MockGroup } from "@/app/prototype/reveal/mock";
import PickBox from "./PickBox";

const NUM = "label !tracking-[0.06em] sm:!tracking-[0.18em] text-ink-soft pb-2 pr-4 font-medium text-right whitespace-nowrap";

// Who is behind a set of applications: a declared parent prints once as its
// name, its entities behind "n entities", which opens them in place; an
// entity with no parent prints as itself. Three names, then "and n more".
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

function Under({ names }: { names: string[] }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      {" "}
      <button type="button" aria-expanded={open} onClick={() => setOpen(!open)} className={FOLD}>
        {open ? "fewer" : `${names.length} entities`}
      </button>
      {open && (
        <span className="block pl-3">
          {names.map((n, i) => (
            <span key={n}>
              {i > 0 && ", "}
              <Link href={`${ENTITIES}?q=${encodeURIComponent(n)}`} scroll={false} className={LINK}>
                {n}
              </Link>
            </span>
          ))}
        </span>
      )}
    </>
  );
}

function Few({ items }: { items: Behind[] }) {
  const [open, setOpen] = useState(false);
  const shown = open ? items : items.slice(0, 3);
  const more = items.length - 3;
  return (
    <>
      {shown.map((b, i) => (
        <span key={b.name}>
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

// The counts, in the house tile row: a copy of the strings page's StatTiles
// with three tiles. Two leave for the people page; the third is the list
// below, and clears a "talking to" pick.
type Tile = { v: number; l: string; href?: string; act?: () => void; on?: boolean };
function Tiles({ tiles }: { tiles: Tile[] }) {
  const cell = "p-3 sm:p-4 text-left w-full block";
  const num = "text-2xl sm:text-3xl font-light tabular-nums";
  const cap = "label mt-2 text-ink-soft !tracking-[0.08em] !text-[10px] sm:!tracking-[0.18em] sm:!text-[0.6875rem] border-b border-dotted border-rule inline-block";
  return (
    <section className="grid grid-cols-3 border border-ink mb-8">
      {tiles.map(({ v, l, href, act, on }, i) => {
        const divider = i > 0 ? "border-l border-rule" : "";
        const inner = (
          <>
            <span className={`block ${num}`}>{v}</span>
            <span className={cap}>{l}</span>
          </>
        );
        const cls = `${cell} ${divider} transition-colors duration-200 ease-in-out hover:bg-paper-deep cursor-pointer ${on ? "bg-paper-deep" : ""}`;
        return href ? (
          <Link key={l} href={href} scroll={false} className={cls}>
            {inner}
          </Link>
        ) : (
          <button key={l} type="button" onClick={act} aria-pressed={on} className={cls}>
            {inner}
          </button>
        );
      })}
    </section>
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
  const me = meSlug ? (bySlug.get(meSlug) ?? null) : null;
  const rows = useMemo(() => (me ? overlapsFor(me, d) : []), [me, d]);
  const merged = useMemo(() => mergeByParent(rows), [rows]);
  // what the second box offers: everyone and every company, not only the
  // list, so a name off the list gets an answer rather than silence
  const withPicks = useMemo<Pick[]>(() => {
    const companies = d.groups.map<Pick>((g) => ({
      kind: "company",
      slug: g.slug,
      name: g.name,
      sub: g.entities.length > 1 ? `${g.entities.length} entities` : `${g.apps.length} ${g.apps.length === 1 ? "application" : "applications"}`,
    }));
    return [...mePicks, ...companies];
  }, [mePicks, d.groups]);
  const them = withSlug ? (withPicks.find((k) => k.slug === withSlug) ?? null) : null;
  // talking to one person: their row, holding only their own strings; to a
  // company: every row it is behind, every name on it
  const shown = useMemo(() => {
    if (!them) return merged;
    if (them.kind === "person") {
      const r = rows.find((x) => x.person.slug === them.slug);
      return r ? [{ people: [r], apps: r.apps, theirs: r.theirs }] : [];
    }
    return merged.filter((g) => g.theirs.some((a) => a.group === them.slug));
  }, [them, rows, merged]);
  // a pick that shares nothing: the entity both are named by, or your own company
  const aside = useMemo(() => {
    if (!me || !them || shown.length) return null;
    if (them.kind === "person") {
      const theirs = new Set(bySlug.get(them.slug)?.entities.map((e) => e.name));
      const both = me.entities.filter((e) => theirs.has(e.name)).map((e) => e.name);
      return both.length ? `Both named by ${both.join(", ")}.` : null;
    }
    return me.apps.some((a) => a.group === them.slug) ? "Your own company." : null;
  }, [me, them, shown, bySlug]);
  const [page, setPage] = useState(0);
  const slice = shown.slice(page * PAGE, (page + 1) * PAGE);
  const turn = (n: number) => {
    setPage(n);
    document.getElementById("overlap")?.scrollIntoView({ block: "start" });
  };
  const inSets = me ? me.apps.filter((a) => a.setSize > 1).length : 0;
  const mine = me ? behind(me.apps, d.groups) : [];

  return (
    <section id="overlap" className="mb-14 scroll-mt-4">
      <SectionHead n="I" title="Overlap" count={me ? rows.length : undefined} />
      <p className="mb-5 leading-6 max-w-prose">
        Applicants for strings in the same contention set may not communicate, directly or indirectly, about those applications or
        any strategy for the string{" "}
        <a
          href="https://newgtldprogram-2026-agb.icann.org/en/9-module-5-contention-set-resolution.html"
          target="_blank"
          rel="noopener"
          className={`${LINK} label !text-[10px] text-ink-soft whitespace-nowrap`}
        >
          AGB §5.2.3.1
        </a>
        .
      </p>
      {/* the two boxes side by side above sm, each under its label, same
          width, so a pick in one moves nothing in the other */}
      <div className="grid sm:grid-cols-2 gap-x-8 gap-y-5 mb-5">
        <div>
          <p className="label !text-sm mb-3">Find who you overlap with</p>
          <PickBox id="me" picks={mePicks} picked={me ? personPick(me) : null} onPick={(p) => { set("me", p); setPage(0); }} autoFocus={!meSlug} />
          <p className="text-xs text-ink-soft mt-2 min-h-4 leading-4">
            {me && <Few items={mine} />}
            {meSlug && !me && <span className="serif italic">No one named that in the records.</span>}
          </p>
        </div>
        {me && (
          <div>
            <p className="label !text-sm mb-3">Talking to</p>
            <PickBox id="with" label="Talking to" picks={withPicks} picked={them} onPick={(p) => { set("with", p); setPage(0); }} />
            <p className="text-xs text-ink-soft mt-2 min-h-4 leading-4 serif italic">
              {withSlug && !them && "No one by that name in the records."}
              {them && shown.length === 0 && `No shared string.${aside ? ` ${aside}` : ""}`}
            </p>
          </div>
        )}
      </div>
      {me && (
        <>
          <Tiles
            tiles={[
              { v: me.apps.length, l: me.apps.length === 1 ? "application" : "applications", href: `${PEOPLE}?q=${encodeURIComponent(me.name)}` },
              { v: inSets, l: "in overlap", href: `${PEOPLE}?q=${encodeURIComponent(me.name)}` },
              { v: rows.length, l: rows.length === 1 ? "person shares a string" : "people share a string", on: !them, act: () => set("with", null) },
            ]}
          />
          {!them && rows.length === 0 && (
            <p className="serif italic text-ink-soft mb-6">No overlap recorded: none of their strings sits in a set with another applicant&apos;s.</p>
          )}
          {slice.length > 0 && (
            <table className="w-full text-sm border-collapse table-fixed">
              <thead>
                <tr>
                  <th className={`${TH} sm:w-56`}>Person</th>
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
                          {ps.map(({ person: p, apps: own }) => (
                            <span key={p.slug} className="block">
                              <Link
                                href={`${PEOPLE}?q=${encodeURIComponent(p.name)}`}
                                scroll={false}
                                className={`${LINK} font-medium ${them?.slug === p.slug ? "text-gold decoration-gold" : ""}`}
                              >
                                {p.name}
                              </Link>
                              {own.length < apps.length && (
                                <span className="text-xs text-ink-soft ml-2 tabular-nums">
                                  {own.length} of {apps.length}
                                </span>
                              )}
                            </span>
                          ))}
                          <span className="block text-xs text-ink-soft mt-0.5">
                            <Few items={who} />
                          </span>
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
          )}
          {!them && <Pager total={merged.length} page={page} onPage={turn} noun="rows" />}
        </>
      )}
    </section>
  );
}
