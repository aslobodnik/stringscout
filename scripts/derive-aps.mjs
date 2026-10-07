// Boils data/icann/aps/ (the raw pull, 159 MB, not in git) down to the one
// file the site reads: data/icann/aps-derived.json. Re-run after pull-aps.mjs.
//   node scripts/derive-aps.mjs
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";

const ROOT = path.resolve("data/icann/aps");
const OUT = path.resolve("data/icann/aps-derived.json");
// the AGB answers the site uses, by question number
const KEEP = ["4", "10", "20", "22", "25", "26", "36", "104", "105", "106", "107", "108", "179", "186"];

const list = JSON.parse(readFileSync(path.join(ROOT, "list.json"), "utf8"));
const stats = JSON.parse(readFileSync(path.join(ROOT, "stats.json"), "utf8"));
const answers = {};
let missing = 0;
for (const r of list) {
  const id = r.applicationHumanReadableId;
  const p = path.join(ROOT, "applications", id, "responses.json");
  if (!existsSync(p)) { missing++; continue; }
  const d = JSON.parse(readFileSync(p, "utf8"));
  const a = {};
  for (const s of d.questionAndResponses.sections)
    for (const q of s.questions ?? []) {
      const n = q.questionText.match(/^AGB Q?(\d+(?:\.\d+)?)\b/)?.[1];
      const t = (q.responseText ?? "").trim();
      if (n && t && KEEP.includes(n)) a[n] = t;
    }
  const sp = path.join(ROOT, "applications", id, "summary.json");
  if (existsSync(sp)) {
    const s = JSON.parse(readFileSync(sp, "utf8"));
    if (s.applicantDetails?.organizationWebsite) a.website = s.applicantDetails.organizationWebsite;
  }
  answers[id] = a;
}
const rows = list.map((r) => ({
  applicationHumanReadableId: r.applicationHumanReadableId,
  primaryString: r.primaryString,
  organizationName: r.organizationName,
  organizationCountryCode: r.organizationCountryCode,
  icannRegion: r.icannRegion,
  variants: r.variants,
  tldTypes: r.tldTypes,
  applicationType: r.applicationType,
}));
writeFileSync(OUT, JSON.stringify({ pulledAt: stats.generatedAt, list: rows, answers }));
console.log(`${rows.length} applications, ${Object.keys(answers).length} with answers, ${missing} missing; ${(readFileSync(OUT).length / 1e6).toFixed(1)} MB`);
