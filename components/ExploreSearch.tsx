"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { MAX_QUERY_LENGTH, MAX_RESULTS, type ExploreResponse, type ExploreResult } from "@/lib/explore";
import { catalogKey, decodeExploreCatalog, selectExploreResults, type ExploreCatalog } from "@/lib/explore-catalog";
import Tld from "./Tld";
import type { exploreRegistrations } from "@/data/existing-tlds/registrations";
import { readExploreResponses } from "@/lib/explore-response";

const focus = "focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold";
const API_URL = process.env.NEXT_PUBLIC_EXPLORE_API_URL ?? (
  process.env.NODE_ENV === "development"
    ? "http://localhost:3001/api/explore"
    : "https://api.stringscout.com/api/explore"
);
const CATALOG_URL = API_URL.replace(/\/explore$/, "/catalog");
const pill = "max-w-full rounded-full border border-rule bg-paper-deep/50 px-5 py-2.5 text-left text-xl break-words";
const pillTone = (result: ExploreResult) => result.existing
  ? "text-gold"
  : "text-ink";
type SearchError = { query: string };
type Scope = "new" | "both" | "existing";
const resultsForScope = (response: ExploreResponse, scope: Scope) =>
  selectExploreResults(response, scope !== "existing", scope !== "new");
const compactCount = new Intl.NumberFormat("en", { notation: "compact", maximumSignificantDigits: 2 });

function RegistrationCount({ count }: { count: number | undefined }) {
  if (count === undefined) return null;
  return <span className="mt-0.5 block text-center text-[11px] leading-none tabular-nums text-ink-soft">
    <span aria-hidden="true">{count < 1000 ? count : compactCount.format(count).toLowerCase()}</span>
    <span className="sr-only">{count.toLocaleString("en")} registered domains</span>
  </span>;
}

