import { MAX_RESULTS, type ExploreResult } from "./explore";

export type ExploreCatalog = {
  version: string;
  results: Map<string, ExploreResult[]>;
  resultSets?: Map<string, { new: ExploreResult[]; existing: ExploreResult[] }>;
};
export const catalogKey = (query: string) => query.trim().replace(/\s+/g, " ").normalize("NFC").toLowerCase();

export function selectExploreResults(response: { results: ExploreResult[]; resultSets?: { new?: ExploreResult[]; existing?: ExploreResult[] } }, showNew: boolean, showExisting: boolean): ExploreResult[] {
  if (showNew && showExisting) return response.results;
  if (!showNew && !showExisting) return [];
  if (response.resultSets) return (showNew ? response.resultSets.new : response.resultSets.existing) ?? [];
  return response.results.filter(result => showNew ? result.existing !== true : result.existing === true);
}

export function decodeExploreCatalog(value: unknown): ExploreCatalog | null {
  if (!value || typeof value !== "object") return null;
  const data = value as { version?: unknown; candidates?: unknown; rankings?: unknown; rankingsByKind?: unknown };
  if (typeof data.version !== "string" || !data.version || !Array.isArray(data.candidates) ||
      !data.candidates.length || !Array.isArray(data.rankings) || data.rankings.length !== data.candidates.length) return null;
  const candidates: Omit<ExploreResult, "score">[] = [];
  for (const candidate of data.candidates) {
    if (!candidate || typeof candidate.tld !== "string" || (candidate.gloss !== undefined && typeof candidate.gloss !== "string") ||
        (candidate.existing !== undefined && typeof candidate.existing !== "boolean") ||
        (candidate.availability !== undefined && candidate.availability !== "coming-soon")) return null;
    candidates.push({ tld: candidate.tld, ...(candidate.gloss ? { gloss: candidate.gloss } : {}),
      ...(candidate.existing === true ? { existing: true } : {}),
      ...(candidate.availability ? { availability: candidate.availability } : {}) });
  }
  function decodeRow(row: unknown, expected: number, kind?: "new" | "existing"): ExploreResult[] | null {
    if (!Array.isArray(row) || row.length !== expected) return null;
    const ranked: ExploreResult[] = [];
    const seen = new Set<number>();
    for (const pair of row) {
      if (!Array.isArray(pair) || pair.length !== 2) return null;
      const [id, score] = pair;
      if (!Number.isInteger(id) || !candidates[id] || seen.has(id) || !Number.isFinite(score) || score < 0 || score > 1 ||
          (kind && (candidates[id].existing === true) !== (kind === "existing"))) return null;
      seen.add(id);
      ranked.push({ ...candidates[id], score });
    }
    return ranked;
  }
  const results = new Map<string, ExploreResult[]>();
  for (const [index, row] of data.rankings.entries()) {
    const ranked = decodeRow(row, Math.min(MAX_RESULTS, candidates.length));
    if (!ranked) return null;
    results.set(catalogKey(candidates[index].tld), ranked);
  }
  if (results.size !== candidates.length) return null;
  if (data.rankingsByKind === undefined) return { version: data.version, results };
  const groups = data.rankingsByKind as { new?: unknown; existing?: unknown };
  if (!groups || !Array.isArray(groups.new) || !Array.isArray(groups.existing) ||
      groups.new.length !== candidates.length || groups.existing.length !== candidates.length) return null;
  const groupCounts = {
    new: Math.min(MAX_RESULTS, candidates.filter(candidate => candidate.existing !== true).length),
    existing: Math.min(MAX_RESULTS, candidates.filter(candidate => candidate.existing === true).length),
  };
  const resultSets = new Map<string, { new: ExploreResult[]; existing: ExploreResult[] }>();
  for (let index = 0; index < candidates.length; index++) {
    const newly = decodeRow(groups.new[index], groupCounts.new, "new");
    const existing = decodeRow(groups.existing[index], groupCounts.existing, "existing");
    if (!newly || !existing) return null;
    resultSets.set(catalogKey(candidates[index].tld), { new: newly, existing });
  }
  return { version: data.version, results, resultSets };
}
