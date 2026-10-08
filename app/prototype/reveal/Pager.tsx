"use client";

// Paging for a long list, under its table, flush left: the range in the
// count's label style, then two label buttons in the toolbar-control style
// (ink border, paper-deep on hover). Draws nothing when one page holds all.
// The left and right arrow keys turn pages too, unless the reader is typing
// in a field; the buttons say so.
import { useEffect } from "react";

export const PAGE = 100;

const typing = (t: EventTarget | null) =>
  t instanceof HTMLElement && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName));

export default function Pager({
  total,
  page,
  onPage,
  noun,
}: {
  total: number;
  page: number; // zero-based
  onPage: (page: number) => void;
  noun: string; // "people", "applicants"
}) {
  const pages = Math.ceil(total / PAGE);
  useEffect(() => {
    if (pages <= 1) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey || typing(e.target)) return;
      if (e.key === "ArrowRight" && page < pages - 1) { e.preventDefault(); onPage(page + 1); }
      else if (e.key === "ArrowLeft" && page > 0) { e.preventDefault(); onPage(page - 1); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [page, pages, onPage]);
  if (pages <= 1) return null;
  const from = page * PAGE + 1;
  const to = Math.min(total, (page + 1) * PAGE);
  const button =
    "label h-7 px-2 border border-ink cursor-pointer hover:bg-paper-deep hover:border-gold transition-colors duration-200 ease-in-out focus-visible:outline-2 focus-visible:outline-gold disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:border-ink";
  return (
    <nav aria-label={`${noun} pages`} className="flex flex-wrap items-center gap-3 mt-5">
      {/* below sm the range takes its own line, so the three controls stay together */}
      <span className="label text-ink-soft tabular-nums shrink-0 w-full sm:w-80">
        {from.toLocaleString("en")} to {to.toLocaleString("en")} of {total.toLocaleString("en")}
      </span>
      <button type="button" className={button} aria-keyshortcuts="ArrowLeft" disabled={page === 0} onClick={() => onPage(page - 1)}>
        <span aria-hidden className="mr-1.5">←</span>Previous
      </button>
      <span className="label text-ink-soft tabular-nums">
        {page + 1} / {pages}
      </span>
      <button type="button" className={button} aria-keyshortcuts="ArrowRight" disabled={page >= pages - 1} onClick={() => onPage(page + 1)}>
        Next<span aria-hidden className="ml-1.5">→</span>
      </button>
    </nav>
  );
}
