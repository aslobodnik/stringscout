"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";

// /withdrawn is kept for the record, not promoted in the navigation.
const NAV = [
  { href: "/", label: "Strings" },
  { href: "/explore", label: "Explore" },
  { href: "/applicants", label: "Applicants" },
  { href: "/sources", label: "Sources" },
];

export default function SiteNav({ current }: { current: string }) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    const dismiss = (event: PointerEvent) => {
      if (event.target instanceof Node && !root.current?.contains(event.target)) setOpen(false);
    };
    const desktop = window.matchMedia("(min-width: 640px)");
    const resized = () => { if (desktop.matches) setOpen(false); };
    document.addEventListener("pointerdown", dismiss);
    desktop.addEventListener("change", resized);
    return () => {
      document.removeEventListener("pointerdown", dismiss);
      desktop.removeEventListener("change", resized);
    };
  }, [open]);

  return (
    <div
      ref={root}
      className="relative flex items-center"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape" && open) {
          event.preventDefault();
          event.stopPropagation();
          setOpen(false);
          toggle.current?.focus();
        }
      }}
    >
      <button
        ref={toggle}
        type="button"
        aria-label={open ? "Close navigation" : "Open navigation"}
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen(!open)}
        className="flex h-11 w-11 cursor-pointer items-center justify-center border border-transparent text-ink transition-colors duration-200 ease-in-out hover:border-rule hover:bg-paper-deep hover:text-gold focus-visible:outline-2 focus-visible:outline-gold motion-reduce:transition-none sm:hidden"
      >
        <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d={open ? "M6 6l12 12M6 18L18 6" : "M4 6h16M4 12h16M4 18h16"} />
        </svg>
      </button>
      <nav
        id={menuId}
        aria-label="Site"
        className={`absolute right-0 top-full z-30 mt-2 w-52 border border-rule bg-paper p-2 transition-[opacity,transform,visibility] duration-200 ease-in-out motion-reduce:transition-none sm:visible sm:static sm:mt-0 sm:flex sm:w-auto sm:translate-y-0 sm:border-0 sm:bg-transparent sm:p-0 sm:opacity-100 ${open ? "visible translate-y-0 opacity-100" : "invisible -translate-y-1 opacity-0"}`}
      >
        {NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            aria-current={item.href === current ? "page" : undefined}
            onClick={() => setOpen(false)}
            className={`label flex min-h-11 items-center border-l-2 px-3 py-3 transition-colors duration-200 ease-in-out focus-visible:outline-2 focus-visible:outline-gold motion-reduce:transition-none sm:-mb-px sm:border-b-2 sm:border-l-0 ${item.href === current ? "border-gold bg-paper-deep text-ink sm:border-ink sm:bg-transparent" : "border-transparent text-ink-soft hover:bg-paper-deep hover:text-oxblood sm:hover:bg-transparent"}`}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
