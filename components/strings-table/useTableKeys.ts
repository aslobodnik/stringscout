import { useEffect } from "react";
import { isMac } from "./ShortcutSheet";

// Keys, for the reader who has them: / and Cmd-K (Ctrl-K elsewhere) reach
// the search box from anywhere on the page, Esc clears everything from
// anywhere, the arrows turn the page, and ? lists all of it. Nothing else
// fires while a box is being typed in, and nothing fires under a held
// modifier, so the browser keeps its own keys. Nothing is drawn for any of
// it: the sheet is the only place they are named.
export function useTableKeys(k: {
  sheet: boolean;
  setSheet: (open: boolean) => void;
  focusSearch: () => void;
  dirty: boolean; // anything Esc would clear
  clear: () => void;
  paged: boolean;
  page: number;
  pageCount: number;
  turnPage: (p: number) => void;
}) {
  // bound afresh each render, so the handler reads the page it is on
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.isComposing || e.keyCode === 229) return;
      const t = e.target as HTMLElement | null;
      const typing =
        !!t && (/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) || t.isContentEditable);
      const mod = isMac() ? e.metaKey : e.ctrlKey;
      // once the dialog has let the page go
      const closeThenSearch = () => {
        k.setSheet(false);
        setTimeout(k.focusSearch, 0);
      };
      if (mod && !e.altKey && !e.shiftKey && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (k.sheet) closeThenSearch();
        else k.focusSearch();
        return;
      }
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (k.sheet) {
        if (e.key === "Escape" || e.key === "?") {
          e.preventDefault();
          k.setSheet(false);
        } else if (e.key === "/") {
          e.preventDefault();
          closeThenSearch();
        }
        return;
      }
      if (e.key === "Escape") {
        // one clear, wherever the reader is: the box, every filter, an open
        // gloss. With nothing to clear it leaves the box instead.
        e.preventDefault();
        if (k.dirty) k.clear();
        else if (typing) t?.blur();
        return;
      }
      if (typing) return;
      switch (e.key) {
        case "/":
          e.preventDefault();
          k.focusSearch();
          return;
        case "?":
          e.preventDefault();
          k.setSheet(true);
          return;
        case "ArrowLeft":
          if (!e.shiftKey && k.paged && k.page > 0) k.turnPage(k.page - 1);
          return;
        case "ArrowRight":
          if (!e.shiftKey && k.paged && k.page < k.pageCount - 1) k.turnPage(k.page + 1);
          return;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });
}
