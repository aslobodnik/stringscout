import { applicantMarks, stringRows } from "@/lib/derive";
import { sourceById, sourceIndex } from "@/data/sources";
import { SITE, lastUpdated } from "@/data/meta";

// The machine-readable copy of the table. The CSV button builds the same rows
// in the browser; an agent should not have to run our JavaScript to read a
// public record, so the same facts are served here as a plain file.
export const dynamic = "force-static";

export function GET() {
  const rows = stringRows().map((r) => ({
    string: r.tld,
    punycode: r.punycode,
    english: r.gloss ?? null,
    overlap: r.contested,
    applicantCount: new Set(r.claims.map((c) => c.applicantSlug)).size,
    existingTld: r.existing,
    issues: r.issues.map((i) =>
      i.kind === "delegated" ? "existing tld" : `${i.kind} of .${i.other}`
    ),
    applicants: applicantMarks(r.claims).map((a) => ({
      name: a.name,
      // p: stated primary, u: unknown if primary or secondary, i: intent only
      marker: a.mark,
      sources: a.sourceIds
        .map((id) => sourceById.get(id))
        .filter((s) => !!s)
        .map((s) => ({ n: sourceIndex.get(s.id), outlet: s.outlet, url: s.url })),
    })),
  }));

  return Response.json(
    {
      about: `Self-revealed strings in ICANN's 2026 gTLD round. Every fact carries its source. ${SITE}`,
      lastUpdated,
      // an announced intent is not an application; markers say which is which
      note: "marker i = announced intent only, not a confirmed application. Withdrawn strings are at /withdrawn and counted nowhere here.",
      count: rows.length,
      strings: rows,
    },
    { headers: { "cache-control": "public, max-age=3600" } }
  );
}
