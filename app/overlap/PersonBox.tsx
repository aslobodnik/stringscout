"use client";

// The people search box, picking a person rather than filling text: the
// shared SearchBox copied, suggestions naming the person's first entity on
// the right so two people at different companies tell apart. Picking one
// hands back the person; clearing hands back null.
import { useState } from "react";
import { INPUT, Chip } from "@/app/prototype/reveal/SearchBox";
import { suggestPeople } from "@/lib/overlap";
import type { MockPerson } from "@/app/prototype/reveal/mock";

export default function PersonBox({
  id,
  label,
  people,
  picked,
  onPick,
  autoFocus,
}: {
  id: string;
  label: string; // "I am", "Talking to"
  people: MockPerson[];
  picked: MockPerson | null;
  onPick: (p: MockPerson | null) => void;
  autoFocus?: boolean;
}) {
  const [q, setQ] = useState("");
  const [cursor, setCursor] = useState(-1);
  const [suggesting, setSuggesting] = useState(false);
  const suggestions = suggesting && !picked ? suggestPeople(q, people) : [];
  const pick = (p: MockPerson) => {
    onPick(p);
    setQ("");
    setSuggesting(false);
    setCursor(-1);
    (document.activeElement as HTMLElement | null)?.blur(); // the phone keyboard goes
  };
  return (
    <div id={id} className="mb-5 scroll-mt-6">
      <div className="flex items-baseline gap-3">
        <span className="label text-ink-soft shrink-0 w-24 whitespace-nowrap">{label}</span>
        {picked ? (
          <Chip label={picked.name} onClear={() => onPick(null)} />
        ) : (
          <div className="relative w-full sm:w-80">
            <input
              type="search"
              value={q}
              autoFocus={autoFocus}
              onChange={(e) => {
                setQ(e.target.value);
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
                } else if (e.key === "Enter") {
                  e.preventDefault();
                  pick(suggestions[Math.max(0, cursor)]);
                } else if (e.key === "Escape") {
                  setSuggesting(false);
                }
              }}
              placeholder="Name or company…"
              aria-label={`${label}: search people by name or company`}
              role="combobox"
              aria-autocomplete="list"
              aria-expanded={suggestions.length > 0}
              aria-controls={`${id}-suggestions`}
              className={INPUT}
            />
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
                      className={`flex flex-col w-full text-left px-3 py-2 cursor-pointer border-t border-rule-faint first:border-t-0 transition-colors duration-200 ease-in-out ${
                        i === cursor ? "bg-paper-deep" : ""
                      }`}
                    >
                      <span>{p.name}</span>
                      <span className="text-xs text-ink-soft">
                        {p.entities[0].name}
                        {p.entities.length > 1 && ` and ${p.entities.length - 1} more`}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
