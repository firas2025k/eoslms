# Implement a simple All Courses catalog page

## Goal

Add `/courses` as a simple catalog that lists **all** seeded Sanity courses. Reuse existing `CourseCard`, fetch helpers, and header patterns. No dedicated catalog design PNG exists — keep layout minimal and consistent with home/course pages.

## Skills read

- `AGENTS.md` — pages are read-only; server fetch; match existing UI tokens; do not overbuild.
- Existing home + course-page patterns (`COURSES_LIST_QUERY`, `SanityImage`, format helpers).

## Code inspected

- Home already fetches via `COURSES_LIST_QUERY` and renders linked `CourseCard`s (limit 3).
- Course detail lives at `app/courses/[slug]/page.tsx`; catalog must be `app/courses/page.tsx` (sibling, not conflicting).
- Breadcrumbs / “View all courses” / Explore Courses already point at `/courses`.
- No `design/vertex-catalog.png` — invent nothing fancy.

## Decisions and assumptions

- **Route:** `app/courses/page.tsx` — async Server Component.
- **Data:** `sanityFetch({ query: COURSES_LIST_QUERY, tags: ['course'] })` — all courses, title order from query.
- **Layout:** Header (`activeHref="/courses"`, `showSearch={false}`), page title “All Courses”, short supporting line optional, responsive 1 / 2 / 3 column card grid. Same subtle grid background as home.
- **Cards:** Same mapping as home (cover via `urlFor`, format helpers, link to `/courses/[slug]`). Extract a tiny shared helper (e.g. `lib/course-card-props.ts` or inline duplicate kept small) only if it avoids real duplication pain — prefer a short shared mapper over copy-paste.
- **Empty state:** One line “No courses yet.” if none.
- **Out of scope:** Filters, sort controls, search, pagination, categories sidebar, Popular badge on cards (unless already on CourseCard — it is not), progress, PostHog.

## Files expected

**Add**

- `app/courses/page.tsx`

**Optionally change**

- Small shared cover/mapper util used by home + catalog (only if both stay cleaner).

## Requirements

1. `/courses` lists every Sanity course as a linked card.
2. Header marks Courses active.
3. No token in the client; server fetch only.
4. Typecheck / lint / build pass.

## Security

- Server-only Sanity fetch. No writes.

## Acceptance criteria

- [ ] `/courses` renders the full seeded catalog.
- [ ] Each card opens `/courses/[slug]`.
- [ ] Home “View all courses” / Explore Courses no longer 404.
- [ ] Simple, on-brand, responsive grid — no extra chrome.

## Checks

1. `npm run typecheck`
2. `npm run lint`
3. `npm run build`

## Manual test steps

1. `npm run dev` → `/courses`
2. Confirm all seeded courses appear; click one → detail page.
3. From home, “View all courses →” lands here.
