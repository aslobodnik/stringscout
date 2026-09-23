"use client";

import Tip from "@/components/Tip";
import { pressDelay } from "@/lib/press";
import { Cite } from "./strings-table/Cite";
import type { Citations } from "./strings-table/types";

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
  received: number; // ICANN's figure: applications proceeding, fee paid
  shares: RoundShare[]; // largest first
  sourceId: string; // the source of ICANN's figure
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
  cites,
  active,
  onPick,
}: {
  round: RoundData;
  cites: Citations;
  active: string; // applicant name filtering the table, or "all"
  onPick: (name: string) => void;
}) {
  const { received, shares, sourceId } = round;
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
    const block = { ...b, left: at(left), width: at(b.count), leftOf: left };
    left += b.count;
    return block;
  });
  // every hundred to 1,500, numbered every four hundred, then ICANN's figure
  // closes the axis. A graduation is inked as far as the disclosure reaches
  // and faint beyond it, and each knows the block it sits under, so the
  // scale can answer a block. The reading, disclosed, is set in oxblood
  // after the fixed graduations; a fixed figure it would run into yields.
  const under = (units: number) => {
    let sum = 0;
    for (let i = 0; i < blocks.length; i++) {
      sum += blocks[i].count;
      if (units < sum) return i;
    }
    return -1;
  };
  // a fixed figure the reading would run into yields: within 7% of the
  // axis always, within 12% only on phones, where the figures sit closer
  const near = (units: number) => {
    const gap = Math.abs(units - disclosed) / received;
    return gap < 0.07 ? "hidden" : gap < 0.12 ? "hidden sm:block" : "block";
  };
  const ticks = [
    ...Array.from({ length: 16 }, (_, i) => ({
      value: i * 100,
      at: at(i * 100),
      major: i % 4 === 0,
      last: false,
      reached: i * 100 <= disclosed,
      under: under(i * 100),
      numbered: i % 4 === 0 ? near(i * 100) : "",
    })),
    {
      value: received,
      at: at(received),
      major: true,
      last: true,
      reached: disclosed >= received,
      under: -1,
      numbered: near(received),
    },
  ];
  const reading = disclosed > 0 && disclosed < received;
  // the scale is scribed in left to right, the reading struck last
  const scribe = (i: number) => pressDelay(i * 20);
  const summary = `${fmt(disclosed)} disclosed of ${fmt(received)} applications: ${blocks
    .map((b) => `${b.label} ${fmt(b.count)}`)
    .join(", ")}. ${undisclosed}% undisclosed.`;
  const filtering = active !== "all";
  // with one applicant picked, the rest of the rule steps back
  const dim = (label: string) => (filtering && active !== label ? "opacity-30" : "");

  return (
    <div className="rule -mt-5 mb-10">
      {/* ICANN's own figure with its cite, then how much of it is self-revealed:
          the caption the gauge is read against */}
      <p className="serif italic text-base text-ink">
        ICANN confirmed {fmt(received)} applications proceeding.
        <Cite ids={[sourceId]} cites={cites} />{" "}
        {fmt(disclosed)} have been self-revealed.
      </p>
      <div role="group" aria-label={summary} className="relative mt-3 h-8 border border-rule">
        {placed.map((b, i) => {
          const cls = `group absolute inset-y-0 box-border ${i ? "border-l border-paper" : ""}`;
          const idx = { "data-block": i };
          // the screen dims on its own layer: opacity on the block would take
          // the tip down with it and the caption above would read through.
          // A block past the midpoint hangs its tip from its right edge.
          const { leftOf } = b;
          const tip = (
            <>
              <span
                aria-hidden="true"
                className={`absolute inset-0 ${b.tone} ${dim(b.label)} transition-opacity duration-300 ease-in-out`}
              />
              <Tip side={leftOf < received / 2 ? "left" : "right"}>
                {b.label} · {fmt(b.count)}
              </Tip>
            </>
          );
          return b.pick ? (
            <button
              key={b.key}
              type="button"
              aria-pressed={active === b.label}
              aria-label={`${b.label}, ${fmt(b.count)}`}
              onClick={() => onPick(b.label)}
              {...idx}
              className={`${cls} cursor-pointer focus-visible:outline-2 focus-visible:outline-gold`}
              style={{ left: b.left, width: b.width }}
            >
              {tip}
            </button>
          ) : (
            <div key={b.key} {...idx} className={cls} style={{ left: b.left, width: b.width }}>
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
      {/* the graduations, the figure last, flush with the frame */}
      <div aria-hidden="true" className="relative h-6">
        {ticks.map((t, i) => (
          <span key={t.value}>
            <span
              data-under={t.under >= 0 ? t.under : undefined}
              data-active={t.under >= 0 && active === blocks[t.under].label ? "" : undefined}
              className={`rule-tick absolute top-0 w-px transition-[background-color,height] duration-300 ease-in-out ${
                t.major ? "h-1.5" : "h-[3px]"
              } ${t.reached ? "bg-ink" : "bg-rule"}`}
              style={{ left: t.last ? `calc(${t.at} - 1px)` : t.at, ...scribe(i) }}
            />
            {t.numbered && (
              <span
                className={`absolute top-[9px] ${t.numbered} ${
                  i === 0 ? "" : t.last ? "-translate-x-full" : "-translate-x-1/2"
                }`}
                style={{ left: t.at }}
              >
                <span className="press-word label !text-[10px] text-ink-soft block" style={scribe(i)}>
                  {fmt(t.value)}
                </span>
              </span>
            )}
          </span>
        ))}
        {/* the reading: the disclosed count, struck a hair below the
            graduations, its figure in oxblood among the fixed ones */}
        {reading && (
          <>
            <span
              className="rule-tick absolute top-0 w-px h-2 bg-oxblood"
              style={{ left: at(disclosed), ...scribe(ticks.length + 6) }}
            />
            <span className="absolute top-[9px] -translate-x-1/2" style={{ left: at(disclosed) }}>
              <span
                className="press-word label !text-[10px] text-oxblood block"
                style={scribe(ticks.length + 6)}
              >
                {fmt(disclosed)}
              </span>
            </span>
          </>
        )}
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
