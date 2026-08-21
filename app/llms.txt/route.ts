import { stats } from "@/lib/derive";
import { sources } from "@/data/sources";
import { SITE, lastUpdated } from "@/data/meta";

// llmstxt.org: a markdown brief at a fixed path, so a model reaching for this
// site gets the shape of the data and the one caveat that matters before it
// starts parsing pages. Generated, so the counts cannot drift from the table.
export const dynamic = "force-static";

export function GET() {
  const s = stats();
  const body = `# Stringscout

> The public record of self-revealed strings in ICANN's 2026 gTLD round:
> ${s.strings} strings from ${s.applicants} applicants, ${s.contested} of them disclosed by more than
> one applicant. Every fact links to its source. Last updated ${lastUpdated}.

ICANN keeps the applied-for list private until Reveal Day, expected October
2026. This site records only what applicants have said publicly themselves.

## Read the terms exactly

- **Disclosed**, not "applied": an applicant said it publicly. Say strings and
  disclosed, never applications or claimed.
- **Overlap**: two or more applicants disclosed the same string. Not a formal
  ICANN contention set, which does not exist until Reveal Day.
- **Markers** on every claim: \`p\` stated primary, \`u\` unknown whether primary
  or secondary, \`i\` announced intent only. An \`i\` is **not** an application
  and is counted separately.
- **Withdrawn** strings were announced and then pulled before filing. They are
  listed for the record and counted nowhere else.

## Data

- [All strings as JSON](${SITE}/strings.json): the full table as one file,
  one object per string, with applicants, markers and source URLs.

## Pages

- [Strings](${SITE}/): every disclosed string, its applicants, its sources.
- [Applicants](${SITE}/applicants): each entity, who is behind it, how many
  strings it has named.
- [Sources](${SITE}/sources): all ${sources.length} of them, grouped by how close
  each is to the applicant.
- [Withdrawn](${SITE}/withdrawn): announced and then pulled, with the document
  recording each withdrawal.

## Citing this

Cite the underlying source, not this site. Every row carries the applicant's
own post, press release or the trade-press report it came from, and those are
the record. Stringscout is a compilation of them.
`;
  return new Response(body, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "public, max-age=3600",
    },
  });
}
