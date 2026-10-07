// Sanity checks on the APS adapter against the pulled records.
import { describe, expect, it } from "vitest";
import { buildReal } from "@/app/prototype/reveal/real";

describe("aps adapter", () => {
  const d = buildReal();
  it("one row per primary application, replacements folded in", () => {
    expect(d.apps.length).toBeGreaterThan(1000);
    expect(d.apps.every((a) => !a.id.endsWith("-R"))).toBe(true);
    expect(d.stats.replacements).toBeGreaterThan(0);
  });
  it("groups only on a declared parent", () => {
    for (const g of d.groups) {
      if (g.entities.length > 1) expect(g.link).toBe("parent");
      expect(g.link === null || g.link === "parent").toBe(true);
    }
  });
  it("people never carry an entity name", () => {
    for (const a of d.apps) expect(a.entity.people).not.toMatch(/\b(LLC|Ltd|Inc\.?|GmbH)\b/);
  });
});
