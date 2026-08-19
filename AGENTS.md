# Stringscout

Everything the site renders comes from `data/`. Overlap counts, punycode, and markers are derived in `lib/derive.ts` and never stored. Add facts to `data/`, not to components. `npm run build` must pass before you open a PR.

## Adding a reveal

1. `data/sources.ts` — one source per applicant. Primary sources only: the applicant's own site, its own post, its own press release. Trade press only when it is the only record.
2. `data/applicants.ts` — the entity, the people behind it with their titles, the count, the date it disclosed.
3. `data/claims.ts` — the strings, via `expand(strings, slug, [sourceId], kind)`. Use kind `"primary"` only when the source itself says the string is primary, `"intent"` when the applicant stated intent without a confirmed application, otherwise leave it unknown.
4. Bump `lastUpdated` in `data/meta.ts`.
5. Check each string against the [IANA root zone list](https://data.iana.org/TLD/tlds-alpha-by-domain.txt). Anything already delegated goes in `data/existingTlds.ts` (that list is uppercase punycode, so convert IDN strings first).
6. Send the source through [web.archive.org/save](https://web.archive.org/save/) so the record survives the page changing, and put the source URL in the PR body.

## House rules

These are not stylistic preferences.

- Applied only. A string an applicant merely intends to apply for is marked `intent`, never mixed in as an application.
- No editorializing anywhere. No superlatives, no company history, no notes restating a column.
- Say strings and disclosed, not applications or claimed. Say overlap, not contested.
- Applicant Guidebook facts cite inline as "AGB §x.x".

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
