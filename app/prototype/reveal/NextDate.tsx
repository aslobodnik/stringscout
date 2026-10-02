"use client";

// PROTOTYPE placeholder: the next date in the round with a plain ticking
// countdown; when it passes, the one after takes its place. The finished one
// is meant to be animated; this only holds its place.
import { useSyncExternalStore } from "react";

const DATES = [
  { at: "2026-10-21T23:59:00Z", l: "Replacement Period closes", d: "21 Oct, 23:59 UTC" },
  { at: "2026-11-17T00:00:00Z", l: "String Confirmation", d: "17 Nov" },
  { at: "2026-11-27T23:59:00Z", l: "65% refund ends", d: "27 Nov" },
];

const tick = (onChange: () => void) => {
  const id = setInterval(onChange, 1000);
  return () => clearInterval(id);
};
const now = () => Math.floor(Date.now() / 1000);
const two = (n: number) => String(n).padStart(2, "0");

export default function NextDate() {
  // null on the server and the first paint, so the prerender carries no clock
  const t = useSyncExternalStore<number | null>(tick, now, () => null);
  const i = t === null ? 0 : DATES.findIndex((x) => Date.parse(x.at) / 1000 > t);
  if (i < 0) return null;
  const next = DATES[i];
  const left = t === null ? null : Date.parse(next.at) / 1000 - t;
  const parts: [string, string][] =
    left === null
      ? []
      : [
          [String(Math.floor(left / 86400)), "d"],
          [two(Math.floor(left / 3600) % 24), "h"],
          [two(Math.floor(left / 60) % 60), "m"],
          [two(left % 60), "s"],
        ];
  return (
    <div className="mt-5">
      <div className="border-l-2 border-oxblood pl-3">
        <div className="label !text-[10px] text-oxblood">Next · {next.l}</div>
        <div className="mt-1 flex flex-wrap items-baseline gap-x-4">
          <span className="text-sm">{next.d}</span>
          <span className="flex items-baseline gap-2 tabular-nums min-h-7" aria-live="off">
            {parts.map(([v, u]) => (
              <span key={u}>
                <span className="text-xl font-light">{v}</span>
                <span className="label !text-[10px] text-ink-soft ml-0.5">{u}</span>
              </span>
            ))}
          </span>
        </div>
      </div>
    </div>
  );
}
