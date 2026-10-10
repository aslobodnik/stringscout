# Style guide

How the site already looks and behaves, written down so new pages match it
without being told. Every rule here is taken from shipped code; the file named
beside it is the reference implementation. Before building a new surface, find
the closest existing one and copy its structure, classes included. Invent a
pattern only when nothing below fits, and then add it here.

## The rule that prevents most rework

A new table, toolbar, tile row or header starts as a copy of the existing one.
`components/StringsTable.tsx` is the reference for anything tabular. If the new
thing has a string column and an applicants column, they are the homepage's
string column and applicants column, unchanged, with new columns added around
them.

## Tokens (`app/globals.css`)

| Token | Value | Use |
|---|---|---|
| `paper` | `#f4efe3` | page ground |
| `paper-deep` | `#ece5d3` | hover, selected, tooltip ground |
| `ink` | `#211d15` | text, solid rules, selected segment fill |
| `ink-soft` | `#6b6353` | secondary text, labels at rest |
| `rule` | ink at 25% | dividers, link underlines at rest |
| `rule-faint` | ink at 12% | row borders |
| `gold` | `#8a5f1a` | the dot of a TLD, hover, focus, the active pick, cite numbers |
| `oxblood` | `#6e2a24` | a filter that is on, issues, overlap, latest, anything to act on |

Light theme only. No gradients, shadows, rounded corners or blur on the
content. Colour never carries meaning alone: oxblood always comes with a
number, a strike, a tag or a dagger.

## Type

- Jost for everything; Old Standard TT (`.serif`) for the page's one italic
  sentence, glosses, and asides such as "No strings match."
- `.label`: uppercase, 0.18em tracking, 11px, weight 500. Column heads, tile
  captions, buttons, section heads. Shrinks to `!text-[10px]` and tighter
  tracking (`!tracking-[0.08em]`) below `sm`, never smaller than 9px.
- `tabular-nums` is on `body`; counts change in place.
- Body copy in tables is `text-sm`. Tile numbers are `text-2xl sm:text-3xl
  font-light`.

## Page skeleton

- Shell is in `app/layout.tsx`: `max-w-5xl`, `px-6 sm:px-8`. Pages never set
  their own width.
- `TopBar` (wordmark + nav) then a header: one serif italic sentence that
  states what the page is, with a `Dateline` under it (`app/page.tsx`).
  Inner pages use `PageHeader` with an uppercase title instead.
- Sections are `<section className="mb-14">` opened by `SectionHead` (double
  rule, label title, `count · numeral` at the right).
- `Footer` is in the layout. Do not add another.

## Components to reuse, not rebuild

| Need | Use | Notes |
|---|---|---|
| A string | `Tld` | gold dot, then the label. Never type the dot by hand. |
| Hover detail | `Tip` | parent carries `group relative`. Never a native `title`. Hidden below `sm`, so nothing may exist only in a Tip on phones unless that loss is accepted. |
| Section opener | `SectionHead` | |
| Count tiles | `strings-table/StatTiles.tsx` | 2x2 below `sm`, 4 across above, `border border-ink`. A tile is a filter: `bg-paper-deep` when on, number and caption oxblood when the filter is a narrowing one. Captions carry a dotted underline. |
| Source cite | `strings-table/Cite.tsx` | gold superscript number linking to `/sources#src-N`, outlet and date on hover. |
| Issue tag | `strings-table/IssueTag.tsx` | 9px oxblood label after the string: `existing tld`, `plural of .x`, `near .x`. Wording comes from `lib/issues.ts`. |
| Marker | `strings-table/Marker.tsx` | 13px square letter block; weight falls with certainty (solid, outline, hairline). |
| Overlap count | `strings-table/Tally.tsx` | straight strokes, one per applicant, every fifth struck across the four before it; right-aligned. |
| Active filter | `FilterChip` in `StringsTable.tsx` | oxblood outline, `×`, `h-7`. |
| Dates | `formatDate` in `lib/format.ts` | `15 Aug 2026`. |
| Stagger | `pressDelay` in `lib/press.ts` | with `.press-word` and `.row-press`. |

## Tables

Reference: `components/StringsTable.tsx`, `app/applicants/page.tsx`.

- `w-full table-fixed text-sm border-collapse` with a `colgroup`, so widths do
  not move when the rows change. String column `w-32 sm:w-44`.
- Column heads: `label text-ink-soft pb-2 pr-4 font-medium`, left-aligned; the
  last numeric column right-aligned.
- Rows: `border-t border-rule-faint align-top`, cells `py-2 pr-4`. No zebra, no
  row hover fill.
- String cell: `font-medium`, `Tld`, issue tags after it.
- **Applicants cell.** All applicants of a string sit in one cell, joined by
  ` · ` in `text-ink-soft`. Each name is a button: `underline decoration-rule
  underline-offset-2 hover:decoration-gold`, and `text-gold decoration-gold`
  when it is the active filter. Clicking a name filters the table to that
  applicant. Marker and cite follow the name inside the same
  `whitespace-nowrap` span.
