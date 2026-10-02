"use client";

import { useEffect } from "react";

// PROTOTYPE, throwaway. Floating bar that cycles ?variant= on a prototype
// route. Never rendered in a production build.
export default function PrototypeSwitcher({
  variants,
  current,
  onChange,
}: {
  variants: { key: string; name: string }[];
  current: string;
  onChange: (key: string) => void;
}) {
  const i = Math.max(0, variants.findIndex((v) => v.key === current));
  const go = (d: number) => {
    const next = variants[(i + d + variants.length) % variants.length].key;
    const u = new URL(window.location.href);
    u.searchParams.set("variant", next);
    history.replaceState(history.state, "", u);
    onChange(next);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      if (e.key === "ArrowLeft") go(-1);
      if (e.key === "ArrowRight") go(1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  if (process.env.NODE_ENV === "production") return null;
  const v = variants[i];
  const btn =
    "px-3 h-9 cursor-pointer hover:bg-white/15 transition-colors duration-200 ease-in-out";
  return (
    <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 flex items-center bg-black text-white text-xs font-mono shadow-[4px_4px_0_rgba(0,0,0,0.35)]">
      <button type="button" aria-label="Previous variant" onClick={() => go(-1)} className={btn}>
        ←
      </button>
      <span className="px-3 h-9 flex items-center border-x border-white/25 whitespace-nowrap">
        {v.key} ({v.name}) · {i + 1}/{variants.length}
      </span>
      <button type="button" aria-label="Next variant" onClick={() => go(1)} className={btn}>
        →
      </button>
    </div>
  );
}
