// PROTOTYPE, throwaway. Pieces the strings view and the entities view share.
"use client";

import Link from "next/link";
import { useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Tld from "@/components/Tld";
import Tip from "@/components/Tip";
import type { Link as GroupLink, MockApp, MockGroup } from "./mock";

export const STRINGS = "/";
export const ENTITIES = "/applicants";
export const PEOPLE = "/people";

export const TAG = "label !text-[9px]";
export const LINK =
  "cursor-pointer underline decoration-rule underline-offset-2 hover:decoration-gold transition-colors duration-200 ease-in-out focus-visible:outline-2 focus-visible:outline-gold";
export const TH = "label !tracking-[0.06em] sm:!tracking-[0.18em] text-ink-soft pb-2 pr-4 font-medium whitespace-nowrap text-left";
export const DASH = <span className="text-ink-soft">—</span>;

// The strings page, filtered to one column and name. A parent is searched
// as a parent, an entity as an applicant, a person as a person, so the link
// always lands.
export const stringsFor = (by: "applicant" | "parent" | "person", name: string) =>
  `${STRINGS}?by=${by}&q=${encodeURIComponent(name)}`;

// A small arrow beside a name that opens the strings page filtered to it.
export function ToStrings({ by, name }: { by: "applicant" | "parent"; name: string }) {
  return (
    <span className="group relative inline-block ml-1.5 align-baseline">
      <Tip>Strings {by === "parent" ? "under" : "by"} {name}</Tip>
      <Link
        href={stringsFor(by, name)}
        scroll={false}
        aria-label={`Strings ${by === "parent" ? "under" : "by"} ${name}`}
        className="inline-block px-0.5 text-[11px] text-ink-soft hover:text-gold transition-colors duration-200 ease-in-out focus-visible:outline-2 focus-visible:outline-gold"
      >
        ↗
      </Link>
    </span>
  );
}

// the AGB questions that name people rather than companies
export const PERSON_ROLES = new Set(["Directors", "Officers & partners", "Executive responsibility"]);
export const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

export const LINK_LABEL: Record<GroupLink, string> = {
  parent: "declared parent",
  control: "declared controller",
  person: "shared director",
  address: "shared address",
};
// the first two are the applicant's own statement; the rest we inferred
export const inferred = (l: GroupLink | null) => l === "person" || l === "address";

const HOW = { applied: "applied for by", named: "also named by" };

// A `group relative` wrapper whose tip is built on first hover and kept.
// Sixteen hundred lines each carrying a tip full of names is what made typing
// feel frozen; built on demand, the table carries no tip until asked.
export function Hover({ tip, className = "", children }: { tip: () => ReactNode; className?: string; children: ReactNode }) {
  const [hot, setHot] = useState(false);
  return (
    <span className={`group relative ${className}`} onMouseEnter={() => setHot(true)} onFocus={() => setHot(true)}>
      {hot && tip()}
      {children}
    </span>
  );
}

// An application's replacement. Knocked out, it is struck through and carries
// the number of applications that knock it out; hovering names them. None
// named prints the dash /applicants uses for an empty count.
export function Replacement({ a }: { a: MockApp }) {
  if (!a.replacement) return DASH;
  const n = a.blockers.length;
  return (
    <span className="inline-flex flex-wrap items-baseline gap-x-2">
      <Hover
        className={n ? "cursor-default" : ""}
        tip={() =>
          n > 0 && (
            <Tip>
              {a.blockers.map((b) => (
                <span key={b.how + b.name} className="block">
                  <span className="serif italic text-ink-soft">{HOW[b.how]}</span> {b.name}
                </span>
              ))}
            </Tip>
          )
        }
      >
        <span className={n ? "line-through decoration-oxblood text-ink-soft" : ""}>
          <Shown a={{ tld: a.replacement, uLabel: a.replacementU }} />
        </span>
        {n > 0 && <sup className="text-oxblood ml-0.5">{n}</sup>}
      </Hover>
      {a.near && <span className={`${TAG} text-oxblood`}>{a.near}</span>}
    </span>
  );
}

export const MockTag = ({ on }: { on: boolean }) =>
  on ? <span className={`${TAG} text-ink-soft ml-2`}>mock</span> : null;

// A string that links to its row in the strings view; one with rivals carries
// the number of applications for it, as the homepage index does.
// A string in contention is set in oxblood with its count, as the issue
// states are everywhere else; one alone stays in ink.
// An IDN prints as its U-label; the A-label the record keys it by follows
// small, so the punycode is still there to copy.
export function Shown({ a }: { a: { tld: string; uLabel?: string } }) {
  return (
    <>
      <Tld>{a.uLabel ?? a.tld}</Tld>
      {a.uLabel && <span className={`${TAG} text-ink-soft ml-1.5 !normal-case !tracking-normal`}>{a.tld}</span>}
    </>
  );
}

// A string anywhere links to the strings page searched for it, as the
// applicant and parent links do, rather than to a row anchor.
export function StringLink({ a }: { a: MockApp }) {
  return (
    <Link
      href={`${STRINGS}?by=string&q=${encodeURIComponent(`.${a.uLabel ?? a.tld}`)}`}
      scroll={false}
      className={`whitespace-nowrap hover:text-gold transition-colors duration-200 ease-in-out ${a.setSize > 1 ? "text-oxblood font-medium" : ""}`}
    >
      <Shown a={a} />
      {a.setSize > 1 && <sup className="ml-0.5">{a.setSize}</sup>}
    </Link>
  );
}

// The strings three lines deep, then "all n" which opens the rest in place
// as columns; "fewer" folds them back. The fold only offers itself when the
// three lines are not enough, which is measured, not guessed. `pin` brings
// the strings a search matched to the front, so a hit is never behind the fold.
export function StringFold({ apps: given, pin }: { apps: MockApp[]; pin?: (a: MockApp) => boolean }) {
  const apps = useMemo(() => (pin ? [...given.filter(pin), ...given.filter((a) => !pin(a))] : given), [given, pin]);
  const [open, setOpen] = useState(false);
  const [clipped, setClipped] = useState(false);
  const box = useRef<HTMLSpanElement>(null);
  useLayoutEffect(() => {
    const el = box.current;
    if (!el || open) return;
    setClipped(el.scrollHeight > el.clientHeight + 1);
  }, [apps, open]);
  const toggle = (clipped || open) && (
    <button
      type="button"
      aria-expanded={open}
      onClick={() => setOpen(!open)}
      className="block cursor-pointer text-ink-soft whitespace-nowrap hover:text-gold transition-colors duration-200 ease-in-out focus-visible:outline-2 focus-visible:outline-gold"
    >
      {open ? "fewer" : `all ${apps.length}`}
    </button>
  );
  if (open)
    return (
      <>
        <span className="grid grid-cols-[repeat(auto-fill,minmax(6.5rem,1fr))] gap-x-3">
          {apps.map((a) => (
            <span key={a.id}>
              <StringLink a={a} />
            </span>
          ))}
        </span>
        {toggle}
      </>
    );
  return (
    <>
      <span ref={box} className="line-clamp-3">
        <StringList apps={apps} />
      </span>
      {toggle}
    </>
  );
}

// The strings in a line. The separator stays with the string before it, so
// no line opens on a dot; `tail` keeps one after the last for what follows.
export function StringList({ apps, tail = false }: { apps: MockApp[]; tail?: boolean }) {
  return (
    <>
      {apps.map((a, i) => (
        <span key={a.id}>
          <span className="whitespace-nowrap">
            <StringLink a={a} />
            {(i < apps.length - 1 || tail) && <span className="text-rule"> ·</span>}
          </span>{" "}
        </span>
      ))}
    </>
  );
}

// What the group rests on, as one plain sentence.
export function evidence(g: MockGroup): string | null {
  if (g.link === "parent") return `Each entity declares ${g.evidence} as its parent.`;
  if (g.link === "control") return `Each entity declares ${g.evidence} as its controller.`;
  if (g.link === "person") return `The entities name the same director, ${g.evidence}.`;
  if (g.link === "address") return `The entities give the same business address, ${g.evidence}.`;
  return null;
}
