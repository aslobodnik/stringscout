import { pressDelay } from "@/lib/press";

// A ledger tally, one stroke per applicant, counted the way a tally is: four
// uprights and a fifth struck across them, so six reads as a gate and one.
//
// Ruled straight: every upright is the same clean vertical and the gate is one
// straight diagonal.
//
// Each stroke is an applicant, in the order the row names them. Hover a
// stroke and its applicant lights, and the other way round (globals.css,
// "Tally").

const H = 14; // stroke height, px
const PITCH = 4; // upright to upright
const GROUP = 3 * PITCH + 9; // gate to gate

export function Tally({ count, delay }: { count: number; delay: number }) {
  const strokes: { d: string; gate: boolean }[] = [];
  for (let i = 0; i < count; i++) {
    const x0 = Math.floor(i / 5) * GROUP + 1;
    if (i % 5 === 4) {
      // the gate: struck low-left to high-right across the four, overrunning both
      strokes.push({ d: `M${x0 - 3} ${H - 2.5} L${x0 + 3 * PITCH + 3} 2.5`, gate: true });
    } else {
      const x = x0 + (i % 5) * PITCH;
      strokes.push({ d: `M${x} 1 L${x} ${H - 1}`, gate: false });
    }
  }
  const last = count - 1;
  const width = Math.floor(last / 5) * GROUP + (last % 5 === 4 ? 3 * PITCH + 5 : (last % 5) * PITCH + 2);

  return (
    <svg
      aria-hidden
      className="tally inline-block overflow-visible align-[-2px]"
      width={width}
      height={H}
      viewBox={`0 0 ${width} ${H}`}
    >
      {strokes.map((s, i) => (
        <g key={i} data-stroke={i} className="tally-stroke">
          {/* the reach: a 1px stroke is too fine to find with a mouse */}
          <path d={s.d} className="tally-reach" />
          <path
            d={s.d}
            pathLength={1}
            className={`tally-ink-line ${s.gate ? "tally-gate" : ""}`}
            style={pressDelay(delay + i * 55)}
          />
        </g>
      ))}
    </svg>
  );
}
