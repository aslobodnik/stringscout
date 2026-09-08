"use client";

import Link from "next/link";
import Tip from "@/components/Tip";
import { formatDate } from "@/lib/format";

const fmt = (n: number) => n.toLocaleString("en-US");

// An applicant with fewer units than this has no room to be a block of its
// own on the rule, so it joins the "others" block at the end.
const MIN_NAMED = 20;

// The engraver's screens, in rank order: a block is told by its cut, never by
// a shade. Solid for the largest, then the hatches, the crosshatch and the
// dot screen. More named applicants than screens, and the smallest join the
// others block rather than a screen being reused. Others has a cut of its
// own, rings, so it reads as a block and not as the empty track.
const SCREENS = ["bg-ink", "ink-hatch", "ink-hatch-back", "ink-cross", "ink-dots"];
const OTHERS = "ink-rings";

export type RoundShare = { slug: string; name: string; count: number };
export type RoundData = {
  received: number; // ICANN's figure, "more than"
  shares: RoundShare[]; // largest first
  cite?: { n: number; outlet: string; date: string };
};

// A printer's rule turned gauge: the disclosed count set against ICANN's
// figure, filled applicant by applicant, largest first, with the small ones
// gathered into one block at the end. Whether a disclosed string is
// primary or replacement is not drawn: the rule says who has disclosed how
// much, against the round. Set straight under the count tiles, full width.
// A named block is a filter on the table below, the same as an applicant's
// name in a row; the others block is many applicants, so it only tells.
export default function RoundRule({
  round,
  active,
  onPick,
}: {
  round: RoundData;
  active: string; // applicant name filtering the table, or "all"
  onPick: (name: string) => void;
}) {
  const { received, shares, cite } = round;
  const named = shares.filter((s) => s.count >= MIN_NAMED).slice(0, SCREENS.length);
  const rest = shares.slice(named.length);
  const others = rest.reduce((sum, s) => sum + s.count, 0);
  const blocks = [
    ...named.map((s, i) => ({
      key: s.slug,
      label: s.name,
      count: s.count,
      tone: SCREENS[i],
      pick: true,
    })),
    ...(others
      ? [{ key: "others", label: "Others", count: others, tone: OTHERS, pick: false }]
      : []),
  ];
  const disclosed = blocks.reduce((sum, b) => sum + b.count, 0);
  // The void named: the share of ICANN's figure nobody has disclosed. Whole
  // percent, and no floor mark, since the axis and caption already carry it.
  const undisclosed = Math.round(((received - disclosed) / received) * 100);
  const at = (units: number) => `${(units / received) * 100}%`;
  let left = 0;
  const placed = blocks.map((b) => {
    const block = { ...b, left: at(left), width: at(b.count) };
    left += b.count;
    return block;
  });
  const ticks = Array.from({ length: 17 }, (_, i) => ({
    at: `${i * 6.25}%`,
    major: i % 4 === 0,
    value: i * 100,
  }));
  const summary = `${fmt(disclosed)} disclosed of ${fmt(received)}+ applications: ${blocks
    .map((b) => `${b.label} ${fmt(b.count)}`)
    .join(", ")}. ${undisclosed}% undisclosed.`;
  const filtering = active !== "all";
  // with one applicant picked, the rest of the rule steps back
  const dim = (label: string) => (filtering && active !== label ? "opacity-30" : "");

  return (
    <div className="-mt-5 mb-10">
      {/* ICANN's own figure with its cite, then how much of it is self-revealed:
          the caption the gauge is read against */}
      <p className="serif italic text-base text-ink">
        ICANN received more than {fmt(received)} applications.
        {cite && (
          <sup className="group relative src ml-0.5 text-[9px] not-italic">
            <Tip>
              {cite.outlet} · {formatDate(cite.date)}
            </Tip>
            <Link href={`/sources#src-${cite.n}`}>{cite.n}</Link>
          </sup>
        )}{" "}
        {fmt(disclosed)} have been self-revealed.
      </p>
      <div role="group" aria-label={summary} className="relative mt-3 h-8 border border-rule">
        {placed.map((b, i) => {
          const cls = `group absolute inset-y-0 box-border ${b.tone} ${
            i ? "border-l border-paper" : ""
          } ${dim(b.label)} transition-opacity duration-300 ease-in-out`;
          const tip = (
            <Tip>
              {b.label} · {fmt(b.count)}
            </Tip>
          );
          return b.pick ? (
            <button
              key={b.key}
              type="button"
              aria-pressed={active === b.label}
              aria-label={`${b.label}, ${fmt(b.count)}`}
              onClick={() => onPick(b.label)}
              className={`${cls} cursor-pointer focus-visible:outline-2 focus-visible:outline-gold`}
              style={{ left: b.left, width: b.width }}
            >
              {tip}
            </button>
          ) : (
            <div key={b.key} className={cls} style={{ left: b.left, width: b.width }}>
              {tip}
            </div>
          );
        })}
        {/* centred in the empty track, in oxblood; too tight on phones,
            where it would run into the rings */}
        <span
          aria-hidden="true"
          className="label !text-[10px] text-oxblood absolute inset-y-0 right-0 hidden sm:flex items-center justify-center"
          style={{ left: at(disclosed) }}
        >
          {undisclosed}% undisclosed
        </span>
      </div>
      {/* the graduations, every hundred, numbered every four hundred */}
      <div aria-hidden="true" className="relative h-6">
        {ticks.map((t, i) => (
          <span key={t.value}>
            <span
              className={`absolute top-0 w-px ${t.major ? "h-1.5 bg-ink" : "h-[3px] bg-rule"}`}
              style={{ left: t.at }}
            />
            {t.major && (
              <span
                className={`label !text-[10px] text-ink-soft absolute top-[9px] ${
                  i === 0 ? "" : i === 16 ? "-translate-x-full" : "-translate-x-1/2"
                }`}
                style={{ left: t.at }}
              >
                {i === 16 ? `${fmt(t.value)}+` : fmt(t.value)}
              </span>
            )}
          </span>
        ))}
      </div>
      {/* the blocks in the order they are drawn, set as a ledger: one column
          on phones, two from sm, a dot leader binding each name to its
          count the way the table binds a row to its tally. A name is the
          same filter as its block. */}
      <ul className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-2">
        {blocks.map((b) => (
          <li key={b.key} className={`flex items-baseline gap-2 ${dim(b.label)} transition-opacity duration-300 ease-in-out`}>
            <span aria-hidden="true" className={`inline-block h-2.5 w-3.5 shrink-0 self-start mt-[3px] ${b.tone}`} />
            {b.pick ? (
              <button
                type="button"
                aria-pressed={active === b.label}
                onClick={() => onPick(b.label)}
                className={`label cursor-pointer text-left border-b border-dotted border-transparent hover:border-gold transition-colors duration-200 ease-in-out ${
                  active === b.label ? "text-gold" : "text-ink-soft"
                }`}
              >
                {b.label}
              </button>
            ) : (
              <span className="label text-ink-soft">{b.label}</span>
            )}
            <span aria-hidden className="flex-1 min-w-4 -translate-y-[3px] border-b border-dotted border-rule-faint" />
            <span className="label text-ink tabular-nums">{fmt(b.count)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
