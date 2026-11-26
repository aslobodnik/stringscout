// String Confirmation Day (17 Nov 2026): what became of each Reveal Day
// application. Reads ICANN's current APS list and writes one outcome per
// Reveal Day primary to data/icann/confirmation.json. The Reveal Day record
// (aps-derived.json) is left as it is. Each withdrawal keeps the date ICANN
// first published it (the application's lastPublishedAt when first seen).
//   node scripts/pull-confirmation.mjs
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const API = "https://newgtldprogram-aps.icann.org/aps";
const UA = { "User-Agent": "stringscout.com pull" };
const OUT = path.resolve("data/icann/confirmation.json");

async function page(pageNum) {
  const body = {
    searchAndFilter: { searchBy: null, searchText: "", applicationStatus: [], applicationRegion: [], tldType: [], includeLabels: [], excludeLabels: [], processingStage: [], applicationLocation: [], applicationType: [] },
    sort: { field: "applicationId", direction: "ASC" },
    pagination: { pageNum, pageSize: 100 },
  };
  const r = await fetch(`${API}/applications`, { method: "POST", headers: { ...UA, "Content-Type": "application/json" }, body: JSON.stringify(body) });
  if (!r.ok) throw new Error(`page ${pageNum}: ${r.status}`);
  return r.json();
}

const stats = await (await fetch(`${API}/applications/stats`, { headers: UA })).json();
const first = await page(0);
const now = [...first.applications];
for (let p = 1; p < Math.ceil(first.totalApplications / first.pageSize); p++) now.push(...(await page(p)).applications);
const byId = new Map(now.map((r) => [r.applicationHumanReadableId, r]));

const reveal = JSON.parse(readFileSync(path.resolve("data/icann/aps-derived.json"), "utf8")).list;
const outcome = {};
const tally = {};
for (const r of reveal) {
  if (r.applicationType === "Replacement String") continue;
  const id = r.applicationHumanReadableId;
  const mine = byId.get(id);
  const rep = byId.get(`${id}-R`);
  const o =
    mine?.applicationStatus === "Active" ? "kept"
    : rep?.applicationStatus === "Active" ? "switched"
    : mine?.applicationStatus === "Withdrawn" ? "withdrawn"
    : `other:${mine?.applicationStatus ?? "missing"}`;
  outcome[id] = o;
  tally[o] = (tally[o] ?? 0) + 1;
}
// a date once recorded stays: a later republish moves lastPublishedAt
const before = existsSync(OUT) ? JSON.parse(readFileSync(OUT, "utf8")).withdrawnOn ?? {} : {};
const withdrawnOn = {};
for (const [id, o] of Object.entries(outcome)) {
  if (o !== "withdrawn") continue;
  if (before[id]) { withdrawnOn[id] = before[id]; continue; }
  let r;
  for (let t = 1; ; t++) {
    r = await fetch(`${API}/applications/${encodeURIComponent(id)}/summary`, { headers: UA });
    if (r.status !== 429 || t === 6) break;
    await new Promise((res) => setTimeout(res, 1000 * 2 ** t));
  }
  if (!r.ok) throw new Error(`summary ${id}: ${r.status}`);
  withdrawnOn[id] = (await r.json()).applicationDetails.lastPublishedAt.slice(0, 10);
}
// counted from the list: the stats endpoint's status counts run ahead of the
// published records (25 Nov 2026: 40 withdrawn there, 21 in the list)
const active = now.filter((r) => r.applicationStatus === "Active").length;
// withdrawals ICANN has counted but not yet published (the gap closed in the
// next nightly batch on 25 Nov 2026: 19 counted ahead, 0 left after)
const statsWithdrawn = stats.applications.byStatus.find((s) => s.status === "Withdrawn")?.count ?? 0;
const pending = Math.max(0, statsWithdrawn - now.filter((r) => r.applicationStatus === "Withdrawn").length);
writeFileSync(OUT, JSON.stringify({ pulledAt: stats.generatedAt, checkedAt: new Date().toISOString(), pending, active, uniqueStrings: stats.applications.totalNumOfUniquePrimaryStrings, outcome, withdrawnOn }, null, 1));
console.log(tally);
for (const [id, o] of Object.entries(outcome)) if (o.startsWith("other")) console.log(id, o);
