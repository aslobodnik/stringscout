import { MAX_RESULTS, type ExploreResult } from "./explore";

export type ExploreCatalog = { version: string; results: Map<string, ExploreResult[]> };
export const catalogKey = (query: string) => query.trim().normalize("NFC").toLowerCase();

export function decodeExploreCatalog(value: unknown): ExploreCatalog | null {
  if (!value || typeof value !== "object") return null;
  const data = value as { version?: unknown; candidates?: unknown; rankings?: unknown };
  if (typeof data.version !== "string" || !data.version || !Array.isArray(data.candidates) ||
      !data.candidates.length || !Array.isArray(data.rankings) || data.rankings.length !== data.candidates.length) return null;
  const candidates: { tld: string; gloss?: string }[] = [];
  for (const candidate of data.candidates) {
    if (!candidate || typeof candidate.tld !== "string" || (candidate.gloss !== undefined && typeof candidate.gloss !== "string")) return null;
    candidates.push({ tld: candidate.tld, ...(candidate.gloss ? { gloss: candidate.gloss } : {}) });
  }
  const results = new Map<string, ExploreResult[]>();
  for (const [index, row] of data.rankings.entries()) {
    if (!Array.isArray(row) || row.length !== Math.min(MAX_RESULTS, candidates.length)) return null;
    const ranked: ExploreResult[] = [];
    const seen = new Set<number>();
    for (const pair of row) {
      if (!Array.isArray(pair) || pair.length !== 2) return null;
      const [id, score] = pair;
      if (!Number.isInteger(id) || !candidates[id] || seen.has(id) || !Number.isFinite(score) || score < 0 || score > 1) return null;
      seen.add(id);
      ranked.push({ ...candidates[id], score });
    }
    results.set(catalogKey(candidates[index].tld), ranked);
  }
  return results.size === candidates.length ? { version: data.version, results } : null;
}
