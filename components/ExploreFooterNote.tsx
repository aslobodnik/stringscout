"use client";

import { usePathname } from "next/navigation";

export default function ExploreFooterNote({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  return usePathname() === "/explore" ? children : fallback;
}
