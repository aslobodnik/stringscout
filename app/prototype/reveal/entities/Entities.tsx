"use client";

// PROTOTYPE, throwaway. Three structurally different takes on the page that
// starts from who applied, switched by ?variant= and the floating bar:
// A Table (one row per group), B Dossiers (one block per group, every
// application listed), C Rivals (which groups meet which, set by set).
//
// A group is entities tied together. Tied by the applicant's own statement
// (declared parent or controller) the tag is soft; tied by something we
// noticed (shared director, shared address) the tag is oxblood and the
// evidence is printed.

import Link from "next/link";
import { Fragment, useState } from "react";
import Tip from "@/components/Tip";
import SectionHead from "@/components/SectionHead";
import PrototypeSwitcher from "@/components/PrototypeSwitcher";
import {
  LINK,
  LINK_LABEL,
  MockTag,
  Replacement,
  StringLink,
  StringList,
  TAG,
  TH,
  evidence,
  inferred,
} from "../bits";
import type { MockData, MockGroup } from "../mock";

const VARIANTS = [
  { key: "A", name: "Table" },
  { key: "B", name: "Dossiers" },
  { key: "C", name: "Rivals" },
];

const NUM = "label !tracking-[0.06em] sm:!tracking-[0.18em] text-ink-soft pb-2 pr-4 font-medium text-right whitespace-nowrap";

// a group worth a row of its own: more than one application or entity
const several = (g: MockGroup) => g.apps.length > 1 || g.entities.length > 1;

const LinkTag = ({ g }: { g: MockGroup }) =>
  g.link ? (
    <span className={`${TAG} ml-2 whitespace-nowrap ${inferred(g.link) ? "text-oxblood" : "text-ink-soft"}`}>{LINK_LABEL[g.link]}</span>
  ) : null;

// The groups it meets in a set, most sets first; hovering names the strings.
function Meets({ g }: { g: MockGroup }) {
  if (!g.rivals.length) return null;
  return (
    <>
      {g.rivals.map((r, i) => (
        <span key={r.slug}>
          {i > 0 && <span className="text-rule"> · </span>}
          <span className="group relative whitespace-nowrap">
            <Tip>{r.tlds.map((t) => `.${t}`).join(" · ")}</Tip>
            <Link href={`#g-${r.slug}`} className={LINK}>
              {r.name}
            </Link>
            <sup className="text-oxblood ml-0.5">{r.tlds.length}</sup>
          </span>
        </span>
      ))}
    </>
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
          <div key={g.slug} id={`g-${g.slug}`} className="flex items-baseline justify-between gap-4 py-1.5 border-b border-rule-faint scroll-mt-4 target:bg-paper-deep">
            <span>
              {g.name}
              <MockTag on={g.entities[0].fixture} />
            </span>
            <StringLink a={g.apps[0]} />
          </div>
        ))}
      </div>
    </>
  );
}

const Legend = () => (
  <p className={`${TAG} text-ink-soft mb-4`}>
    <sup className="text-oxblood">n</sup> applications for the string
  </p>
);

// ---------- A: Table ----------
// One row per group, counts first, strings last. The name opens its entities.