export default function ExploreSearch({ registrations }: { registrations: typeof exploreRegistrations }) {
  const [draft, setDraft] = useState("");
  const [pendingQuery, setPendingQuery] = useState<string | null>(null);
  const [search, setSearch] = useState<ExploreResponse | null>(null);
  const [error, setError] = useState<SearchError | null>(null);
  const [backgroundError, setBackgroundError] = useState<SearchError | null>(null);
  const [count, setCount] = useState(10);
  const [scope, setScope] = useState<Scope>("new");
  const filterState = useRef<Scope>("new");
  const [previous, setPrevious] = useState<{ query: string; results: ExploreResult[] } | null>(null);
  const [resultsMinHeight, setResultsMinHeight] = useState(0);
  const active = useRef<AbortController | null>(null);
  const catalog = useRef<ExploreCatalog | null>(null);
  const recent = useRef(new Map<string, ExploreResponse>());
  const shown = useRef<{ query: string; results: ExploreResult[] } | null>(null);
  const resultsBox = useRef<HTMLDivElement | null>(null);
  const resultsList = useRef<HTMLUListElement | null>(null);
  const transitionTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const selected = search ? resultsForScope(search, scope) : [];
  const resultQuery = search?.query;
  const resultsKey = JSON.stringify(selected);
  const waitingForScope = search?.complete === false && (scope === "both" || !search.resultSets?.[scope]);
  const remainingFailed = backgroundError?.query === resultQuery;
  const loadingQuery = pendingQuery ?? (waitingForScope && !remainingFailed ? resultQuery : null);

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
    if (!resultQuery || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const animation = resultsList.current?.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 300, easing: "ease-in-out" });
    return () => animation?.cancel();
  }, [resultQuery, scope, resultsKey]);

  function showResults(next: ExploreResponse) {
    setError(null);
    clearTimeout(transitionTimer.current);
    const nextShown = { query: next.query, results: resultsForScope(next, filterState.current) };
    // Finishing a hidden group must not animate or replace the visible pills.
    if (shown.current?.query === next.query && JSON.stringify(shown.current.results) === JSON.stringify(nextShown.results)) {
      shown.current = nextShown;
      setPrevious(null);
      setSearch(next);
      return;
    }
    if (resultsBox.current) setResultsMinHeight(resultsBox.current.getBoundingClientRect().height);
    const animate = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setPrevious(animate ? shown.current : null);
    shown.current = nextShown;
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
    setError(current => current?.query === query ? current : null);
    setBackgroundError(null);
    setPendingQuery(query);
    const saved = catalog.current?.results.get(catalogKey(query));
    const cached = saved ? { query, results: saved, resultSets: catalog.current!.resultSets?.get(catalogKey(query)), metrics: { serverMs: 0, evaluated: catalog.current!.results.size } } : recent.current.get(catalogKey(query));
    let receivedPartial = false;
    try {
      if (cached) {
        showResults({ ...cached, query });
        return;
      }
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, limit: MAX_RESULTS, scope: filterState.current, stream: true }),
        signal: controller.signal,
      });
      if (active.current !== controller) return;
      const version = response.headers.get("X-Explore-Version");
      if (version && catalog.current && version !== catalog.current.version) {
        catalog.current = null;
        recent.current.clear();
      }
      for await (const next of readExploreResponses(response)) {
        if (controller.signal.aborted || active.current !== controller) return;
        receivedPartial = next.complete === false;
        if (next.complete !== false) {
          recent.current.set(catalogKey(query), next);
          if (recent.current.size > 100) recent.current.delete(recent.current.keys().next().value!);
        }
        showResults(next);
        setPendingQuery(null);
      }
    } catch {
      if (controller.signal.aborted || active.current !== controller) return;
      if (receivedPartial) setBackgroundError({ query: shown.current?.query ?? query });
      else setError({ query });
    } finally {
      if (active.current === controller && !controller.signal.aborted) setPendingQuery(null);
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
            onChange={(event) => { setDraft(event.target.value); setError(null); }}
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
            className="h-14 min-w-0 flex-1 truncate bg-transparent px-4 text-xl placeholder:text-ink-soft/60 focus:outline-none sm:h-16 sm:px-5 sm:text-2xl"
          />
          <button
            type="submit"
            disabled={!draft.trim() || pendingQuery === draft.trim()}
            className={`label m-1.5 shrink-0 cursor-pointer border border-gold/40 bg-paper-deep px-4 text-gold transition-colors duration-200 ease-in-out enabled:hover:border-gold enabled:hover:bg-gold/10 enabled:active:bg-gold/20 disabled:cursor-default disabled:opacity-50 motion-reduce:transition-none sm:px-6 ${focus}`}
          >
            Explore
          </button>
        </div>
        <div className="mt-2 flex items-center justify-between gap-4 text-ink-soft">
          <div role="radiogroup" aria-label="String types" className="flex h-7 border border-rule">
            {(["new", "both", "existing"] as const).map((value, index) => (
              <label key={value} className={`relative cursor-pointer ${index > 0 ? "border-l border-rule" : ""}`}>
                <input type="radio" name="explore-scope" value={value} checked={scope === value} onChange={() => {
                  filterState.current = value;
                  setScope(value);
                  clearTimeout(transitionTimer.current);
                  setPrevious(null);
                  shown.current = search ? { query: search.query, results: resultsForScope(search, value) } : null;
                  setResultsMinHeight(0);
                }} className="peer sr-only" />
                <span className={`label flex h-full items-center px-3 transition-colors duration-200 ease-in-out peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-gold motion-reduce:transition-none ${scope === value
                  ? value === "existing" ? "bg-gold/10 text-gold" : "bg-paper-deep text-ink"
                  : `${value === "existing" ? "text-gold" : "text-ink-soft"} hover:bg-paper-deep/50`}`}>
                  {value === "new" ? "New" : value === "both" ? "Both" : "Existing"}
                </span>
              </label>
            ))}
          </div>
          <p className="shrink-0 text-[10px] leading-none">{draft.length}/{MAX_QUERY_LENGTH}</p>
        </div>
        <div role="status" aria-live="polite" className={`flex min-w-0 items-center gap-2 text-xs text-ink-soft ${loadingQuery ? "mt-2" : ""}`}>
          {loadingQuery ? (
            <>
              <span aria-hidden="true" className="h-3 w-3 shrink-0 rounded-full border border-gold/25 border-t-gold motion-safe:animate-spin" />
              <span className="min-w-0 truncate">Finding connections for “{loadingQuery}”…</span>
            </>
          ) : search && !error ? (
            <span className="sr-only">{Math.min(count, selected.length)} results for “{search.query}”</span>
          ) : null}
        </div>
      </form>

      {error && <p role="alert" className="mt-4 text-ink-soft">Oops, that didn’t work. Try again.</p>}
      {waitingForScope && remainingFailed && search && <p role="alert" className="mt-4 text-ink-soft">
        The remaining results didn’t load.{" "}
        <button type="button" onClick={() => void explore(search.query)} className={`cursor-pointer text-gold underline underline-offset-2 ${focus}`}>Try again</button>
      </p>}

      {search && (
        <section aria-label={`Results for ${search.query}`} aria-busy={!!loadingQuery} className="mt-4">
          {error && <p className="mb-3 text-xs text-ink-soft">Previous results for “{search.query}”</p>}
          {selected.length === 0 ? (
            waitingForScope ? null : <p className="serif mt-6 italic text-ink-soft">No strings to explore yet.</p>
          ) : (
            <div ref={resultsBox} className="grid items-start" style={{ minHeight: resultsMinHeight || undefined }}>
              {previous && (
                <ul key={previous.query} aria-hidden="true" className="explore-results-leaving pointer-events-none col-start-1 row-start-1 flex flex-wrap gap-3">
                  {previous.results.slice(0, count).map(result => (
                    <li key={result.tld} className="max-w-full">
                      <span className={`${pill} ${pillTone(result)} block`}>
                        <Tld>{result.tld}</Tld>
                        {result.gloss && <span className="ml-2 text-sm text-ink-soft">{result.gloss}</span>}
                        {result.existing && <RegistrationCount count={registrations.counts[result.tld]} />}
                        {result.availability === "coming-soon" && <span className="ml-2 text-xs text-ink-soft">Coming soon</span>}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
              <ul id="explore-results" ref={resultsList} aria-label="Related strings" className={`relative col-start-1 row-start-1 flex flex-wrap gap-3 transition-opacity duration-200 ease-in-out motion-reduce:transition-none ${pendingQuery ? "opacity-50" : "opacity-100"}`}>
                {selected.slice(0, count).map((result) => (
                  <li key={result.tld} className="max-w-full">
                    <button
                      type="button"
                      onClick={() => void explore(result.tld)}
                      className={`${pill} ${pillTone(result)} cursor-pointer transition-colors duration-200 ease-in-out hover:border-gold hover:bg-paper-deep active:border-gold active:bg-gold/10 motion-reduce:transition-none ${focus}`}
                    >
                      <Tld>{result.tld}</Tld>
                      {scope !== "new" && <span className="sr-only">{result.existing ? ", existing TLD" : ", new string"}</span>}
                      {result.gloss && <span className="ml-2 text-sm text-ink-soft">{result.gloss}</span>}
                      {result.existing && <RegistrationCount count={registrations.counts[result.tld]} />}
                      {result.availability === "coming-soon" && <span className="ml-2 text-xs text-ink-soft">Coming soon</span>}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {selected.length > 10 && (
            <div className="mt-3 flex">
              <button
                type="button"
                aria-expanded={count > 10}
                aria-controls="explore-results"
                onClick={() => { setCount(count === 10 ? MAX_RESULTS : 10); setResultsMinHeight(0); setPrevious(null); }}
                className={`min-h-11 cursor-pointer text-sm text-gold underline decoration-gold/40 underline-offset-4 transition-colors duration-200 ease-in-out hover:decoration-gold motion-reduce:transition-none ${focus}`}
              >
                {count === 10 ? `Show ${selected.length - 10} more` : "Show fewer"}
              </button>
            </div>
          )}
        </section>
      )}
    </>
  );
}
