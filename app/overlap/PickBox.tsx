"use client";

// A box that picks one thing rather than filling text: the shared SearchBox
// copied. A suggestion carries a line under the name (a person's entities,
// a company's people count) so two people at different companies tell
// apart, and names its kind on the right when the list mixes kinds. Picking
// one hands back the pick; clearing hands back null. The box never leaves:
// a picked name sits in it with the border gold, the house mark for the
// active pick, and an × at its end clears it. Typing over the name starts
// a new search, so nothing on the page moves when a pick is made or cleared.
import { useState } from "react";
import { INPUT } from "@/app/prototype/reveal/SearchBox";
import { suggestPicks, type Pick } from "@/lib/overlap";

export default function PickBox({
  id,
  label,
  picks,
  picked,
  onPick,
  autoFocus,
}: {
  id: string;
  label?: string; // "Talking to"; none for the first box
  picks: Pick[];
  picked: Pick | null;
  onPick: (p: Pick | null) => void;
  autoFocus?: boolean;
}) {
  const [q, setQ] = useState("");
  const [cursor, setCursor] = useState(-1);
  const [suggesting, setSuggesting] = useState(false);
  const suggestions = suggesting && !picked ? suggestPicks(q, picks) : [];
  const mixed = picks.some((p) => p.kind === "company");
  const pick = (p: Pick) => {
    onPick(p);
    setQ("");
    setSuggesting(false);
    setCursor(-1);
    (document.activeElement as HTMLElement | null)?.blur(); // the phone keyboard goes
  };
  return (
    <div id={id} className="mb-5 scroll-mt-6">
      <div className="flex items-baseline gap-3">
        {label && <span className="label text-ink-soft shrink-0 w-24 whitespace-nowrap">{label}</span>}
        <div className="relative w-full sm:w-[30rem]">
          <input
            type="search"
            value={picked ? picked.name : q}
            autoFocus={autoFocus}
            onChange={(e) => {
              if (picked) onPick(null);
              setQ(e.target.value);
              setSuggesting(true);
              setCursor(-1);
            }}
            onFocus={(e) => {
              setSuggesting(true);
              if (picked) e.target.select();
            }}
            onBlur={() => setTimeout(() => setSuggesting(false), 150)}
            onKeyDown={(e) => {
              if (!suggestions.length) return;
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setCursor((c) => (c + 1) % suggestions.length);
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setCursor((c) => (c <= 0 ? suggestions.length - 1 : c - 1));
              } else if (e.key === "Enter") {
                e.preventDefault();
                pick(suggestions[Math.max(0, cursor)]);
              } else if (e.key === "Escape") {
                setSuggesting(false);
              }
            }}
            placeholder={label ? "Person or company…" : "Your name…"}
            aria-label={`${label ?? "You"}: search people by name or company`}
            role="combobox"
            aria-autocomplete="list"
            aria-expanded={suggestions.length > 0}
            aria-controls={`${id}-suggestions`}
            className={`${INPUT} pr-9 [&::-webkit-search-cancel-button]:hidden ${picked ? "border-gold font-medium" : ""}`}
          />
          {picked && (
            <button
              type="button"
              onClick={() => onPick(null)}
              aria-label={`Clear ${picked.name}`}
              className="absolute right-0 top-0 h-10 w-9 cursor-pointer text-ink-soft hover:text-oxblood transition-colors duration-200 ease-in-out focus-visible:outline-2 focus-visible:outline-gold"
            >
              ×
            </button>
          )}
          {suggestions.length > 0 && (
            <ul id={`${id}-suggestions`} role="listbox" className="absolute left-0 right-0 top-full mt-1 z-30 border border-ink bg-paper text-sm">
              {suggestions.map((p, i) => (
                <li key={p.slug} role="option" aria-selected={i === cursor}>
                  <button
                    type="button"
                    tabIndex={-1}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => pick(p)}
                    onMouseEnter={() => setCursor(i)}
                    className={`flex items-baseline justify-between gap-4 w-full text-left px-3 py-2 cursor-pointer border-t border-rule-faint first:border-t-0 transition-colors duration-200 ease-in-out ${
                      i === cursor ? "bg-paper-deep" : ""
                    }`}
                  >
                    <span className="min-w-0">
                      <span className="block truncate">{p.name}</span>
                      <span className="block text-xs text-ink-soft truncate">{p.sub}</span>
                    </span>
                    {mixed && <span className="label !text-[9px] text-ink-soft shrink-0">{p.kind}</span>}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
