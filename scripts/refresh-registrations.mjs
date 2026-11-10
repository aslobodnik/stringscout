// Refresh data/existing-tlds/registration-counts.json from nTLDData
// (ntlddata.com, CC BY 4.0). Registry-reported counts come from ICANN's
// monthly registry reports, about three months behind; zone counts are the
// day of the pull. The TLD list stays as it is; only counts and summary move.
//   node scripts/refresh-registrations.mjs
import { readFile, writeFile } from "node:fs/promises";

const FILE = "data/existing-tlds/registration-counts.json";
const API = "https://ntlddata.com/api/v1/tld";

async function pull() {
  const rows = [];
  let meta;
  for (let page = 1; ; page++) {
    const r = await fetch(`${API}?scope=all&per=500&page=${page}`);
    if (!r.ok) throw new Error(`page ${page}: HTTP ${r.status}`);
    const body = await r.json();
    meta = body.meta;
    rows.push(...body.data);
    if (body.data.length === 0 || rows.length >= meta.total) break;
  }
  if (rows.length !== meta.total) throw new Error(`pulled ${rows.length} of ${meta.total} TLDs`);
  return { rows, meta };
}

const monthName = (ym) =>
  new Date(Date.UTC(Math.floor(ym / 100), (ym % 100) - 1)).toLocaleString("en", { month: "long", year: "numeric", timeZone: "UTC" });

const snapshot = JSON.parse(await readFile(FILE, "utf8"));
const { rows, meta } = await pull();
const byTld = new Map(rows.map((r) => [r.tld, r]));
const before = new Map(snapshot.proposed.map((r) => [r.tld, r.registeredDomains]));
const dropped = [];

for (const row of snapshot.proposed) {
  const n = byTld.get(row.ascii);
  if (!n && row.source) dropped.push(row.tld);
  Object.assign(row, n
    ? {
        registeredDomains: n.reported_domains ?? null,
        reportingMonth: n.reported_month ?? null,
        zoneDomains: n.domains ?? null,
        zoneSnapshotDate: n.domains == null ? null : meta.zone_data_date,
        source: `${API}/${row.ascii}`,
      }
    : { registeredDomains: null, reportingMonth: null, zoneDomains: null, zoneSnapshotDate: null, source: null });
}

const months = new Map();
for (const r of snapshot.proposed) if (r.reportingMonth) months.set(r.reportingMonth, (months.get(r.reportingMonth) ?? 0) + 1);
const month = [...months].sort((a, b) => b[1] - a[1])[0][0];
const counted = snapshot.proposed.filter((r) => typeof r.registeredDomains === "number");
const uncounted = snapshot.proposed.filter((r) => typeof r.registeredDomains !== "number");

snapshot.checkedAt = new Date().toISOString().slice(0, 10);
snapshot.measure = `Registry-reported registered domains, ${monthName(month)}. Daily zone counts are separate. Counts provide context and do not limit inclusion.`;
snapshot.summary = {
  proposed: snapshot.proposed.length,
  gtldsAtLeast500: counted.filter((r) => r.registeredDomains >= 500).length,
  gtldsAtLeast10000: counted.filter((r) => r.registeredDomains >= 10000).length,
  countryCodesWithoutComparableCount: uncounted.filter((r) => !byTld.has(r.ascii)).length,
  upcomingWithoutReportedCount: uncounted.filter((r) => byTld.has(r.ascii)).length,
  gtldsBelow500: counted.filter((r) => r.registeredDomains < 500).length,
};

await writeFile(FILE, JSON.stringify(snapshot, null, 2) + "\n");

const changed = snapshot.proposed.filter((r) => r.registeredDomains !== before.get(r.tld)).length;
console.log(`reporting month ${month} (${monthName(month)}), zone data ${meta.zone_data_date}`);
console.log(`counts changed for ${changed} of ${snapshot.proposed.length} TLDs`);
if (months.size > 1) console.log(`mixed reporting months: ${[...months].map(([m, c]) => `${m}×${c}`).join(", ")}`);
if (dropped.length) console.log(`no longer in nTLDData, counts cleared: ${dropped.join(", ")}`);
