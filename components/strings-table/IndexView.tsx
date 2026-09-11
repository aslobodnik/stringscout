import { useLayoutEffect, useRef } from "react";
import { TIP_BOX } from "@/components/Tip";
import { ISSUE_TIP } from "./IssueTag";
import type { UiStringRow } from "./types";

function IndexEntry({
  r,
  onJump,
}: {
  r: UiStringRow;
  onJump: (tld: string) => void;
}) {
  // no P/U/I here: at index density the boxes read as noise, and the click
  // opens the table row that carries them. The gloss and the issues sit in
  // the same tip the table draws, over the entry; a dotted rule under a
  // glossed string says there is one, as it does in the table.
  const issues = r.issues.map((i) => ISSUE_TIP[i.kind]).join(" · ");
  return (
    <li className="break-inside-avoid row-press">
      <button
        type="button"
        onClick={() => onJump(r.tld)}
        className="group relative block w-full text-left py-[3px] cursor-pointer hover:text-gold transition-colors duration-200 ease-in-out"
      >
        <span className="block truncate">
          <span
            className={
              r.gloss
                ? "border-b border-dotted border-ink-soft group-hover:border-gold transition-colors duration-200 ease-in-out"
                : undefined
            }
          >
            <span className="text-gold">.</span>
            {r.tld}
          </span>
          {r.overlap && (
            <sup className="ml-0.5 text-[9px] text-oxblood">{r.count}</sup>
          )}
          {r.issues.length > 0 && (
            <sup className="ml-0.5 text-[9px] text-oxblood">†</sup>
          )}
        </span>
        {(r.gloss || issues) && (
          <span role="tooltip" className={`${TIP_BOX} left-0`}>
            {r.gloss && <span className="serif italic">“{r.gloss}”</span>}
            {r.gloss && issues && " · "}
            {issues}
          </span>
        )}
      </button>
    </li>
  );
}

// Every string on one page, always A–Z: an index is looked up, not sorted.
// Columns flow down before across, so the alphabet still reads top-to-bottom
// the way it does in a book index; a grid would lay it out in rows and scatter
// it.
export function IndexView({
  rows,
  onJump,
}: {
  rows: UiStringRow[];
  onJump: (tld: string) => void;
}) {
  // The entries flow down each column, so staggering by list position fills
  // column one before the others exist. Stagger by the visual row instead,
  // measured after layout and before paint, at the table's own pace: 22ms a
  // row, everything past the first 23 rows together. Arithmetic on rows per
  // column drifts, since the browser balances the columns a row unevenly.
  const list = useRef<HTMLUListElement>(null);
  useLayoutEffect(() => {
    const ul = list.current;
    if (!ul) return;
    const top = ul.getBoundingClientRect().top;
    const items = [...ul.children] as HTMLElement[];
    const tops = items.map((li) => li.getBoundingClientRect().top - top);
    const rowHeight = Math.max(1, ...tops.slice(0, 2).map((t, i) => (i ? t - tops[0] : 0)));
    items.forEach((li, i) => {
      const row = Math.round(tops[i] / rowHeight);
      li.style.setProperty("--press-delay", `${Math.min(row * 22, 500)}ms`);
    });
  }, [rows]);
  return (
    <ul ref={list} className="columns-2 sm:columns-3 md:columns-4 lg:columns-5 gap-6 text-sm">
      {rows.map((r) => (
        <IndexEntry key={r.tld} r={r} onJump={onJump} />
      ))}
    </ul>
  );
}
