import type { CSSProperties } from "react";
import { pressDelay } from "@/lib/press";

// A ledger tally, one stroke per applicant, counted the way a tally is: four
// uprights and a fifth struck across them, so six reads as a gate and one.
//
// Ruled by hand, not by machine: each stroke leans, bows and takes the ink a
// little differently. The hand is seeded by the string, so a row's tally is
// the same on every render and on the server, and no two rows share one.
//
// Each stroke is an applicant, in the order the row names them. Hover a
// stroke and its applicant lights, and the other way round (globals.css,
// "Tally").

const H = 14; // stroke height, px
const PITCH = 4; // upright to upright
const GROUP = 3 * PITCH + 9; // gate to gate

// mulberry32: small, fast, deterministic
function hand(seed: string) {
  let a = [...seed].reduce((h, c) => Math.imul(h ^ c.charCodeAt(0), 2654435761), 7) >>> 0;
  return (spread: number) => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    const r = ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    return (r * 2 - 1) * spread;
  };
}

const f = (n: number) => n.toFixed(2);

export function Tally({
  count,
  delay,
  seed,
}: {
  count: number;
  delay: number;
  seed: string;
}) {
  const j = hand(seed);
  const strokes: { d: string; ink: number; gate: boolean }[] = [];
  for (let i = 0; i < count; i++) {
    const g = Math.floor(i / 5);
    const x0 = g * GROUP + 1;
    if (i % 5 === 4) {
      // the gate: struck low-left to high-right across the four, overrunning both
      const y0 = H - 2.5 + j(0.8);
      const y1 = 2.5 + j(0.8);
      const x1 = x0 + 3 * PITCH + 3 + j(0.6);
      const xs = x0 - 3 + j(0.6);
      strokes.push({
        d: `M${f(xs)} ${f(y0)} Q${f((xs + x1) / 2 + j(0.8))} ${f((y0 + y1) / 2 + 0.8)} ${f(x1)} ${f(y1)}`,
        ink: 0.82 + j(0.08),
        gate: true,
      });
    } else {
      const x = x0 + (i % 5) * PITCH;
      const top = 0.8 + Math.abs(j(0.7));
      const bot = H - 0.6 + j(0.5);
      const lean = j(0.6);
      strokes.push({
        d: `M${f(x + lean + j(0.3))} ${f(top)} Q${f(x + j(0.7))} ${f(H / 2)} ${f(x - lean + j(0.3))} ${f(bot)}`,
        ink: 0.9 + j(0.1),
        gate: false,
      });
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
            style={{ ...pressDelay(delay + i * 55), "--tally-ink": s.ink } as CSSProperties}
          />
        </g>
      ))}
    </svg>
  );
}
