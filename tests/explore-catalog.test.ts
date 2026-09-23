import { describe, expect, it } from "vitest";
import { catalogKey, decodeExploreCatalog } from "../lib/explore-catalog";

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
});
