# Explore

Run `npm install` and `npm run dev -- --port 3000`, then open
http://localhost:3000/explore. The separately managed search API runs on port
3001 in development. No search-provider key is needed in this repository.

The browser calls the API directly. Development defaults to
`http://localhost:3001/api/explore`; production defaults to
`https://api.stringscout.com/api/explore`. Override the full endpoint at build
time with `NEXT_PUBLIC_EXPLORE_API_URL` if needed.

Enter or the Explore button submits a word or phrase, up to 120 characters.
The single-line search bar uses an inline text button and a small character count below it.
Ten result pills appear by default, with inline buttons to show 10 or 25.
Selecting a pill submits that string as a new query. The browser requests the top 25 once per search;
changing the number of visible results makes no new API request.
Previous results remain visible while the next search runs. Loading feedback
shares the fixed-height character-count row; completed results are announced only
to screen readers, keeping the visible layout compact.

`POST /api/explore` accepts `{ "query": "ski", "limit": 25 }` and returns `query`, ranked
`results` (`tld`, optional `gloss`, and `score`), and `metrics` (`serverMs` and
`evaluated`). Scores are estimates of a connection, not proof of a domain's
availability. The API defaults to 10 results and caps the response at 25.

Scores and timing remain available in the API response for analysis, but are
not displayed in the customer interface. There is no diagnostics panel.

## Later

- Select two strings and explore how they are related.
- Try search while typing with a roughly 300 ms debounce after tuning quality.
- Revisit defaults (pill count and weak-score cutoff) after testing.
- Consider reveal-day and replacement-string exploration when that data arrives.

The Explore page is available at https://stringscout.com/explore.
