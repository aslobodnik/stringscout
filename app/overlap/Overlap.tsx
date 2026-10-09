"use client";

// Who shares a string with you. Pick yourself, read the people most shared
// first; pick the person you are talking to and only your shared strings
// stay. Both picks live in the URL (?me=&with=) so a link restores them, and
// nothing after load needs the network.
//
// The list is one list, a hundred a page, as the people page: no fold for
// the tail, since a second heading hides most of a list. A row prints the
// shared strings three lines deep and opens to the rest in place.
import Link from "next/link";
import { Fragment, useMemo, useState, useSyncExternalStore } from "react";
import SectionHead from "@/components/SectionHead";
import { ENTITIES, LINK, PEOPLE, StringFold, StringList, TAG, TH, stringsFor } from "@/app/prototype/reveal/bits";
import Pager, { PAGE } from "@/app/prototype/reveal/Pager";
import { mergeAlike, overlapsFor } from "@/lib/overlap";
import { subscribeToUrl } from "@/lib/url";
import type { MockApp, MockData, MockGroup, MockPerson } from "@/app/prototype/reveal/mock";
import PersonBox from "./PersonBox";

const NUM = "label !tracking-[0.06em] sm:!tracking-[0.18em] text-ink-soft pb-2 pr-4 font-medium text-right whitespace-nowrap";

// Who is behind a set of applications: a declared parent prints once as its
// name, its entities behind "n entities", which opens them in place; an
// entity with no parent prints as itself. Three names, then "and n more".
type Behind = { name: string; href: string; under: string[] };
function behind(apps: MockApp[], groups: MockGroup[]): Behind[] {
  const byGroup = Map.groupBy(apps, (a) => a.group);
  return [...byGroup.entries()].map(([slug, as]) => {
    const g = groups.find((x) => x.slug === slug);
    const entities = [...new Set(as.map((a) => a.applicant))];
    if (g?.link === "parent") return { name: g.name, href: stringsFor("parent", g.name), under: entities };
    return { name: entities[0], href: `${ENTITIES}?q=${encodeURIComponent(entities[0])}`, under: [] };
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

export default function Overlap({ data: d }: { data: MockData }) {
  const people = useMemo(() => d.people ?? [], [d.people]);
  const bySlug = useMemo(() => new Map(people.map((p) => [p.slug, p])), [people]);
  // the URL is the state: both picks read from it, so a link restores them
  const search = useSyncExternalStore(subscribeToUrl, () => window.location.search, () => "");
  const [meSlug, withSlug] = useMemo(() => {
    const u = new URLSearchParams(search);
    return [u.get("me"), u.get("with")];
  }, [search]);
  const set = (key: "me" | "with", p: MockPerson | null) => {
    const u = new URLSearchParams(window.location.search);
    if (p) u.set(key, p.slug);
    else u.delete(key);
    if (key === "me") u.delete("with");
    history.replaceState(null, "", `${window.location.pathname}${u.size ? `?${u}` : ""}`);
  };
  const me = meSlug ? (bySlug.get(meSlug) ?? null) : null;
  const them = withSlug ? (bySlug.get(withSlug) ?? null) : null;
  const rows = useMemo(() => (me ? overlapsFor(me, d) : []), [me, d]);
  const rivals = useMemo(() => rows.map((r) => r.person), [rows]);
  const merged = useMemo(() => mergeAlike(rows), [rows]);
  const one = them ? (merged.find((g) => g.people.some((p) => p.slug === them.slug)) ?? null) : null;
  const shown = them ? (one ? [one] : []) : merged;
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
      <PersonBox id="me" label="I am" people={people} picked={me} onPick={(p) => { set("me", p); setPage(0); }} autoFocus={!meSlug} />
      {meSlug && !me && <p className="serif italic text-ink-soft mb-6">No one named that in the records.</p>}
      {me && (
        <>
          <p className="mb-5 leading-6">
            <span className="font-medium">{me.name}</span>
            <span className="text-ink-soft">, </span>
            <Few items={mine} />
            <span className="text-ink-soft">. </span>
            <Link href={`${PEOPLE}?q=${encodeURIComponent(me.name)}`} scroll={false} className={LINK}>
              {me.apps.length} {me.apps.length === 1 ? "application" : "applications"}
            </Link>
            <span className="text-ink-soft">, {inSets} in overlap. </span>
            {rows.length} {rows.length === 1 ? "person shares" : "people share"} a string.
          </p>
          <PersonBox id="with" label="Talking to" people={rivals} picked={them} onPick={(p) => { set("with", p); setPage(0); }} />
          {withSlug && !them && <p className="serif italic text-ink-soft mb-6">No one named that shares a string with {me.name}.</p>}
          {them && !one && <p className="serif italic text-ink-soft mb-6">No shared string.</p>}
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
                  const strings = one ? <StringList apps={apps} /> : <StringFold apps={apps} />;
                  return (
                    <Fragment key={ps[0].slug}>
                      <tr className="border-t border-rule-faint align-top">
                        <td className="py-2 pr-4">
                          {ps.map((p) => (
                            <Link
                              key={p.slug}
                              href={`${PEOPLE}?q=${encodeURIComponent(p.name)}`}
                              scroll={false}
                              className={`${LINK} block w-max max-w-full font-medium ${them?.slug === p.slug ? "text-gold decoration-gold" : ""}`}
                            >
                              {p.name}
                            </Link>
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
      <p className={`${TAG} text-ink-soft mt-6 leading-5`}>
        Identical strings only, from ICANN&apos;s reveal-day contention sets, 7 Oct 2026. People are those an application names as a director, officer or executive.
      </p>
    </section>
  );
}
