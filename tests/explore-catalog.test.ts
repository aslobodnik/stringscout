import { describe, expect, it } from "vitest";
import { catalogKey, decodeExploreCatalog, selectExploreResults } from "../lib/explore-catalog";

const data = { version: "one", candidates: [{ tld: "山", gloss: "mountain" }, { tld: "ski" }], rankings: [[[1, 0.875], [0, 0.75]], [[0, 0.94], [1, 0.93]]] };

describe("preloaded explore catalog", () => {
  it("expands indices without changing score precision, rank order, or glosses", () => {
    const catalog = decodeExploreCatalog(data)!;
    expect(catalog.results.get("ski")).toEqual([{ tld: "山", gloss: "mountain", score: 0.94 }, { tld: "ski", score: 0.93 }]);
    expect(catalog.results.get("山")?.[0].score).toBe(0.875);
    expect(catalogKey(" SKI ")).toBe("ski");
  });
  it("rejects incomplete, invalid, or duplicated rows so search can fall back to the API", () => {
    for (const invalid of [null, {}, { ...data, rankings: [] }, { ...data, rankings: [[[0, 1], [0, 0.9]], data.rankings[1]] }, { ...data, rankings: [[[9, 1], [0, 0.9]], data.rankings[1]] }, { ...data, rankings: [[[0, 2], [1, 0.9]], data.rankings[1]] }]) {
      expect(decodeExploreCatalog(invalid)).toBeNull();
    }
  });
  it("keeps independently ranked types even when one falls below the mixed top 25", () => {
    const candidates = Array.from({ length: 27 }, (_, index) => ({ tld: `string${index}`, ...(index === 26 ? { existing: true, availability: "coming-soon" } : {}) }));
    const mixed = Array.from({ length: 25 }, (_, index) => [index, 1 - index / 100]);
    const newly = Array.from({ length: 25 }, (_, index) => [index, 1 - index / 100]);
    const ranked = decodeExploreCatalog({
      version: "two", candidates,
      rankings: candidates.map(() => mixed),
      rankingsByKind: { new: candidates.map(() => newly), existing: candidates.map(() => [[26, 0.4]]) },
    })!;
    const sets = ranked.resultSets!.get("string0")!;
    expect(ranked.results.get("string0")).toHaveLength(25);
    expect(selectExploreResults({ results: ranked.results.get("string0")!, resultSets: sets }, false, true)).toEqual([
      { tld: "string26", existing: true, availability: "coming-soon", score: 0.4 },
    ]);
    expect(selectExploreResults({ results: ranked.results.get("string0")!, resultSets: sets }, true, false)).toHaveLength(25);
    expect(decodeExploreCatalog({
      version: "two", candidates,
      rankings: candidates.map(() => mixed),
      rankingsByKind: { new: candidates.map(() => newly), existing: candidates.map(() => [[0, 0.4]]) },
    })).toBeNull();
  });
  it("uses available metadata for legacy mixed rankings", () => {
    const results = [{ tld: "web", score: 0.9, existing: true as const }, { tld: "snow", score: 0.8 }];
    expect(selectExploreResults({ results }, true, true)).toEqual(results);
    expect(selectExploreResults({ results }, true, false)).toEqual([results[1]]);
    expect(selectExploreResults({ results }, false, true)).toEqual([results[0]]);
    expect(selectExploreResults({ results }, false, false)).toEqual([]);
  });
});
