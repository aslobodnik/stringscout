import Link from "next/link";
import { round } from "@/data/round";
import { sourceById, sourceIndex } from "@/data/sources";
import { roundShares } from "@/lib/derive";
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

// A printer's rule turned gauge: the disclosed count set against ICANN's
// figure, filled applicant by applicant, largest first, with the small ones
// gathered into one block at the end. Whether a disclosed string is
// primary or replacement is not drawn: the rule says who has disclosed how
// much, against the round. Set straight under the count tiles, full width.
export default function RoundRule() {
  const shares = roundShares();
  const src = sourceById.get(round.sourceId);
  const n = sourceIndex.get(round.sourceId);
  const named = shares.filter((s) => s.count >= MIN_NAMED).slice(0, SCREENS.length);
  const rest = shares.slice(named.length);
  const others = rest.reduce((sum, s) => sum + s.count, 0);
  const blocks = [
    ...named.map((s, i) => ({
      key: s.slug,
      label: s.name,
      count: s.count,
      tone: SCREENS[i],
    })),
    ...(others
      ? [{ key: "others", label: "Others", count: others, tone: OTHERS }]
      : []),
  ];
  const disclosed = blocks.reduce((sum, b) => sum + b.count, 0);
  const at = (units: number) => `${(units / round.received) * 100}%`;
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
  const summary = `${fmt(disclosed)} disclosed of ${fmt(round.received)}+ applications: ${blocks
    .map((b) => `${b.label} ${fmt(b.count)}`)
    .join(", ")}.`;

  return (
    <div className="-mt-5 mb-10">
      {/* ICANN's own figure with its cite, then how much of it is self-revealed:
          the caption the gauge is read against */}
      <p className="serif italic text-base text-ink">
        ICANN received more than {fmt(round.received)} applications.
        {src && n !== undefined && (
          <sup className="src ml-0.5 text-[9px] not-italic">
            <Link href={`/sources#src-${n}`} title={`${src.outlet} · ${formatDate(src.date)}`}>
              {n}
            </Link>
          </sup>
        )}{" "}
        {fmt(disclosed)} have been self-revealed.
      </p>
      <div role="img" aria-label={summary} className="relative mt-3 h-8 border border-rule">
        {placed.map((b, i) => (
          <div
            key={b.key}
            title={`${b.label} · ${fmt(b.count)}`}
            className={`absolute inset-y-0 box-border ${b.tone} ${i ? "border-l border-paper" : ""}`}
            style={{ left: b.left, width: b.width }}
          />
        ))}
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
          count the way the table binds a row to its tally */}
      <ul className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-2">
        {blocks.map((b) => (
          <li key={b.key} className="flex items-baseline gap-2">
            <span aria-hidden="true" className={`inline-block h-2.5 w-3.5 shrink-0 self-start mt-[3px] ${b.tone}`} />
            <span className="label text-ink-soft">{b.label}</span>
            <span aria-hidden className="flex-1 min-w-4 -translate-y-[3px] border-b border-dotted border-rule-faint" />
            <span className="label text-ink tabular-nums">{fmt(b.count)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
