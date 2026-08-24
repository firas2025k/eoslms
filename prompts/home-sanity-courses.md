# Wire home page course cards to Sanity

## Goal

Replace the three hardcoded course cards on `/` with cards fetched from seeded Sanity content via the existing `COURSES_LIST_QUERY`. Keep the home layout and design unchanged; only the card data source changes.

## Skills read

- `AGENTS.md` — pages are read-only; fetch server-side; token never in the browser; match existing UI; do not overbuild.
- Existing course-page patterns (`prompts/course-page.md`) — `sanityFetch`, format helpers, `urlFor` / cover images.

## Code inspected

- `app/page.tsx` — static `courses` array + brand SVG marks (`NextjsMark`, etc.).
- `sanity/lib/queries.ts` — `COURSES_LIST_QUERY` already returns title, summary, cover, level, duration (seconds), moduleCount, slug, popular.
- `lib/format.ts` — `formatDuration`, `formatLevel`, `formatModuleCount`.
- `components/ui/card.tsx` — `CourseCard` accepts optional `thumbnail` node or letter fallback; not yet a link.
- Seed has ~10 courses; home PNG shows a 3-column grid — show a limited featured set, not the full catalog.

## Decisions and assumptions

- Convert `Home` to an async Server Component; fetch with `sanityFetch({ query: COURSES_LIST_QUERY, tags: ['course'] })`.
- Show **up to 3 courses**: prefer `popular == true` first, then fill by title order (query already orders by title — sort in JS: popular first, take 3). If fewer than 3 exist, show what exists.
- Use Sanity **cover images** (via `urlFor` + `next/image` or a small image thumbnail in the card) instead of the hardcoded brand SVGs. Letter fallback if cover missing.
- Format level / duration / module count with `lib/format.ts`.
- Wrap each card in `Link` to `/courses/[slug]` so home leads into the new course page.
- Lightly extend `CourseCard` only if needed (e.g. optional `href`, cover `src`/`alt`, or accept a cover image slot). Prefer minimal API change.
- Do **not** build `/courses` catalog in this pass. Hero, search, header, footer strip stay presentational.
- Empty state: if fetch returns no courses, hide the grid (or show a short “No courses yet” line) — no fake cards.

## Files expected

**Change**

- `app/page.tsx` — fetch + map Sanity courses into cards.
- `components/ui/card.tsx` — only if needed for link/cover support.

**Reuse**

- `sanity/lib/fetch.ts`, `COURSES_LIST_QUERY`, `lib/format.ts`, `sanity/lib/image.ts`.

No schema, seed, or new routes.

## Requirements

1. Home “All Courses” cards reflect live seeded Sanity data (titles, summaries, meta).
2. Cards link to `/courses/[slug]`.
3. At most 3 cards; popular preferred.
4. No Sanity token in the client bundle.
5. Visual structure of home stays aligned with `design/vertex-home.png` (3-column cards).

## Security

- Server-only fetch. No client Sanity client. No secrets.

## Acceptance criteria

- [ ] Hardcoded demo course array removed from `app/page.tsx`.
- [ ] Cards show real seed titles (e.g. “Next.js App Router in Depth”, not the old PNG demo strings unless seed matches).
- [ ] Clicking a card opens that course detail page.
- [ ] Typecheck, lint, and build pass.

## Checks

1. `npm run typecheck`
2. `npm run lint`
3. `npm run build`

## Manual test steps

1. `npm run dev` → `/`
2. Confirm three (or fewer) cards match Studio/seed content.
3. Click a card → `/courses/<slug>` loads.
4. Change a course title in Studio (or rely on seed) and refresh — home updates after revalidation/refresh.
