import { pressDelay } from "@/lib/press";

// A ledger tally, one stroke per applicant, counted the way a tally is: four
// uprights and a fifth struck across them, so six reads as a gate and one
// rather than six strokes to count. Strokes ink in one after another from
// `delay`, the gate's stroke last, as a hand would make it.
export function Tally({ count, delay }: { count: number; delay: number }) {
  return (
    <span aria-hidden className="inline-flex items-baseline gap-2">
      {Array.from({ length: Math.ceil(count / 5) }, (_, g) => {
        const n = Math.min(5, count - g * 5);
        const at = (i: number) => pressDelay(delay + (g * 5 + i) * 55);
        return (
          <span key={g} className="relative inline-flex items-baseline gap-[3px]">
            {Array.from({ length: Math.min(n, 4) }, (_, i) => (
              <i key={i} className="inline-block w-px h-3.5 bg-oxblood tally-ink" style={at(i)} />
            ))}
            {/* the rotation sits on a wrapper: the ink-in animates transform */}
            {n === 5 && (
              <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rotate-[55deg]">
                <i className="block w-px h-[22px] bg-oxblood tally-ink" style={at(4)} />
              </span>
            )}
          </span>
        );
      })}
    </span>
  );
}
