"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { MAX_QUERY_LENGTH, MAX_RESULTS, type ExploreResponse } from "@/lib/explore";
import { catalogKey, decodeExploreCatalog, type ExploreCatalog } from "@/lib/explore-catalog";
import Tld from "./Tld";

const focus = "focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold";
const API_URL = process.env.NEXT_PUBLIC_EXPLORE_API_URL ?? (
  process.env.NODE_ENV === "development"
    ? "http://localhost:3001/api/explore"
    : "https://api.stringscout.com/api/explore"
);
const CATALOG_URL = API_URL.replace(/\/explore$/, "/catalog");
const pill = "max-w-full rounded-full border border-rule bg-paper-deep/50 px-5 py-2.5 text-left text-xl break-words";

export default function ExploreSearch() {
  const [draft, setDraft] = useState("");
  const [pendingQuery, setPendingQuery] = useState<string | null>(null);
  const [search, setSearch] = useState<ExploreResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [count, setCount] = useState(10);
  const [previous, setPrevious] = useState<ExploreResponse | null>(null);
  const [resultsMinHeight, setResultsMinHeight] = useState(0);
  const active = useRef<AbortController | null>(null);
  const catalog = useRef<ExploreCatalog | null>(null);
  const recent = useRef(new Map<string, ExploreResponse>());
  const shown = useRef<ExploreResponse | null>(null);
  const resultsBox = useRef<HTMLDivElement | null>(null);
  const resultsList = useRef<HTMLUListElement | null>(null);
  const transitionTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    const controller = new AbortController();
    void fetch(CATALOG_URL, { signal: controller.signal })
      .then(response => response.ok ? response.json() : null)
      .then(data => { if (!controller.signal.aborted) catalog.current = decodeExploreCatalog(data); })
      .catch(() => { /* Search still works if background preloading fails. */ });
    return () => {
      controller.abort();
      active.current?.abort();
      clearTimeout(transitionTimer.current);
    };
  }, []);

  useLayoutEffect(() => {
    if (!search || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const animation = resultsList.current?.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 300, easing: "ease-in-out" });
    return () => animation?.cancel();
  }, [search]);

  function showResults(next: ExploreResponse) {
    clearTimeout(transitionTimer.current);
    if (resultsBox.current) setResultsMinHeight(resultsBox.current.getBoundingClientRect().height);
    const animate = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setPrevious(animate ? shown.current : null);
    shown.current = next;
    setSearch(next);
    if (animate) transitionTimer.current = setTimeout(() => setPrevious(null), 300);
  }

  async function explore(value: string) {
    const query = value.trim();
    if (!query || query.length > MAX_QUERY_LENGTH || query === pendingQuery) return;
    active.current?.abort();
    const controller = new AbortController();
    active.current = controller;
    setDraft(query);
    setError(null);
    const saved = catalog.current?.results.get(catalogKey(query));
    const cached = saved ? { query, results: saved, metrics: { serverMs: 0, evaluated: catalog.current!.results.size } } : recent.current.get(query);
    if (cached) {
      setPendingQuery(null);
      showResults({ ...cached, query });
      return;
    }
    setPendingQuery(query);
    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, limit: MAX_RESULTS }),
        signal: controller.signal,
      });
      const data = await response.json().catch(() => null);
      if (response.status === 429) throw new Error("Too many searches. Wait a moment and try again.");
      if (!response.ok) throw new Error(data?.error || "Search didn’t finish. Please try again.");
      if (!data || !Array.isArray(data.results) || !data.metrics) throw new Error("Search didn’t finish. Please try again.");
      if (active.current !== controller) return;
      const version = response.headers.get("X-Explore-Version");
      if (version && catalog.current && version !== catalog.current.version) {
        catalog.current = null;
        recent.current.clear();
      }
      const next = { ...data, results: data.results.slice(0, MAX_RESULTS) };
      recent.current.set(query, next);
      if (recent.current.size > 100) recent.current.delete(recent.current.keys().next().value!);
      showResults(next);
    } catch (caught) {
      if (controller.signal.aborted || active.current !== controller) return;
      setError(caught instanceof Error && !(caught instanceof TypeError)
        ? caught.message
        : "Search didn’t finish. Please try again.");
    } finally {
      if (active.current === controller) setPendingQuery(null);
    }
  }

  return (
    <>
      <form onSubmit={(event) => { event.preventDefault(); void explore(draft); }} role="search">
        <label htmlFor="explore-query" className="sr-only">Word or phrase</label>
        <div className="flex border border-ink transition-colors duration-200 ease-in-out focus-within:border-gold motion-reduce:transition-none">
          <input
            id="explore-query"
            name="query"
            type="text"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key !== "Enter" || event.nativeEvent.isComposing || event.keyCode === 229) return;
              event.preventDefault();
              if (!event.shiftKey) {
                event.currentTarget.form?.requestSubmit();
              }
            }}
            maxLength={MAX_QUERY_LENGTH}
            placeholder="skiing, quantum mechanics, love…"
            autoComplete="off"
            enterKeyHint="search"
            className="h-14 min-w-0 flex-1 bg-transparent px-4 text-xl placeholder:text-ink-soft/60 focus:outline-none sm:h-16 sm:px-5 sm:text-2xl"
          />
          <button
            type="submit"
            disabled={!draft.trim() || pendingQuery === draft.trim()}
            className={`label m-1.5 shrink-0 cursor-pointer border border-gold/40 bg-paper-deep px-4 text-gold transition-colors duration-200 ease-in-out enabled:hover:border-gold enabled:hover:bg-gold/10 enabled:active:bg-gold/20 disabled:cursor-default disabled:opacity-50 motion-reduce:transition-none sm:px-6 ${focus}`}
          >
            Explore
          </button>
        </div>
        <div className="mt-2 flex h-4 items-center justify-between gap-4 text-ink-soft">
          <div role="status" aria-live="polite" className="flex min-w-0 items-center gap-2 text-xs">
            {pendingQuery ? (
              <>
                <span aria-hidden="true" className="h-3 w-3 shrink-0 rounded-full border border-gold/25 border-t-gold motion-safe:animate-spin" />
                <span className="min-w-0 truncate">Finding connections for “{pendingQuery}”…</span>
              </>
            ) : search ? (
              <span className="sr-only">{Math.min(count, search.results.length)} results for “{search.query}”</span>
            ) : null}
          </div>
          <p className="shrink-0 text-[10px] leading-none">{draft.length}/{MAX_QUERY_LENGTH}</p>
        </div>
      </form>

      {error && <p role="alert" className="mt-4 text-oxblood">{error}</p>}

      {search && (
        <section aria-label={`Results for ${search.query}`} aria-busy={pendingQuery !== null} className="mt-4">
          <div className="flex justify-end border-t border-rule pt-4">
            <div className="flex items-center gap-3 text-xs text-ink-soft">
              Show
              <div role="group" aria-label="Number of results" className="flex border border-rule">
                {[10, 25].map((value) => (
                  <button
                    key={value}
                    type="button"
                    aria-label={`Show ${value} strings`}
                    aria-pressed={count === value}
                    onClick={() => { setCount(value); setResultsMinHeight(0); setPrevious(null); }}
                    className={`min-h-11 min-w-11 cursor-pointer border-l border-rule px-3 transition-colors duration-200 ease-in-out first:border-l-0 motion-reduce:transition-none ${count === value ? "bg-ink text-paper" : "bg-paper text-ink-soft hover:bg-paper-deep hover:text-ink"} ${focus}`}
                  >
                    {value}
                  </button>
                ))}
              </div>
              strings
            </div>
          </div>
          {search.results.length === 0 ? (
            <p className="mt-6 text-ink-soft">No strings to explore yet.</p>
          ) : (
            <div ref={resultsBox} className="mt-6 grid items-start" style={{ minHeight: resultsMinHeight || undefined }}>
              {previous && (
                <ul key={previous.query} aria-hidden="true" className="explore-results-leaving pointer-events-none col-start-1 row-start-1 flex flex-wrap gap-3">
                  {previous.results.slice(0, count).map(result => (
                    <li key={result.tld} className="max-w-full">
                      <span className={`${pill} block`}>
                        <Tld>{result.tld}</Tld>
                        {result.gloss && <span className="ml-2 text-sm text-ink-soft">{result.gloss}</span>}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
              <ul ref={resultsList} aria-label="Related strings" className={`relative col-start-1 row-start-1 flex flex-wrap gap-3 transition-opacity duration-200 motion-reduce:transition-none ${pendingQuery ? "opacity-50" : "opacity-100"}`}>
                {search.results.slice(0, count).map((result) => (
                  <li key={result.tld} className="max-w-full">
                    <button
                      type="button"
                      onClick={() => void explore(result.tld)}
                      title={result.gloss ? `Explore ${result.gloss}` : `Explore ${result.tld}`}
                      className={`${pill} cursor-pointer transition-colors duration-200 ease-in-out hover:border-gold hover:bg-paper-deep active:border-gold active:bg-gold/10 motion-reduce:transition-none ${focus}`}
                    >
                      <Tld>{result.tld}</Tld>
                      {result.gloss && <span className="ml-2 text-sm text-ink-soft">{result.gloss}</span>}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

        </section>
      )}
    </>
  );
}
