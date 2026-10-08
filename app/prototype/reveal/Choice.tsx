"use client";

import { useEffect, useRef } from "react";

// A native disclosure with site-styled choices. All options remain keyboard
// reachable; no hover or platform select menu is needed.
export default function Choice({ label, value, options, onChange, alignRight = false }: {
  label: string;
  value: string;
  options: readonly { value: string; label: string }[];
  onChange: (value: string) => void;
  alignRight?: boolean;
}) {
  const root = useRef<HTMLDetailsElement>(null);
  const trigger = useRef<HTMLElement>(null);
  useEffect(() => {
    const outside = (event: PointerEvent) => {
      if (root.current && !root.current.contains(event.target as Node)) root.current.open = false;
    };
    document.addEventListener("pointerdown", outside);
    return () => document.removeEventListener("pointerdown", outside);
  }, []);
  const selected = options.find((option) => option.value === value) ?? options[0];
  return (
    <details ref={root} className="relative min-w-0" onKeyDown={(event) => {
      if (event.key === "Escape" && root.current?.open) {
        event.preventDefault();
        root.current.open = false;
        trigger.current?.focus();
      }
    }}>
      <summary ref={trigger} aria-label={`${label}: ${value === "all" ? "All" : selected.label}`} className="list-none [&::-webkit-details-marker]:hidden flex items-center justify-between gap-3 h-10 border border-ink px-3 text-sm cursor-pointer hover:bg-paper-deep focus-visible:outline-2 focus-visible:outline-gold transition-colors duration-200 ease-in-out">
        <span className="truncate">{selected.label}</span><span aria-hidden className="text-[9px]">▾</span>
      </summary>
      <div role="group" aria-label={label} className={`absolute ${alignRight ? "right-0" : "left-0"} top-full mt-1 z-30 border border-ink bg-paper w-max min-w-full max-w-[calc(100vw-3rem)]`}>
        <p className="label !text-[9px] text-ink-soft px-3 pt-3 pb-2">{label}</p>
        {options.map((option) => (
          <button key={option.value} type="button" aria-pressed={value === option.value}
            onClick={() => {
              onChange(option.value);
              if (root.current) root.current.open = false;
              trigger.current?.focus();
            }}
            className={`block text-left w-full px-3 py-2.5 border-t border-rule-faint text-sm cursor-pointer focus-visible:outline-2 focus-visible:outline-gold focus-visible:outline-offset-[-2px] transition-colors duration-200 ease-in-out ${value === option.value ? "bg-ink text-paper" : "hover:bg-paper-deep"}`}>
            {option.label}<span aria-hidden className="float-right ml-6">{value === option.value ? "✓" : ""}</span>
          </button>
        ))}
      </div>
    </details>
  );
}
