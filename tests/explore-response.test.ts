import { describe, expect, it } from "vitest";
import { readExploreResponses } from "../lib/explore-response";

const newly = [{ tld: "山", score: 0.9, gloss: "mountain" }];
const existing = [{ tld: "ski", score: 0.8, existing: true }];
const partial = { query: "snow", complete: false, results: newly, resultSets: { new: newly }, metrics: { serverMs: 10, evaluated: 779 } };
const full = { ...partial, complete: true, results: [...newly, ...existing], resultSets: { new: newly, existing } };
const encode = (value: unknown) => new TextEncoder().encode(`${JSON.stringify(value)}\n`);

describe("progressive explore responses", () => {
  it("accepts legacy JSON and keeps private diagnostics out of returned metrics", async () => {
    const legacy = { query: full.query, results: full.results, resultSets: full.resultSets, metrics: full.metrics };
    const reader = readExploreResponses(Response.json({ ...legacy, privateDetail: "hidden", metrics: { ...legacy.metrics, inputTokens: 123 } }));
    const next = await reader.next();
    expect(next.value).toEqual(legacy);
    expect((await reader.next()).done).toBe(true);
  });

  it("yields the first group while the remaining stream is still open, including split UTF-8", async () => {
    let output!: ReadableStreamDefaultController<Uint8Array>;
    const response = new Response(new ReadableStream({ start(controller) { output = controller; } }), { headers: { "Content-Type": "application/x-ndjson" } });
    const reader = readExploreResponses(response);
    const first = reader.next();
    const bytes = encode(partial);
    for (const byte of bytes) output.enqueue(new Uint8Array([byte]));
    expect((await first).value).toEqual(partial);
    output.enqueue(encode(full));
    output.close();
    expect((await reader.next()).value).toEqual(full);
    expect((await reader.next()).done).toBe(true);
  });

  it.each(["error", "truncated"])("preserves the first group when the rest is %s", async (failure) => {
    const response = new Response(new ReadableStream({ start(controller) {
      controller.enqueue(encode(partial));
      if (failure === "error") controller.enqueue(encode({ error: "Failed", failedScope: "existing" }));
      controller.close();
    } }), { headers: { "Content-Type": "application/x-ndjson" } });
    const reader = readExploreResponses(response);
    expect((await reader.next()).value).toEqual(partial);
    await expect(reader.next()).rejects.toThrow();
  });

  it("does not accept a final response that is missing a group", async () => {
    const reader = readExploreResponses(Response.json({ ...partial, complete: true }));
    await expect(reader.next()).rejects.toThrow("Incomplete groups");
  });
});
