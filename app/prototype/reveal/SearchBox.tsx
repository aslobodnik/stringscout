"use client";

// The search box the applicants and people pages share: the strings page's
// box (Variants.tsx) copied, without its column choice. Suggestions under the
// box name what each one is; picking one fills the box. Under the box, flush
// left, the count in a slot the width of the box, then a chip that clears it.
// Arriving with ?q=Name, the box is filled once mounted, so a link lands on
// the rows it means without turning the page into a client-only render.
import { useEffect, useState } from "react";
import Tip from "@/components/Tip";
import { suggest, type NameList, type Suggestion } from "./search";

export const INPUT =
  "border border-ink bg-transparent px-3 h-10 text-base sm:text-sm w-full placeholder:text-ink-soft focus:border-gold focus:outline-none transition-colors duration-200 ease-in-out";

export function Chip({ label, onClear }: { label: string; onClear: () => void }) {
  return (
    <button
      type="button"
      onClick={onClear}
      aria-label={`Clear the ${label.toLowerCase()} filter`}
      className="group relative label !text-[10px] border border-oxblood text-oxblood px-2 h-7 cursor-pointer hover:bg-oxblood hover:text-paper transition-colors duration-200 ease-in-out flex items-center gap-2"
    >
      <Tip>Clear the {label.toLowerCase()} filter</Tip>
      <span className="normal-case tracking-normal text-xs">{label}</span>
      <span aria-hidden className="text-[11px] leading-none">
        ×
      </span>
    </button>
  );
}

export default function SearchBox({
  value,
  onChange,
  names,
  count,
  ariaLabel,
  id,
}: {
  value: string;
  onChange: (q: string) => void;
  names: NameList[];
  count: string; // "12 applicants"
  ariaLabel: string;
  id: string; // ties the box to its listbox
}) {
  const [cursor, setCursor] = useState(-1);
  const [suggesting, setSuggesting] = useState(false);
  useEffect(() => {
    const q0 = new URLSearchParams(window.location.search).get("q");
    if (!q0) return;
    queueMicrotask(() => onChange(q0));
    // a link into a search lands on the box and its rows, not the page head;
    // a frame later, after the router's own scroll to the top of the new page
    requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView({ block: "start" }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const suggestions = suggesting ? suggest(value, names) : [];
  const pick = (sg: Suggestion) => {
    onChange(sg.kind === "string" ? `.${sg.text}` : sg.text);
    setSuggesting(false);
    setCursor(-1);
  };
  return (
    <div id={id} className="mb-5 scroll-mt-6">
      <div className="relative w-full sm:w-80">
        <input
          type="search"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setSuggesting(true);
            setCursor(-1);
          }}
          onFocus={() => setSuggesting(true)}
          onBlur={() => setTimeout(() => setSuggesting(false), 150)}
          onKeyDown={(e) => {
            if (!suggestions.length) return;
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setCursor((c) => (c + 1) % suggestions.length);
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setCursor((c) => (c <= 0 ? suggestions.length - 1 : c - 1));
            } else if (e.key === "Enter" && cursor >= 0) {
              e.preventDefault();
              pick(suggestions[cursor]);
            } else if (e.key === "Escape") {
              setSuggesting(false);
            }
          }}
          placeholder="Search…"
          aria-label={ariaLabel}
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={suggestions.length > 0}
          aria-controls={`${id}-suggestions`}
          className={INPUT}
        />
        {suggestions.length > 0 && (
          <ul
            id={`${id}-suggestions`}
            role="listbox"
            className="absolute left-0 right-0 top-full mt-1 z-30 border border-ink bg-paper text-sm"
          >
            {suggestions.map((sg, i) => (
              <li key={`${sg.kind}|${sg.text}`} role="option" aria-selected={i === cursor}>
                <button
                  type="button"
                  tabIndex={-1}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => pick(sg)}
                  onMouseEnter={() => setCursor(i)}
                  className={`group relative flex items-baseline justify-between gap-4 w-full text-left px-3 py-2 cursor-pointer border-t border-rule-faint first:border-t-0 transition-colors duration-200 ease-in-out ${
                    i === cursor ? "bg-paper-deep" : ""
                  }`}
                >
                  {sg.text.length > 36 && <Tip>{sg.kind === "string" ? `.${sg.text}` : sg.text}</Tip>}
                  <span className="truncate">{sg.kind === "string" ? `.${sg.text}` : sg.text}</span>
                  <span className="label !text-[9px] text-ink-soft shrink-0">{sg.kind}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-3 mt-3 min-h-7">
        <span className="label text-ink-soft tabular-nums shrink-0 sm:w-80">{count}</span>
        {value.trim() && <Chip label={value.trim()} onClear={() => onChange("")} />}
      </div>
    </div>
  );
}
