"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import plate from "./tailpiece.webp";

// A tailpiece in the printer's sense: the cut at the foot of a chapter. A
// clerk at a wall of screens, each showing a string, engraved the way a
// Victorian history plate was. It sits under the last rows, faint, and
// behind everything.
//
// Reaching the foot turns the lamps up: the plate warms from faint to
// half-strength and each screen takes a gold glow in turn, the desk lamp
// first. Then it settles back to the faint plate it was, and stays there:
// once per page, the first time the plate is a third in view. This is a
// reference page; the plate says hello and gets out of the way. Styles in
// globals.css under "Tailpiece".
//
// Lamp centres as fractions of the plate: the desk lamp, then the nine
// screens row by row.
const LAMPS: [number, number][] = [
  [7, 42],
  [35.6, 16], [59, 16], [82, 16],
  [35.6, 37.6], [59, 37.6], [82, 37.6],
  [34.5, 59], [59, 59], [82.5, 59],
];

// The last lamp is lit at LAMP_STEP_MS * 9 + LAMP_LEAD_MS + the lamp fade;
// HOLD_MS is measured from the moment the plate starts to warm.
const LAMP_LEAD_MS = 500;
const LAMP_STEP_MS = 200;
const HOLD_MS = 5200;

export default function Tailpiece() {
  const ref = useRef<HTMLDivElement>(null);
  const [lit, setLit] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let timer: number | null = null;
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        io.disconnect();
        setLit(true);
        timer = window.setTimeout(() => setLit(false), HOLD_MS);
      },
      { threshold: 0.33 }
    );
    io.observe(el);
    return () => {
      io.disconnect();
      if (timer !== null) window.clearTimeout(timer);
    };
  }, []);
  return (
    <div ref={ref} aria-hidden className={`tailpiece${lit ? " is-lit" : ""}`}>
      <Image src={plate} alt="" unoptimized />
      {LAMPS.map(([x, y], i) => (
        <span
          key={i}
          className={`tailpiece-lamp${i === 0 ? " tailpiece-lamp-desk" : ""}`}
          style={{
            left: `${x}%`,
            top: `${y}%`,
            // staggered on the way up, together on the way down
            transitionDelay: lit ? `${(LAMP_LEAD_MS + i * LAMP_STEP_MS) / 1000}s` : "0s",
          }}
        />
      ))}
    </div>
  );
}
