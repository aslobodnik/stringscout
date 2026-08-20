// Register marks at the trim, the way a printed sheet carries them. Fixed to
// the viewport, behind everything, no data claim of any kind — texture that
// says "printed" without competing with the table for attention.

const CORNERS = [
  { v: "top-3", h: "left-3", rot: "" },
  { v: "top-3", h: "right-3", rot: "" },
  { v: "bottom-3", h: "left-3", rot: "" },
  { v: "bottom-3", h: "right-3", rot: "" },
];

export default function Marginalia() {
  return (
    <div className="marginalia" aria-hidden>
      {CORNERS.map((c, i) => (
        <svg
          key={i}
          viewBox="0 0 20 20"
          className={`absolute ${c.v} ${c.h} w-4 h-4 opacity-30`}
        >
          <path
            d="M0 10 H7 M13 10 H20 M10 0 V7 M10 13 V20"
            stroke="var(--ink)"
            strokeWidth="0.9"
            fill="none"
          />
          <circle
            cx="10"
            cy="10"
            r="4.5"
            stroke="var(--ink)"
            strokeWidth="0.6"
            fill="none"
          />
        </svg>
      ))}
    </div>
  );
}
