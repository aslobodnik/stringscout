// An emblem, not a data map. The previous globe hashed each string into a
// lat/lon and drew the result, which looked like plotted data and encoded
// nothing. Meridians and parallels claim nothing at all, which is the honest
// version of the same picture: a namespace that is global.
//
// The spin is real rotation, not a transform: each meridian is an ellipse
// whose rx cycles from full width to flat and back, staggered so the set
// reads as one turning sphere. It holds at 96s, slow enough to register as
// drift rather than motion, and stops dead under prefers-reduced-motion.

const R = 46;
const MERIDIANS = 7;
const PARALLELS = [-30, -15, 0, 15, 30];

export default function Globe({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={`globe ${className}`}
      aria-hidden
      focusable="false"
    >
      <circle cx="50" cy="50" r={R} className="globe-line" />
      {PARALLELS.map((lat) => {
        const y = 50 + (lat / 90) * R;
        const ry = Math.max(1.5, R * 0.16 * Math.cos((lat * Math.PI) / 180));
        const rx = Math.sqrt(Math.max(0, R * R - (y - 50) * (y - 50)));
        return (
          <ellipse
            key={lat}
            cx="50"
            cy={y}
            rx={rx}
            ry={ry}
            className="globe-line"
          />
        );
      })}
      {Array.from({ length: MERIDIANS }, (_, i) => (
        <ellipse
          key={i}
          cx="50"
          cy="50"
          rx={R}
          ry={R}
          className="globe-line globe-meridian"
          style={{ animationDelay: `${(-96 * i) / MERIDIANS}s` }}
        />
      ))}
    </svg>
  );
}