function Table({ d }: { d: MockData }) {
  const [open, setOpen] = useState<string | null>(null);
  const rows = d.groups.filter(several);
  return (
    <section className="mb-14">
      <SectionHead n="I" title="Groups" count={rows.length} />
      <Legend />
      <div className="overflow-x-auto sm:overflow-visible">
        <table className="w-full text-sm border-collapse min-w-[620px]">
          <thead>
            <tr>
              <th className={`${TH} w-80`}>Group</th>
              <th className={`${NUM} w-16`}>Entities</th>
              <th className={`${NUM} w-12`}>Apps</th>
              <th className={`${NUM} w-16`}>In sets</th>
              <th className={`${TH} pl-4 !pr-0`}>Strings</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((g) => (
              <Fragment key={g.slug}>
                <tr id={`g-${g.slug}`} className="border-t border-rule-faint align-top scroll-mt-4 target:bg-paper-deep">
                  <td className="py-2 pr-4">
                    <button
                      type="button"
                      aria-expanded={open === g.slug}
                      onClick={() => setOpen(open === g.slug ? null : g.slug)}
                      className={`${LINK} text-left font-medium`}
                    >
                      {g.name}
                    </button>
                    <LinkTag g={g} />
                  </td>
                  <td className="py-2 pr-4 text-right tabular-nums">{g.entities.length}</td>
                  <td className="py-2 pr-4 text-right tabular-nums">{g.apps.length}</td>
                  <td className="py-2 pr-4 text-right tabular-nums text-oxblood">{g.inSets || ""}</td>
                  <td className="py-2 pl-4 leading-6">
                    <StringList apps={g.apps} />
                  </td>
                </tr>
                {open === g.slug && (
                  <tr className="bg-paper-deep">
                    <td colSpan={5} className="px-3 py-3">
                      {evidence(g) && <p className="serif italic text-ink-soft mb-2">{evidence(g)}</p>}
                      {g.rivals.length > 0 && (
                        <p className="mb-3">
                          <span className="label !text-[10px] text-ink-soft mr-2">Meets</span>
                          <Meets g={g} />
                        </p>
                      )}
                      <div className="grid grid-cols-[minmax(0,14rem)_minmax(0,8rem)_minmax(0,1fr)] gap-x-4 gap-y-1.5">
                        {g.entities.map((e) => (
                          <Fragment key={e.slug}>
                            <span>
                              {e.name}
                              <MockTag on={e.fixture} />
                            </span>
                            <span className="text-ink-soft">{e.jurisdiction}</span>
                            <span>{e.people}</span>
                          </Fragment>
                        ))}
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
      <Singles groups={d.groups} n="II" />
    </section>
  );
}

// ---------- B: Dossiers ----------
// One block per group. Everything is on the page: what ties it, who it meets,
// and each entity's applications with their replacements.

function Dossiers({ d }: { d: MockData }) {
  const rows = d.groups.filter(several);
  return (
    <section className="mb-14">
      <SectionHead n="I" title="Groups" count={rows.length} />
      <Legend />
      {rows.map((g) => (
        <article key={g.slug} id={`g-${g.slug}`} className="border-t border-ink pt-3 mb-10 scroll-mt-4">
          <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
            <h3 className="text-2xl font-light">
              {g.name}
              <LinkTag g={g} />
            </h3>
            <span className="label text-ink-soft">
              {g.entities.length} {g.entities.length === 1 ? "entity" : "entities"}
              <span className="text-rule mx-2">·</span>
              {g.apps.length} applications
              {g.inSets > 0 && (
                <>
                  <span className="text-rule mx-2">·</span>
                  <span className="text-oxblood">{g.inSets} in sets</span>
                </>
              )}
            </span>
          </div>
          {evidence(g) && <p className="serif italic text-ink-soft text-sm mt-1">{evidence(g)}</p>}
          {g.rivals.length > 0 && (
            <p className="text-sm mt-2">
              <span className="label !text-[10px] text-ink-soft mr-2">Meets</span>
              <Meets g={g} />
            </p>
          )}
          <div className="overflow-x-auto sm:overflow-visible mt-4">
            <table className="w-full table-fixed text-sm border-collapse min-w-[620px]">
              <colgroup>
                <col className="w-[26%]" />
                <col />
                <col className="w-36" />
                <col className="w-44" />
              </colgroup>
              <thead>
                <tr>
                  {["Entity", "People", "String", "Replacement"].map((h) => (
                    <th key={h} className={TH}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {g.entities.map((e) =>
                  e.apps.map((a, i) => (
                    <tr key={a.id} className={`align-top ${i ? "" : "border-t border-rule-faint"}`}>
                      <td className={`pr-4 ${i ? "pb-1.5" : "py-1.5"}`}>
                        {i === 0 && (
                          <>
                            {e.name}
                            <MockTag on={e.fixture} />
                          </>
                        )}
                      </td>
                      <td className={`pr-4 text-ink-soft ${i ? "pb-1.5" : "py-1.5"}`}>{i === 0 && e.people}</td>
                      <td className={`pr-4 font-medium ${i ? "pb-1.5" : "py-1.5"}`}>
                        <StringLink a={a} />
                      </td>
                      <td className={i ? "pb-1.5" : "py-1.5"}>
                        <Replacement a={a} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </article>
      ))}
      <Singles groups={d.groups} n="II" />
    </section>
  );
}

// ---------- C: Rivals ----------
// Only the groups in a set, each against each: the number is the sets two
// groups share, the strings are on hover. Read a row to see who a group faces.

function Rivals({ d }: { d: MockData }) {
  const total = (g: MockGroup) => g.rivals.reduce((n, r) => n + r.tlds.length, 0);
  const rows = d.groups.filter((g) => g.rivals.length).sort((x, y) => total(y) - total(x) || x.name.localeCompare(y.name));
  const rest = d.groups.filter((g) => !g.rivals.length);
  return (
    <section className="mb-14">
      <SectionHead n="I" title="Groups in a set" count={rows.length} />
      <p className={`${TAG} text-ink-soft mb-4`}>
        <span className="text-oxblood">n</span> sets two groups share · the column number is the row number
      </p>
      <div className="overflow-x-auto sm:overflow-visible">
        <table className="text-sm border-collapse">
          <thead>
            <tr>
              <th className={`${TH} !pr-2 w-8`} />
              <th className={`${TH} min-w-56`}>Group</th>
              <th className={`${NUM} !pr-6`}>Apps</th>
              {rows.map((_, j) => (
                <th key={j} className="label text-ink-soft pb-2 font-medium w-9 text-center">
                  {j + 1}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((g, i) => (
              <tr key={g.slug} id={`g-${g.slug}`} className="border-t border-rule-faint scroll-mt-4">
                <td className="py-2 pr-2 text-ink-soft tabular-nums">{i + 1}</td>
                <td className="py-2 pr-4 whitespace-nowrap">
                  <span className="font-medium">{g.name}</span>
                  <LinkTag g={g} />
                </td>
                <td className="py-2 pr-6 text-right tabular-nums">{g.apps.length}</td>
                {rows.map((o) => {
                  const r = g.rivals.find((x) => x.slug === o.slug);
                  return (
                    <td
                      key={o.slug}
                      className={`w-9 h-9 text-center border border-rule-faint tabular-nums ${o.slug === g.slug ? "bg-paper-deep" : ""}`}
                    >
                      {r && (
                        <span className="group relative block cursor-default text-oxblood">
                          <Tip side="right">
                            {g.name} and {o.name}: {r.tlds.map((t) => `.${t}`).join(" · ")}
                          </Tip>
                          {r.tlds.length}
                        </span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <SectionHead n="II" title="Not in a set" count={rest.length} className="mt-12" />
      <p className="text-sm leading-7">
        {rest.map((g, i) => (
          <span key={g.slug}>
            {i > 0 && <span className="text-rule"> · </span>}
            <span className="whitespace-nowrap">
              {g.name}
              <sup className="text-ink-soft ml-0.5">{g.apps.length}</sup>
            </span>
          </span>
        ))}
      </p>
      <p className={`${TAG} text-ink-soft mt-3`}>
        <sup>n</sup> applications
      </p>
    </section>
  );
}

// ---------- switch ----------

export default function Entities({ data, initial }: { data: MockData; initial: string }) {
  const [v, setV] = useState(VARIANTS.some((x) => x.key === initial) ? initial : "A");
  return (
    <>
      {v === "A" && <Table d={data} />}
      {v === "B" && <Dossiers d={data} />}
      {v === "C" && <Rivals d={data} />}
      <PrototypeSwitcher variants={VARIANTS} current={v} onChange={setV} />
    </>
  );
}
