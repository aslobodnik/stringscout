import Link from "next/link";
import Tip from "@/components/Tip";
import { pressDelay } from "@/lib/press";
import type { Scope } from "@/lib/search";
import type { UiStats } from "./types";

// Every tile is a way in: two filter the table, one clears it, one leaves for
// the applicants page. The number and the way to see behind it belong in the
// same place.
export function StatTiles({
  s,
  scope,
  clean,
  onAll,
  onScope,
}: {
  s: UiStats;
  scope: Scope;
  clean: boolean; // nothing filtered at all, which is what tile two names
  onAll: () => void;
  onScope: (next: Scope) => void;
}) {
  const cell = "p-3 sm:p-4 text-left w-full";
  const num = "text-2xl sm:text-3xl font-light";
  const cap =
    "label mt-2 text-ink-soft !tracking-[0.08em] !text-[10px] sm:!tracking-[0.18em] sm:!text-[0.6875rem] border-b border-dotted border-rule inline-block";
  const tiles = [
    { v: s.applicants, l: "Applicants", href: "/applicants" },
    {
      v: s.strings,
      l: "Strings disclosed",
      on: clean,
      act: onAll,
      title: "Show every string",
    },
    {
      v: s.contested,
      l: "Overlapping strings",
      on: scope === "overlap",
      accent: true,
      act: () => onScope("overlap"),
    },
    {
      v: s.issues,
      l: "Potential issues",
      on: scope === "issues",
      accent: true,
      act: () => onScope("issues"),
    },
  ];
  return (
    <section className="grid grid-cols-2 sm:grid-cols-4 border border-ink mb-10">
      {tiles.map(({ v, l, on, accent, act, href, title }, i) => {
        const divider = [
          i % 2 === 1 ? "border-l border-rule" : "",
          i > 1 ? "border-t border-rule sm:border-t-0" : "",
          i === 2 ? "sm:border-l sm:border-rule" : "",
        ].join(" ");
        const inner = (
          <>
            {/* shading says which view you are in; oxblood is kept for a
                filter being on, so the default does not load looking filtered */}
            <div
              className={`${num} press-word ${on && accent ? "text-oxblood" : ""}`}
              style={pressDelay(150 + i * 120)}
            >
              {v}
            </div>
            <div className={`${cap} ${on && accent ? "!text-oxblood" : ""}`}>
              {l}
            </div>
          </>
        );
        const tip = title ?? (href ? "See every applicant" : on ? "Show all strings" : `Show only these ${v}`);
        const shell = `group relative ${cell} ${divider} cursor-pointer transition-colors duration-200 ease-in-out focus-visible:outline-2 focus-visible:outline-gold ${
          on ? "bg-paper-deep" : "hover:bg-paper-deep"
        }`;
        if (href)
          return (
            <Link key={l} href={href} className={`${shell} block`}>
              <Tip>{tip}</Tip>
              {inner}
            </Link>
          );
        return (
          <button
            key={l}
            type="button"
            aria-pressed={on}
            aria-label={tip}
            onClick={act}
            className={shell}
          >
            <Tip>{tip}</Tip>
            {inner}
          </button>
        );
      })}
    </section>
  );
}
