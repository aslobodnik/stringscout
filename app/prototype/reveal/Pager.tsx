"use client";

// Paging for a long list, under its table, flush left: the range in the
// count's label style, then two label buttons in the toolbar-control style
// (ink border, paper-deep on hover). Draws nothing when one page holds all.
export const PAGE = 100;

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
      <button type="button" className={button} disabled={page === 0} onClick={() => onPage(page - 1)}>
        Previous
      </button>
      <span className="label text-ink-soft tabular-nums">
        {page + 1} / {pages}
      </span>
      <button type="button" className={button} disabled={page >= pages - 1} onClick={() => onPage(page + 1)}>
        Next
      </button>
    </nav>
  );
}