- **Dot leader and tally.** After the names, a dotted leader
  (`tally-leader flex-1 min-w-4 -translate-y-[3px] border-b border-dotted`)
  runs to the last column, which holds the `Tally`. Leader is
  `border-oxblood/40` when the string has more than one applicant,
  `border-rule-faint` otherwise. Names carry `data-applicant={i}` so hovering a
  name lights its stroke and the reverse.
- One row per string, its applicants on one line that wraps naturally. The
  one exception: when other columns hold values that belong to a single
  applicant (its replacement string, its parent), the row stacks one line per
  application, each value beside the applicant it belongs to. Keep it one
  `<tr>` with the lines stacked inside the cell. Never list the values on one
  line and the applicants on another and leave the reader to pair them.
- Empty value is a dash in soft ink, `<span className="text-ink-soft">—</span>`,
  as on `/applicants`. Not "none", not a zero, not a blank cell.
- Superscripts: oxblood `n` for a count, oxblood `†` for an issue, gold number
  for a cite. A legend line names them once, above the list. In a merged row
  of people (`/overlap`), an oxblood `n` after a person's name is the strings
  that person shares, printed only when fewer than the row's. It is rare, so
  a `Tip` ("6 of 7 strings") explains it instead of the legend, and phones go
  without.
- Struck-through text (`line-through decoration-oxblood text-ink-soft`) means
  ruled out. The count of what rules it out is an oxblood superscript; the
  names are in a `Tip`.

## Controls

- Height `h-10` for toolbar controls, `h-7` for chips. Square corners.
  `border border-ink`, transparent ground.
- Search: `w-full sm:w-44`, placeholder `Search…`, `focus:border-gold
  focus:outline-none`. `text-base` below `sm` so iOS does not zoom.
- Buttons are `.label` text. At rest ink on paper; hover `bg-paper-deep` and
  `border-gold`. A segmented control is one `border border-ink` box with
  `border-l` between segments, selected segment `bg-ink text-paper`.
- No browser-native `select`; use the site's own (`ApplicantSelect.tsx`).
- Toolbar order: search, selects, view toggles, CSV. Under it, flush left: the
  count (`label text-ink-soft`, in a slot the width of the search box), then
  the chips for whatever is filtering.
- Every interactive element: `cursor-pointer` and `focus-visible:outline-2
  focus-visible:outline-gold`.
- Hover, the standard: nothing changes on hover without a transition, and the
  transition is `duration-200 ease-in-out`, which runs both ways, in and out.
  `transition-colors` for colour, underline and border changes;
  `transition-opacity` or `transition-transform` when that is what moves.
  300 ms for the tip (`Tip.tsx`), the dot leader, the tally strokes and a
  results crossfade. Never the Tailwind default (150 ms, no curve) and never
  `transition` with no duration. Off under `prefers-reduced-motion`.
- Links in text: `underline decoration-rule underline-offset-2
  hover:decoration-gold`.
- Search with suggestions: `app/prototype/reveal/SearchBox.tsx` (the strings
  page's box without its column choice). Box `sm:w-80`; suggestions name their
  kind at the right in a 9px label; count and clear chip under it. It reads
  `?q=` after mount. Matching lives in `app/prototype/reveal/search.ts`.
- Searching a list that reads more than the row shows: the row stays, and a
  line under it says why in `text-xs`, the reason word serif italic soft ink,
  the name in ink: "names Eric Trump", "named by Toddler Logic, LLC". A matched
  string moves to the front of its list (`StringFold pin`) rather than getting a
  line. A query that lands on one row opens it; the caret still closes it.
- Long lists are one list, most applications first. Up to about a thousand
  rows render whole, as the strings and applicants pages do. Beyond that
  (people, 3,307) a hundred a page: `app/prototype/reveal/Pager.tsx` under
  the table, flush left. The range ("1 to 100 of 3,307") in the count's label
  style in the search-box-width slot, then `← Previous`, `n / pages`,
  `Next →` as `h-7` label buttons with the toolbar-control border; the arrow
  keys turn pages when the reader is not in a field. Nothing when one page
  holds all. No "long tail" section: a second heading hid most of the list.

## Motion

Type settles once on load (`.press-word`) and rows settle when the slice
changes (`.row-press`, keyed `tbody`). Tally strokes draw in. Nothing loops,
counts up, or fades in for decoration. Everything is off under
`prefers-reduced-motion`.

## Words

House rules in `AGENTS.md` apply to interface copy too.

- State facts. No superlatives, no adjectives about applicants, no sentences
  that restate a column.
- Say it once. If a number is in a tile it is not also in a paragraph. If a
  state is shown by a mark (strike, square, dagger) it does not also get a
  label on every row; the legend explains the mark once.
- Lead with the fact and its source: "ICANN revealed N strings on 7 October
  2026." followed by a cite.
- Dates as `7 Oct` or `7 Oct 2026`, ranges as `8 to 21 Oct`. Times in UTC.
- No em dashes.
- Guidebook facts cite inline as `AGB §x.x`.

## Small screens

- Check 390px. No sideways page scroll; a wide table scrolls inside
  `overflow-x-auto`.
- Labels tighten rather than wrap. Long applicant names may wrap below `sm`.
- Tips do not exist below `sm`; decide what a phone reader loses and say so in
  the PR.
