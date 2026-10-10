import { buildReal } from "@/app/prototype/reveal/real";
import { stats as preReveal } from "@/lib/derive";
import { SITE, lastUpdated } from "@/data/meta";

// llmstxt.org: a markdown brief at a fixed path, so a model reaching for this
// site gets the shape of the data, the terms, and what a reader only finds by
// hovering or by knowing the address, before it starts parsing pages.
// Generated, so the counts cannot drift from the tables.
export const dynamic = "force-static";

export function GET() {
  const s = buildReal().stats;
  const old = preReveal();
  const n = (x: number) => x.toLocaleString("en-US");
  const body = `# Stringscout

> Every string applied for in ICANN's 2026 new gTLD round, who applied, and
> who stands behind them: ${n(s.strings)} strings in ${n(s.applications)} applications from
> ${n(s.groups)} applicants, ${n(s.sets)} strings in contention. From ICANN's own record,
> published on Reveal Day, 7 October 2026. Last updated ${lastUpdated}.

## Read the terms exactly

- **String**: the applied-for gTLD. An IDN prints in its own script with the
  punycode A-label (\`xn--\`) under it; searching \`xn\` finds them all.
- **Application**: one filing for one string. A string can have several.
- **Contested**: two or more applications for the same string, a contention
  set. **Uncontested**: one.
- **Replacement**: the one alternative string an application may name
  (AGB §5.1). **Live** when no other application applied for it or named it,
  **blocked** otherwise. A blocked replacement is struck through, with the
  number of applications that block it.
- **Parent**: the direct parent the application names (AGB Q26), else the
  ultimate parent (AGB Q36). Applicants under one parent are one group.
- **People**: everyone an application names as director, officer or partner,
  executive, material shareholder or ultimate controller (AGB Q104 to Q108),
  ${n(s.people ?? 0)} in all.
- **Kind**: brand, community, geo, closed or open, as the application
  designates the string (AGB Q179, Q185 to Q187).

## Pages

- [Strings](${SITE}/): every string, its applications, their replacements,
  applicants and parents. Sort by string or by number of applications; filter
  by contested or uncontested and by replacement live, blocked or none.
- [Applicants](${SITE}/applicants): each group and the entities in it, most
  applications first, with the people its records name.
- [Overlaps](${SITE}/overlap): pick a person; it lists everyone who shares a
  contention set with them, most strings shared first. AGB §5.2.3.1 bars
  applicants in one contention set from discussing their applications.
- [Explore](${SITE}/explore): type a word or phrase, get related strings.

## Not in the menu

- [People](${SITE}/people): every person the applications name and what they
  stand behind, a hundred a page.
- [Withdrawn](${SITE}/withdrawn): strings announced before the round and pulled
  before an application reached ICANN.
- [Sources](${SITE}/sources): the public sources behind the pre-reveal record.
- [Archive](${SITE}/archive): the pre-reveal record, ${n(old.strings)} strings applicants
  disclosed themselves before ICANN published its list, each with its source.
  [As JSON](${SITE}/strings.json). Both are the pre-reveal record, not ICANN's list.

## In the address, not on the page

The pages read their state from the URL, so a link can carry a search:

- \`/?q=<text>\` searches strings, applicants and parents.
  \`/?by=string|applicant|parent|person&q=<name>\` searches one column;
  \`person\` matches the people each application names.
- \`/applicants?q=<text>\` and \`/people?q=<text>\` search those lists.
- \`/overlap?me=<person>&with=<name>\`: the page writes both picks into the URL
  as you make them, so copy the link it leaves.

## Shown only on hover

On the strings page these sit in tips; nothing on the page prints them:

- an applicant's name: the people its application names;
- a parent's name: the people across every entity under it;
- a struck replacement: which applications block it;
- an IDN string: its English, written by us from the meaning the applicant gave.

The people are printed in full on Applicants and People.

## Citing this

The reveal-day pages are ICANN's published record; cite ICANN's application.
The pre-reveal pages cite each applicant's own post, press release or the
trade-press report it came from; cite that source.
`;
  return new Response(body, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "public, max-age=3600",
    },
  });
}
