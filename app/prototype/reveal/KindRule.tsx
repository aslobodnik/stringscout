"use client";

// A copy of components/RoundRule.tsx cut down for one question: of the
// strings revealed, how many did applicants designate brand, community or
// geo, ask to keep closed, or leave open. The rule is always full, since every
// string is one of the five, so there is no void to name. Each block is a
// filter on the table below; the legend under the axis is the same filter
// at a size a finger can hit, since the small blocks are slivers.
import Tip from "@/components/Tip";
import { pressDelay } from "@/lib/press";

const fmt = (n: number) => n.toLocaleString("en-US");

// the engraver's screens, in the order the blocks sit: solid for open, then
// the hatches, the crosshatch and the dot screen
const SCREENS = ["bg-ink", "ink-hatch", "ink-hatch-back", "ink-cross", "ink-dots"];

export type KindShare = { key: string; label: string; count: number };

export default function KindRule({
  shares,
  active,
  onPick,
}: {
  shares: KindShare[]; // in display order
  active: string; // key filtering the table, or "all"
  onPick: (key: string) => void;
}) {
  const total = shares.reduce((sum, s) => sum + s.count, 0);
  const at = (units: number) => `${(units / total) * 100}%`;
  const starts = shares.reduce<number[]>((acc, s) => [...acc, acc[acc.length - 1] + s.count], [0]);
  const blocks = shares.map((s, i) => ({
    ...s,
    tone: SCREENS[i % SCREENS.length],
    left: at(starts[i]),
    width: at(s.count),
    leftOf: starts[i],
  }));
  // a graduation every hundred, numbered every two hundred, the total closing
  // the axis; a figure the total would run into yields
  const step = 100;
  const n = Math.floor(total / step);
  const ticks = [
    ...Array.from({ length: n + 1 }, (_, i) => ({
      value: i * step,
      at: at(i * step),
      major: i % 2 === 0,
      last: false,
      numbered: i % 2 === 0 && (total - i * step) / total > 0.07,
    })),
    { value: total, at: at(total), major: true, last: true, numbered: true },
  ];
  const scribe = (i: number) => pressDelay(i * 20);
  const filtering = active !== "all";
  const dim = (key: string) => (filtering && active !== key ? "opacity-30" : "");
  const summary = `${fmt(total)} strings: ${shares.map((s) => `${s.label} ${fmt(s.count)}`).join(", ")}.`;

  return (
    <div className="rule mb-8 sm:mb-10">
      <div role="group" aria-label={summary} className="relative h-8 border border-rule">
        {blocks.map((b, i) => (
          <button
            key={b.key}
            type="button"
            aria-pressed={active === b.key}
            aria-label={`${b.label}, ${fmt(b.count)}`}
            onClick={() => onPick(b.key)}
            className={`group absolute inset-y-0 box-border cursor-pointer focus-visible:outline-2 focus-visible:outline-gold ${
              i ? "border-l border-paper" : ""
            }`}
            style={{ left: b.left, width: b.width }}
          >
            {/* the screen dims on its own layer so the tip stays legible */}
            <span
              aria-hidden="true"
              className={`absolute inset-0 ${b.tone} ${dim(b.key)} transition-opacity duration-300 ease-in-out`}
            />
            <Tip side={b.leftOf < total / 2 ? "left" : "right"}>
              {b.label} · {fmt(b.count)}
            </Tip>
          </button>
        ))}
      </div>
      {/* the graduations, the total last, flush with the frame */}
      <div aria-hidden="true" className="relative h-6">
        {ticks.map((t, i) => (
          <span key={t.value}>
            <span
              className={`absolute top-0 w-px bg-ink ${t.major ? "h-1.5" : "h-[3px]"}`}
              style={{ left: t.last ? `calc(${t.at} - 1px)` : t.at, ...scribe(i) }}
            />
            {t.numbered && (
              <span
                className={`absolute top-[9px] ${i === 0 ? "" : t.last ? "-translate-x-full" : "-translate-x-1/2"}`}
                style={{ left: t.at }}
              >
                <span className="press-word label !text-[10px] text-ink-soft block" style={scribe(i)}>
                  {fmt(t.value)}
                </span>
              </span>
            )}
          </span>
        ))}
      </div>
      {/* the legend: swatch, name, count; each the same filter as its block.
          Two columns on phones, with the counts set against the right edge of
          each column so they align; one row from sm. */}
      <div className="grid grid-cols-2 gap-x-6 gap-y-2 mt-1 sm:flex sm:flex-wrap">
        {blocks.map((b, i) => {
          const on = active === b.key;
          return (
            <button
              key={b.key}
              type="button"
              aria-pressed={on}
              onClick={() => onPick(b.key)}
              className={`group flex sm:inline-flex items-baseline gap-2 cursor-pointer focus-visible:outline-2 focus-visible:outline-gold transition-opacity duration-300 ease-in-out ${dim(
                b.key
              )}`}
            >
              <span aria-hidden="true" className={`inline-block w-3 h-3 translate-y-px border border-rule shrink-0 ${b.tone}`} />
              <span
                className={`label !text-[10px] border-b border-dotted border-rule group-hover:border-gold transition-colors duration-200 ease-in-out ${
                  on ? "!text-oxblood" : "text-ink-soft"
                }`}
              >
                {b.label}
              </span>
              <span className={`text-sm press-word ml-auto sm:ml-0 ${on ? "text-oxblood" : ""}`} style={pressDelay(400 + i * 80)}>
                {fmt(b.count)}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
