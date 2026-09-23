# Explore

Run `npm install` and `npm run dev -- --port 3000`, then open
http://localhost:3000/explore. The separately managed search API runs on port
3001 in development. No search-provider key is needed in this repository.

The browser calls the API directly. Development defaults to
`http://localhost:3001/api/explore`; production defaults to
`https://api.stringscout.com/api/explore`. Override the full endpoint at build
time with `NEXT_PUBLIC_EXPLORE_API_URL` if needed.

Enter or the Explore button submits a word or phrase, up to 120 characters.
Ten result pills appear by default. Selecting a pill submits that string as a
new query. Changing the number of visible results does not call the model again.

`POST /api/explore` accepts `{ "query": "ski" }` and returns `query`, ranked
`results` (`tld`, optional `gloss`, and `score`), and `metrics` (`serverMs` and
`evaluated`). Scores are estimates of a connection, not proof of a domain's
availability. The catalog count shown on the page comes from `stringRows()`.

Show details exposes the complete ranking in increments of 20, highlights the
chosen pill cutoff, and reports browser round-trip time and server time. Browser timing includes the
local API request and response parsing, but not painting; first dev requests
can include compilation. Diagnostics are held in page memory, not stored.

## Later

- Select two strings and explore how they are related.
- Try search while typing with a roughly 300 ms debounce after tuning quality.
- Revisit defaults (pill count and weak-score cutoff) after testing.
- Consider reveal-day and replacement-string exploration when that data arrives.

This prototype is for local testing first; it has not been deployed.
