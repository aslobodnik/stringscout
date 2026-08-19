# Stringscout

Read the Contributing section of README.md before changing anything in `data/`. It carries the house rules, and they are not stylistic preferences: applied-only, one primary source per applicant, no editorializing, and a fixed vocabulary (strings, disclosed, overlap).

Everything the site renders comes from `data/`. Contention, overlap counts, punycode, and markers are derived in `lib/derive.ts` and never stored. Add facts to `data/`, not to components.

`npm run build` must pass before you open a PR.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
