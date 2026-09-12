"use client";

import { useEffect, useSyncExternalStore } from "react";
import { subscribeToUrl } from "@/lib/url";

// A cite in the table links to /sources#src-N. That is a client-side
// navigation, so the browser never applies :target to the row; this reads the
// hash instead and marks the row itself. Styles in globals.css under
// "Source mark". Renders nothing.
const hash = () => window.location.hash;

export default function SourceMark() {
  const h = useSyncExternalStore(subscribeToUrl, hash, () => "");
  useEffect(() => {
    if (!h) return;
    const el = document.getElementById(h.slice(1));
    if (!el) return;
    el.classList.add("is-target");
    return () => el.classList.remove("is-target");
  }, [h]);
  return null;
}
