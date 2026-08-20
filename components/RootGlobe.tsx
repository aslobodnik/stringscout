import { rootZone } from "@/data/rootZone";
import { stringRows } from "@/lib/derive";

// An engraved globe carrying the namespace this site tracks: one dot per
// delegated TLD, placed at coordinates hashed from the string itself, so the
// map is stable across builds. Oxblood dots are the disclosed strings that
// already collide with the root zone. Computed at build time, no script ships.

const TILT = (18 * Math.PI) / 180;
const R = 150;

// FNV-1a. Every string here is an A-label, so char codes are bytes.
function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h;
}

function place(s: string) {
  const h = hash(s);
  const lon = ((h & 0xffff) / 0xffff) * 360 - 180;
  const lat = (Math.asin(((h >>> 16) / 0xffff) * 2 - 1) * 180) / Math.PI;
  const la = (lat * Math.PI) / 180;
  const lo = (lon * Math.PI) / 180;
  const depth =
    Math.sin(TILT) * Math.sin(la) +
    Math.cos(TILT) * Math.cos(la) * Math.cos(lo);
  if (depth <= 0.06) return null; // far side
  return {
    x: R * Math.cos(la) * Math.sin(lo),
    y: -R * (Math.cos(TILT) * Math.sin(la) - Math.sin(TILT) * Math.cos(la) * Math.cos(lo)),
    depth,
  };
}

const round = (n: number) => Math.round(n * 10) / 10;

export default function RootGlobe({ className = "" }: { className?: string }) {
  const flagged = new Set(
    stringRows()
      .filter((r) => r.issues.length)
      .map((r) => r.punycode)
  );

  const dots = rootZone
    .map((tld) => ({ tld, p: place(tld) }))
    .filter((d): d is { tld: string; p: NonNullable<ReturnType<typeof place>> } => d.p !== null);

  return (
    <svg
      viewBox={`${-R - 4} ${-R - 4} ${2 * R + 8} ${2 * R + 8}`}
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      {/* The header is shorter than the sphere, so the bottom is faded out
          rather than sliced flat by the overflow edge. */}
      <defs>
        <linearGradient id="globe-fade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0.26" stopColor="#fff" stopOpacity="1" />
          <stop offset="0.62" stopColor="#fff" stopOpacity="0.45" />
          <stop offset="0.9" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <mask id="globe-mask" maskUnits="userSpaceOnUse" x={-R - 4} y={-R - 4} width={2 * R + 8} height={2 * R + 8}>
          <rect x={-R - 4} y={-R - 4} width={2 * R + 8} height={2 * R + 8} fill="url(#globe-fade)" />
        </mask>
      </defs>
      <g mask="url(#globe-mask)">
      {/* meridians, one in gold */}
      {[1, 2, 3, 4, 5, 6, 7].map((i) => {
        const rx = Math.abs(R * Math.cos((Math.PI * i) / 8));
        if (rx < 0.6) return null;
        const gold = i === 5;
        return (
          <ellipse
            key={`lon-${i}`}
            cx="0"
            cy="0"
            rx={round(rx)}
            ry={R}
            fill="none"
            stroke={gold ? "var(--gold)" : "var(--ink)"}
            strokeWidth={gold ? 1.1 : 0.8}
            opacity={gold ? 0.22 : 0.13}
            transform="rotate(-18)"
          />
        );
      })}

      {/* parallels */}
      {[-60, -30, 0, 30, 60].map((lat) => {
        const la = (lat * Math.PI) / 180;
        const rx = R * Math.cos(la);
        return (
          <ellipse
            key={`lat-${lat}`}
            cx="0"
            cy={round(-R * Math.sin(la) * Math.cos(TILT))}
            rx={round(rx)}
            ry={round(Math.abs(rx * Math.sin(TILT)))}
            fill="none"
            stroke="var(--ink)"
            strokeWidth="0.7"
            opacity="0.12"
          />
        );
      })}

      <circle
        cx="0"
        cy="0"
        r={R}
        fill="none"
        stroke="var(--ink)"
        strokeWidth="1"
        opacity="0.16"
      />

      {/* the root zone */}
      {dots.map(({ tld, p }) => (
        <circle
          key={tld}
          cx={round(p.x)}
          cy={round(p.y)}
          r={p.depth > 0.5 ? 0.9 : 0.7}
          fill="var(--ink)"
          opacity={round(0.08 + 0.14 * p.depth)}
        />
      ))}

      {/* disclosed strings that collide with it */}
      {dots
        .filter(({ tld }) => flagged.has(tld))
        .map(({ tld, p }) => (
          <circle
            key={`f-${tld}`}
            cx={round(p.x)}
            cy={round(p.y)}
            r="2.4"
            fill="var(--oxblood)"
            opacity="0.45"
          />
        ))}
      </g>
    </svg>
  );
}
