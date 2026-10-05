import { MAX_RESULTS, type ExploreResponse, type ExploreResult } from "./explore";

function resultList(value: unknown): ExploreResult[] {
  if (!Array.isArray(value) || value.some(result => !result || typeof result.tld !== "string" ||
    typeof result.score !== "number" || !Number.isFinite(result.score) || result.score < 0 || result.score > 1 ||
    (result.gloss !== undefined && typeof result.gloss !== "string") ||
    (result.existing !== undefined && typeof result.existing !== "boolean") ||
    (result.availability !== undefined && result.availability !== "coming-soon"))) throw new Error("Invalid results");
  return value.slice(0, MAX_RESULTS);
}

function decode(value: unknown): ExploreResponse {
  if (!value || typeof value !== "object") throw new Error("Invalid response");
  const data = value as Record<string, unknown>;
  if (data.error || typeof data.query !== "string" || !data.metrics || typeof data.metrics !== "object") throw new Error("Search unavailable");
  const metrics = data.metrics as Record<string, unknown>;
  if (typeof metrics.serverMs !== "number" || !Number.isFinite(metrics.serverMs) ||
    typeof metrics.evaluated !== "number" || !Number.isSafeInteger(metrics.evaluated) || metrics.evaluated < 0 ||
    (data.complete !== undefined && typeof data.complete !== "boolean")) throw new Error("Invalid response");
  let resultSets: ExploreResponse["resultSets"];
  if (data.resultSets !== undefined) {
    if (!data.resultSets || typeof data.resultSets !== "object") throw new Error("Invalid groups");
    const groups = data.resultSets as Record<string, unknown>;
    resultSets = {};
    if (groups.new !== undefined) resultSets.new = resultList(groups.new);
    if (groups.existing !== undefined) resultSets.existing = resultList(groups.existing);
    if (!resultSets.new && !resultSets.existing) throw new Error("Missing groups");
    if (data.complete === true && (!resultSets.new || !resultSets.existing)) throw new Error("Incomplete groups");
  }
  if (data.complete === false && !resultSets) throw new Error("Missing groups");
  return { query: data.query, results: resultList(data.results), resultSets,
    ...(typeof data.complete === "boolean" ? { complete: data.complete } : {}),
    metrics: { serverMs: metrics.serverMs, evaluated: metrics.evaluated } };
}

// Older APIs and cache hits can still return a single JSON response.
export async function* readExploreResponses(response: Response): AsyncGenerator<ExploreResponse> {
  if (!response.ok) throw new Error("Search unavailable");
  if (!response.headers.get("Content-Type")?.includes("application/x-ndjson")) {
    const result = decode(await response.json());
    yield result;
    if (result.complete === false) throw new Error("Search incomplete");
    return;
  }
  if (!response.body) throw new Error("Missing response body");
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let complete = false;
  try {
    while (true) {
      const { value, done } = await reader.read();
      buffer += decoder.decode(value, { stream: !done });
      let newline: number;
      while ((newline = buffer.indexOf("\n")) !== -1) {
        const line = buffer.slice(0, newline).trim();
        buffer = buffer.slice(newline + 1);
        if (!line) continue;
        const result = decode(JSON.parse(line));
        complete = result.complete === true;
        yield result;
      }
      if (buffer.length > 128_000) throw new Error("Response too large");
      if (done) break;
    }
    if (buffer.trim()) {
      const result = decode(JSON.parse(buffer));
      complete = result.complete === true;
      yield result;
    }
    if (!complete) throw new Error("Search incomplete");
  } finally {
    await reader.cancel().catch(() => {});
    reader.releaseLock();
  }
}
