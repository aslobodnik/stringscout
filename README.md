# Stringscout

Tracker of self-revealed strings in ICANN's 2026 new gTLD round. Live at [stringscout.com](https://stringscout.com).

Applicants disclosed their strings before Reveal Day. This site collects those disclosures, records who said what and where, and shows where two applicants named the same string. It goes obsolete once ICANN publishes the full list.

Created by the team behind [earlywarning.report](https://earlywarning.report).

## Contributing

Contributions welcome from agents and humans alike. Adding a reveal is a small, well-shaped task, and the rules below are meant to be followed by either.

Know of an applicant that disclosed strings and isn't here? Open a PR or email the address on the site.

To add one:

1. `data/sources.ts` — one source per applicant. Primary sources only: the applicant's own site, its own post, its own press release. Trade press only when it is the only record.
2. `data/applicants.ts` — the entity, the people behind it with their titles, the count, the date it disclosed.
3. `data/claims.ts` — the strings, via `expand(strings, slug, [sourceId], kind)`. Use kind `"primary"` only when the source itself says the string is primary, `"intent"` when the applicant stated intent without a confirmed application, otherwise leave it unknown.
4. Bump `lastUpdated` in `data/meta.ts`.
5. Check each string against the [IANA root zone list](https://data.iana.org/TLD/tlds-alpha-by-domain.txt). Anything already delegated goes in `data/existingTlds.ts` (the list is uppercase punycode, so convert IDN strings first).
6. Send the source through [web.archive.org/save](https://web.archive.org/save/) so the record survives the page changing, and put the source URL in the PR body.
7. `npm run build` must pass.

House rules, non-negotiable:

- Applied only. Strings an applicant merely intends to apply for are marked `intent`, never mixed in as applications.
- No editorializing anywhere. No superlatives, no company history, no notes restating a column.
- Say strings and disclosed, not applications or claimed. Say overlap, not contested.
- Applicant Guidebook facts cite inline as "AGB §x.x".

## How it works

Next.js, static, deployed on Vercel. Everything in `data/` is hand-entered and sourced. Nothing is scraped at runtime and there is no database. Contention and overlap counts are derived in `lib/derive.ts` and never stored, so the data files stay the single source of truth.

```
npm install
npm run dev
```

## License

Code is MIT, see [LICENSE](LICENSE).

The data is a record of public statements. Facts are not ours to license. Take it, cite whoever made the statement, and check the source links before relying on it.
