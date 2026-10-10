"use client";

// A column head that sorts its table. A second click on the active column
// turns the direction; a first click on another column takes that column's
// own default (counts run most first). Arrow in gold when active.
export type Sort<K extends string> = { key: K; dir: 1 | -1 };
// dir: the column's first direction (counts run most first); short: the head
// below sm
export type SortCol<K extends string> = { key: K; label: string; short?: string; dir?: -1 };

type Props<K extends string> = {
  col: SortCol<K>;
  sort: Sort<K>;
  onSort: (s: Sort<K>) => void;
};

// The head cell, saying which way the table is sorted to assistive tech.
export function SortHead<K extends string>({
  thClassName,
  className,
  ...p
}: Props<K> & { thClassName: string; className?: string }) {
  const active = p.sort.key === p.col.key;
  return (
    <th
      aria-sort={active ? (p.sort.dir === 1 ? "ascending" : "descending") : undefined}
      className={thClassName}
    >
      <SortButton {...p} className={className} />
    </th>
  );
}

export default function SortButton<K extends string>({
  col,
  sort,
  onSort,
  className = "label",
}: Props<K> & { className?: string }) {
  const active = sort.key === col.key;
  return (
    <button
      type="button"
      onClick={() =>
        onSort(
          active
            ? { key: col.key, dir: sort.dir === 1 ? -1 : 1 }
            : { key: col.key, dir: col.dir ?? 1 }
        )
      }
      className={`${className} cursor-pointer focus-visible:outline-2 focus-visible:outline-gold transition-colors duration-200 ease-in-out ${
        active ? "text-ink" : "text-ink-soft hover:text-ink"
      }`}
    >
      {col.short ? (
        <>
          <span className="hidden sm:inline">{col.label}</span>
          <span className="sm:hidden">{col.short}</span>
        </>
      ) : (
        col.label
      )}
      <span
        aria-hidden
        className={`text-[8px] ml-1.5 transition-colors duration-200 ease-in-out ${
          active ? "text-gold" : "text-rule"
        }`}
      >
        {active && sort.dir === -1 ? "▼" : "▲"}
      </span>
    </button>
  );
}
