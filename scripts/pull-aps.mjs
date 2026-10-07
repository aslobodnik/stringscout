// Pull every public record from ICANN's 2026 Round Application Publication
// and Statistics site (newgtldprogram-aps.icann.org) into data/icann/aps/.
// No auth. Endpoints read from the site's Angular bundle.
//   node scripts/pull-aps.mjs            full pull
//   node scripts/pull-aps.mjs --list     list + stats only
import { mkdir, writeFile, readFile, access } from "node:fs/promises";
import path from "node:path";

const API = "https://newgtldprogram-aps.icann.org/aps";
const OUT = path.resolve("data/icann/aps");
const PER_APP = ["summary", "responses", "response-documents", "change-requests", "objections"];
const CONCURRENCY = 6;
const UA = { "User-Agent": "stringscout.com pull (alex@fullrange.ai)" };

async function get(url, init = {}, tries = 5) {
  for (let i = 1; ; i++) {
    try {
      const r = await fetch(url, { ...init, headers: { ...UA, ...(init.headers ?? {}) } });
      if (r.status === 429 || r.status >= 500) throw new Error(`HTTP ${r.status}`);
      if (!r.ok) return { status: r.status, body: await r.text() };
      return { status: r.status, body: await r.text() };
    } catch (e) {
      if (i >= tries) throw e;
      await new Promise((res) => setTimeout(res, 500 * 2 ** i));
    }
  }
}

async function searchPage(pageNum, pageSize = 100) {
  const body = {
    searchAndFilter: { searchBy: null, searchText: "", applicationStatus: [], applicationRegion: [], tldType: [], includeLabels: [], excludeLabels: [], processingStage: [], applicationLocation: [], applicationType: [] },
    sort: { field: "applicationId", direction: "ASC" },
    pagination: { pageNum, pageSize },
  };
  const r = await get(`${API}/applications`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  if (r.status !== 200) throw new Error(`search page ${pageNum}: ${r.status} ${r.body.slice(0, 200)}`);
  return JSON.parse(r.body);
}

async function pullList() {
  const first = await searchPage(0);
  const all = [...first.applications];
  const pages = Math.ceil(first.totalApplications / first.pageSize);
  for (let p = 1; p < pages; p++) {
    const d = await searchPage(p);
    all.push(...d.applications);
    process.stderr.write(`list ${all.length}/${first.totalApplications}\r`);
  }
  process.stderr.write("\n");
  const ids = new Set(all.map((a) => a.applicationHumanReadableId));
  if (ids.size !== all.length) console.warn(`duplicate ids in list: ${all.length - ids.size}`);
  if (all.length !== first.totalApplications) console.warn(`list ${all.length} != total ${first.totalApplications}`);
  return all;
}

async function exists(p) { try { await access(p); return true; } catch { return false; } }

async function pullApp(id, log) {
  const dir = path.join(OUT, "applications", id);
  await mkdir(dir, { recursive: true });
  await Promise.all(PER_APP.map(async (ep) => {
    const file = path.join(dir, `${ep}.json`);
    if (await exists(file)) return;
    const r = await get(`${API}/applications/${encodeURIComponent(id)}/${ep}`);
    if (r.status !== 200) { log.errors.push({ id, ep, status: r.status, body: r.body.slice(0, 200) }); return; }
    await writeFile(file, r.body);
  }));
}

async function main() {
  await mkdir(OUT, { recursive: true });
  const stats = await get(`${API}/applications/stats`);
  await writeFile(path.join(OUT, "stats.json"), stats.body);
  const list = await pullList();
  await writeFile(path.join(OUT, "list.json"), JSON.stringify(list, null, 1));
  console.log(`list: ${list.length} applications`);
  if (process.argv.includes("--list")) return;

  const log = { errors: [] };
  let done = 0;
  const queue = list.map((a) => a.applicationHumanReadableId);
  await Promise.all(Array.from({ length: CONCURRENCY }, async () => {
    while (queue.length) {
      const id = queue.shift();
      try { await pullApp(id, log); } catch (e) { log.errors.push({ id, error: String(e) }); }
      done++;
      if (done % 50 === 0) process.stderr.write(`apps ${done}/${list.length} errors ${log.errors.length}\r`);
    }
  }));
  process.stderr.write("\n");
  await writeFile(path.join(OUT, "pull-log.json"), JSON.stringify({ pulledAt: new Date().toISOString(), count: list.length, errors: log.errors }, null, 1));
  console.log(`done: ${done} apps, ${log.errors.length} errors`);
}
main().catch((e) => { console.error(e); process.exit(1); });
