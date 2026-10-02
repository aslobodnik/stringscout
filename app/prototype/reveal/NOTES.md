# Reveal layout prototype: notes

Exploratory. Mock data, throwaway code, not for merge into `main`. The routes
are `noindex`. This branch exists to judge layout before ICANN's list arrives;
the real pages get rewritten from what is decided here.

## Run

`npm run dev -- --port 3000`

- Strings view: `/prototype/reveal`
- Entities view: `/prototype/reveal/entities` (three variants, `?variant=A|B|C`,
  the floating bar, or the arrow keys)

## Mock data (`mock.ts`)

- Real: strings and applicant names already recorded as primary in
  `data/claims.ts`, Vant Nexus's three stated replacements, and Starlight
  Registry under Namecheap.
- Invented: every other replacement, which Vant Nexus replacement pairs with
  which primary, entity fields, application types, the "Mock Applicant"
  entries, and every other link between entities. No link is invented between
  two real companies.
- 97 applications, kept under 100.

## Dates (ICANN announcement, 29 Sep 2026)

| Date | Event |
|---|---|
| 7 Oct, 18:00 UTC | Reveal Day, published on the Application Publication and Statistics site |
| 8 to 21 Oct | Replacement Period (AGB §5.1.4) |
| 17 Nov | String Confirmation Day |
| 27 Nov, 23:59 UTC | 65% refund window ends (AGB §3.3.3.1); then 35%, then 20% |

The URL and format of ICANN's publication site are not known yet.

## What ICANN publishes (AGB v2 Appendix 1, "Public Posting" column)

- Public: applicant legal name, address, website (Q1-4, 10, 17-25); parent
  names (Q26-29, 36-39); names and titles of directors, officers and
  shareholders (Q104-107); who controls the applicant, financing parties
  included (Q108); string, meaning, script, phonetic form (Q116-120);
  replacement string; community, geographic, .Brand and safeguard answers;
  voluntary commitments; contention sets of identical strings.
- Not public: chosen registry service provider (Q176-178), financials, tax
  IDs, parent addresses, contact details of individuals.

## Decided so far

- Headline is one sourced sentence: "ICANN revealed N strings in N
  applications from N groups on 7 October 2026." The two counts link the two
  views.
- Under it, only the next date, with a countdown. The countdown is a plain
  placeholder; the finished one is meant to be animated.
- Strings table columns, in this order: String, Replacement, Applicant,
  Parent.
- One line per application inside a string's row, so each replacement and
  parent sits beside its own applicant.
- A knocked-out replacement is struck through with a superscript count of the
  applications that knock it out; hovering names them (AGB §5.1).
- No replacement, or no parent, prints a dash.
- No tally column and no dot leaders in this table.
- Parent is the one extra column. A declared parent prints as its name. An
  inferred tie (shared director, shared address) prints as the evidence and is
  never stated as ownership.
- Community, .Brand and Applicant Support flags come later, as tags after the
  applicant name.
- Two views: strings (lookup) and entities (who is behind what). Strings stays
  the homepage.

## Open

- Which entities variant: A table, B dossiers, C rivals grid, or a mix.
- Phones have no hover, so the names behind a struck replacement are not
  reachable there.
- Whether the homepage tally and dot leaders survive once this table replaces
  the homepage.
- Whether ICANN publishes Applicant Support status per application.
