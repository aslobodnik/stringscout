"use client";

import { useEffect, useRef, useState } from "react";
import { MAX_QUERY_LENGTH, MAX_RESULTS, type ExploreResponse } from "@/lib/explore";
import Tld from "./Tld";

const focus = "focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold";
const API_URL = process.env.NEXT_PUBLIC_EXPLORE_API_URL ?? (
  process.env.NODE_ENV === "development"
    ? "http://localhost:3001/api/explore"
    : "https://api.stringscout.com/api/explore"
);

export default function ExploreSearch({ catalogSize }: { catalogSize: number }) {
  const [draft, setDraft] = useState("");
  const [pendingQuery, setPendingQuery] = useState<string | null>(null);
  const [search, setSearch] = useState<ExploreResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [count, setCount] = useState(10);
  const active = useRef<AbortController | null>(null);

  useEffect(() => () => active.current?.abort(), []);

  async function explore(value: string) {
    const query = value.trim();
    if (!query || query.length > MAX_QUERY_LENGTH || query === pendingQuery) return;
    active.current?.abort();
    const controller = new AbortController();
    active.current = controller;
    setDraft(query);
    setPendingQuery(query);
    setError(null);
    setSearch(null);
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
      setSearch({ ...data, results: data.results.slice(0, MAX_RESULTS) });
    } catch (caught) {
      if (controller.signal.aborted || active.current !== controller) return;
      setError(caught instanceof Error ? caught.message : "Search didn’t finish. Please try again.");
    } finally {
      if (active.current === controller) setPendingQuery(null);
    }
  }

  return (
    <>
      <form onSubmit={(event) => { event.preventDefault(); void explore(draft); }} role="search">
        <label htmlFor="explore-query" className="sr-only">Word or phrase</label>
        <div className="border border-ink bg-paper-deep/40 p-4 transition-colors focus-within:border-gold focus-within:ring-1 focus-within:ring-gold sm:p-6">
          <textarea
            id="explore-query"
            name="query"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing && event.keyCode !== 229) {
                event.preventDefault();
                event.currentTarget.form?.requestSubmit();
              }
            }}
            rows={2}
            maxLength={MAX_QUERY_LENGTH}
            placeholder="ski, a feeling, a whole idea…"
            autoComplete="off"
            aria-describedby="explore-help"
            className="block w-full resize-none bg-transparent text-2xl leading-relaxed placeholder:text-ink-soft/60 focus:outline-none sm:text-3xl"
          />
          <div className="mt-3 flex items-center justify-between gap-3">
            <span className="text-xs text-ink-soft">{draft.length} / {MAX_QUERY_LENGTH}</span>
            <button
              type="submit"
              disabled={!draft.trim() || pendingQuery === draft.trim()}
              className={`min-h-11 bg-ink px-6 py-2 text-sm text-paper hover:bg-gold disabled:cursor-default disabled:opacity-50 ${focus}`}
            >
              Explore <span aria-hidden="true" className="ml-4">↗</span>
            </button>
          </div>
        </div>
        <p id="explore-help" className="mt-3 text-sm text-ink-soft">
          Press Enter to explore {catalogSize.toLocaleString()} strings. Shift + Enter adds a line.
        </p>
      </form>

      <div role="status" aria-live="polite" className="mt-8 text-sm text-ink-soft">
        {pendingQuery ? `Finding connections for “${pendingQuery}”…` : search ? `${Math.min(count, search.results.length)} results for “${search.query}”` : null}
      </div>
      {error && <p role="alert" className="mt-4 text-oxblood">{error}</p>}

      {search && (
        <section aria-label={`Results for ${search.query}`} className="mt-4">
          <div className="flex justify-end border-t border-rule pt-4">
            <label className="flex items-center gap-2 text-xs text-ink-soft">
              Show
              <select aria-label="Number of results" value={count} onChange={(event) => setCount(Number(event.target.value))} className={`min-h-9 border border-rule bg-paper px-2 text-ink ${focus}`}>
                {[10, 20, 30, 40, 50].map((value) => <option key={value} value={value}>{value}</option>)}
              </select>
              strings
            </label>
          </div>
          {search.results.length === 0 ? (
            <p className="mt-6 text-ink-soft">No strings to explore yet.</p>
          ) : (
            <>
              <ul aria-label="Related strings" className="mt-6 flex flex-wrap gap-3">
                {search.results.slice(0, count).map((result) => (
                  <li key={result.tld} className="max-w-full">
                    <button
                      type="button"
                      onClick={() => void explore(result.tld)}
                      title={result.gloss ? `Explore ${result.gloss}` : `Explore ${result.tld}`}
                      className={`max-w-full rounded-full border border-rule bg-paper-deep/50 px-5 py-2.5 text-left text-xl break-words hover:border-gold hover:bg-paper-deep ${focus}`}
                    >
                      <Tld>{result.tld}</Tld>
                      {result.gloss && <span className="ml-2 text-sm text-ink-soft">{result.gloss}</span>}
                    </button>
                  </li>
                ))}
              </ul>
              <p className="mt-5 text-xs text-ink-soft">Select a string to explore from there.</p>
            </>
          )}

        </section>
      )}
    </>
  );
}
