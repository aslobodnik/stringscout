"use client";

// A box that picks one thing rather than filling text: the shared SearchBox
// copied, without a label of its own; the page labels it. A suggestion
// carries a line under the name (a person's entities, a company's entity or
// string count, an entity's parent) so two people at different companies
// tell apart, and names
// its kind on the right when the list mixes kinds. The list may run wider
// than the box; a box at the right of a row opens it
// leftward so it stays on screen. Picking one hands back the pick; clearing
// hands back null. The box never leaves: a picked name sits in it with the
// border gold, the house mark for the active pick, and an × at its end
// clears it. Typing over the name starts a new search, so nothing on the
// page moves when a pick is made or cleared.
import { useRef, useState } from "react";
import { INPUT } from "@/app/prototype/reveal/SearchBox";
import { suggestPicks, type Pick } from "@/lib/overlap";

export default function PickBox({
  id,
  label,
  picks,
  picked,
  onPick,
  autoFocus,
  alignRight = false,
}: {
  id: string;
  label?: string; // "Talking to"; none for the first box. Read out, not printed: the page labels the box.
  picks: Pick[];
  picked: Pick | null;
  onPick: (p: Pick | null) => void;
  autoFocus?: boolean;
  alignRight?: boolean; // open the list leftward from the box's right edge
}) {
  const [q, setQ] = useState("");
  const [cursor, setCursor] = useState(-1);
  const [suggesting, setSuggesting] = useState(false);
  const box = useRef<HTMLInputElement>(null);
  const suggestions = suggesting && !picked ? suggestPicks(q, picks) : [];
  const nothing = suggesting && !picked && q.trim().length >= 2 && suggestions.length === 0;
  const mixed = picks.some((p) => p.kind === "company");
  const drop = `absolute ${alignRight ? "right-0" : "left-0"} top-full mt-1 z-30 border border-ink bg-paper text-sm w-max min-w-full max-w-[min(24rem,calc(100vw-3rem))]`;
  const pick = (p: Pick) => {
    onPick(p);
    setQ("");
    setSuggesting(false);
    setCursor(-1);
    (document.activeElement as HTMLElement | null)?.blur(); // the phone keyboard goes
  };
  return (
    <div id={id} className="relative">
      <input
        ref={box}
        id={`${id}-input`}
        type="search"
        value={picked ? picked.name : q}
        autoFocus={autoFocus}
        onChange={(e) => {
          // typing over a pick is a new search: only what was typed, wherever
          // the caret sat in the name (a phone tap leaves it there)
          const v = e.target.value;
          if (picked) onPick(null);
          setQ(picked && v.includes(picked.name) ? v.replace(picked.name, "") : v);
          setSuggesting(true);
          setCursor(-1);
        }}
        onFocus={(e) => {
          setSuggesting(true);
          if (!picked) return;
          // select the name once the tap has placed its caret, or iOS keeps the caret
          const el = e.target;
          setTimeout(() => el.setSelectionRange(0, el.value.length), 0);
        }}
        onBlur={() => setTimeout(() => setSuggesting(false), 150)}
        onKeyDown={(e) => {
          // a search field clears itself on Escape, which would drop the pick
          if (e.key === "Escape") {
            e.preventDefault();
            setSuggesting(false);
            return;
          }
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
          }
        }}
        placeholder={label ? "Person or company…" : "Your name…"}
        aria-label={`${label ?? "You"}: search people by name or company`}
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={suggestions.length > 0}
        aria-controls={suggestions.length ? `${id}-suggestions` : undefined}
        aria-activedescendant={suggestions.length && cursor >= 0 ? `${id}-opt-${cursor}` : undefined}
        className={`${INPUT} pr-9 text-ellipsis [&::-webkit-search-cancel-button]:hidden ${picked ? "border-gold font-medium" : ""}`}
      />
      {picked && (
        <button
          type="button"
          onClick={() => {
            onPick(null);
            box.current?.focus();
          }}
          aria-label={`Clear ${picked.name}`}
          className="absolute right-0 top-0 h-10 w-9 cursor-pointer text-ink-soft hover:text-oxblood transition-colors duration-200 ease-in-out focus-visible:outline-2 focus-visible:outline-gold"
        >
          ×
        </button>
      )}
      {nothing && (
        <p role="status" className={`${drop} px-3 py-2 serif italic text-ink-soft`}>
          No one by that name.
        </p>
      )}
      {suggestions.length > 0 && (
        <ul id={`${id}-suggestions`} role="listbox" className={drop}>
          {suggestions.map((p, i) => (
            <li key={p.slug} id={`${id}-opt-${i}`} role="option" aria-selected={i === cursor}>
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
  );
}
