# Implement the Vertex course detail page

## Goal

Build `/courses/[slug]` to match `design/vertex-course.png` and wire it to **seeded Sanity course content** via the existing server-only data layer. Read-only page: no progress API, no PostHog, no search, no lesson player.

## Skills read

- `AGENTS.md` — UI matches the reference exactly; responsive down to mobile; pages are read-only; progress / bookmark / free-preview may be presentational; module numbers derived from order; never expose the Sanity token; do not overbuild.
- `.agents/skills/sanity-best-practices/SKILL.md` + `references/nextjs.md`, `references/groq.md` — server fetch, `defineQuery` already in place, image URL builder, TypeGen types in `sanity.types.ts`.
- Next.js docs: `node_modules/next/dist/docs/01-app/01-getting-started/` — layouts/pages (dynamic `[slug]`), server vs client components, images (`remotePatterns`), linking.

## Code inspected

- Design: `design/vertex-course.png` (hero, outcomes grid, module list + “Show all”, sticky progress footer).
- Design system: tokens in `app/globals.css`; primitives `Header`, `Breadcrumbs`, `Badge`, `Button`, `Progress`, Lucide icons; home already uses the grid background pattern.
- Sanity data layer (repo root, not `lib/sanity/`): `sanity/lib/queries.ts` already has `COURSE_BY_SLUG_QUERY` and `COURSE_SLUGS_QUERY`; `sanity/lib/fetch.ts` (`sanityFetch` + cache tags); `sanity/lib/image.ts` (`urlFor`); `sanity/lib/client.ts` is `server-only` with read token.
- Schema: course → embedded `modules[]` → lesson refs; `learningOutcomes[]` with constrained `icon` string; lesson `duration` in **seconds**.
- Seed (`studio/scripts/seed/content.mjs`): real courses such as `nextjs-app-router-in-depth` (“Next.js App Router in Depth”), **4 modules × 3 lessons**, popular flag, outcomes, student counts. Copy and counts **will not match the PNG demo strings** (12 modules / 18h 24m / “Next.js for Production”) — that is expected; layout must match the PNG, data comes from Sanity.
- No `/courses` catalog or lesson routes yet. Home links to `/courses` (404 until catalog). Lesson links may target a future path.
- `next.config.ts` has no `images.remotePatterns` yet — required for Sanity CDN covers.
- `app/layout.tsx` has Clerk + fonts; no `<SanityLive />` (fetch uses tagged `client.fetch` — leave as-is).

## Decisions and assumptions

### Routing and data

- Route: **`app/courses/[slug]/page.tsx`**. Server Component. Await `params` (Next 16 Promise params pattern already used in layout types).
- Fetch with `sanityFetch({ query: COURSE_BY_SLUG_QUERY, params: { slug }, tags: ['course', \`course:${slug}\`] })`.
- `notFound()` when the query returns `null`.
- `generateStaticParams` from `COURSE_SLUGS_QUERY` so known courses prerender.
- `generateMetadata` from course title + summary.
- Extend `COURSE_BY_SLUG_QUERY` only if needed for display aggregates: prefer projecting `"duration": math::sum(modules[].lessons[]->duration)` and `"moduleCount": count(modules)` on the course (same as list query) so the page does not re-sum in JS. Re-run typegen after query edits (`npm run typegen`).
- Do **not** invent a catalog page in this pass. Breadcrumb “All Courses” links to `/courses` (may 404 until later).

### UI fidelity (PNG is layout truth; Sanity is copy truth)

Compose to match the PNG:

1. **Header** — `Header` with `activeHref="/courses"`, `showSearch={false}` (PNG has bell + avatar only).
2. **Breadcrumbs** — `All Courses` → `/courses`, current course title.
3. **Hero** — two columns: large square cover (`next/image` via `urlFor`, rounded, dark-friendly); right side: `Badge variant="popular"` when `popular`, Playfair title, summary, meta row (level · total duration · module count · student count) with orange Lucide icons (`BarChart3`, `Clock`, `FileText`, `Users`), primary **Continue Learning** + secondary **Bookmark**.
4. **What you'll learn** — section in a light card; 2×2 grid of outcome cards (icon + title + description). Map Sanity `icon` strings to Lucide components (`layers`→`Layers`, `gauge`→`Gauge`, `rocket`→`Rocket`, `workflow`→`Workflow`, `sparkles`→`Sparkles`, `shield`→`Shield`, `code`→`Code`, `puzzle`→`Puzzle`). Fallback: `Sparkles`.
5. **Course Content** — header with module count • total duration; accordion list of modules (number circle from order, title, summary, module duration, chevron). Expanded row lists lessons (title + lesson duration); lesson title links to future lesson URL.
6. **Show all N modules** — when `modules.length > 6`, collapse to first 6 and show the button; otherwise omit the button (seeded courses have 4).
7. **Sticky progress footer** — presentational only (no Clerk progress write yet): “Your Progress”, fixed demo **35%**, `Progress` bar, duplicate Continue Learning CTA. Soft orange glow at corners as on PNG (`aria-hidden`). Document that real progress replaces this later.
8. **Background** — same subtle grid treatment as home (`neutral-50` + light grid lines). Pad bottom so content clears the sticky bar.

### CTAs and presentational bits

- **Continue Learning** → first lesson of the first module that has a slug. Path convention: `/courses/[courseSlug]/lessons/[lessonSlug]` (lesson page not built; link is fine / will 404 until then). If no lessons, disable or omit the button.
- **Bookmark** — presentational `Button variant="tertiary"` (or secondary outline matching PNG); no persistence.
- CTA label: use **Continue Learning** as on the PNG even without real progress (presentational). Do not switch to “Start course” unless the PNG clearly shows that — it does not.

### Formatting helpers

- Small pure helpers (e.g. `lib/format.ts` or colocated):
  - duration seconds → `45m` / `1h 12m` / `18h 24m` (no seconds in UI).
  - student count → `2.1k` style when ≥ 1000, else plain integer.
  - level enum → title case (`intermediate` → `Intermediate`).
- Module duration = sum of its lesson `duration` values.

### Images

- Configure `next.config.ts` `images.remotePatterns` for `cdn.sanity.io` (and keep build green).
- Use `urlFor(coverImage).width(...).height(...).url()` with sensible square crop for the hero tile; `alt` from Sanity.

### Responsive

- Desktop: PNG two-column hero, 2×2 outcomes, full-width module rows, sticky footer.
- Below `md`: stack hero (image then copy), outcomes 1 column, keep sticky footer usable (stack progress + button if needed), no horizontal overflow.
- Do not invent a separate mobile visual language.

### Out of scope

- Catalog `/courses` index, lesson page, instructor page, real progress API, PostHog, search, Clerk gating (page stays public), Studio/schema changes (except optional GROQ aggregate fields already noted), reseeding or renaming seed titles to match the PNG.

## Files expected

**Add**

- `app/courses/[slug]/page.tsx` — server page (fetch, metadata, layout composition).
- `components/course/course-hero.tsx` — hero presentational (can be server).
- `components/course/learning-outcomes.tsx` — outcomes grid.
- `components/course/module-list.tsx` — client accordion + “Show all”.
- `components/course/course-progress-bar.tsx` — sticky presentational footer.
- `lib/format.ts` — duration / students / level helpers (or equivalent small util).

**Change**

- `sanity/lib/queries.ts` — add duration/moduleCount projections on `COURSE_BY_SLUG_QUERY` if not already sufficient.
- `sanity.types.ts` — regenerate via typegen after query change.
- `next.config.ts` — Sanity image remote patterns.

Reuse `Header`, `Breadcrumbs`, `Badge`, `Button`, `Progress`, `urlFor`, `sanityFetch`. Do not fork a second design language.

## Requirements

1. Visiting `/courses/nextjs-app-router-in-depth` (or any seeded course slug) renders the PNG layout with that course’s Sanity title, summary, cover, popular badge, outcomes, and modules.
2. Totals (module count, durations, students) are derived from content, not hardcoded PNG numbers.
3. Expand/collapse modules; expanded modules list lessons with links.
4. Sticky footer shows demo 35% progress + Continue Learning.
5. No Sanity token or write client in the browser bundle.
6. Unknown slug → 404.

## Security

- Fetch only through `sanity/lib/fetch.ts` / server page. Never import `sanity/lib/client` or `token` into client components.
- `urlFor` is client-safe (public project id/dataset only).
- No `dangerouslySetInnerHTML`. No user-authored HTML without sanitization (N/A here).
- Bookmark / progress UI must not write to Sanity or invent a client write path.

## Acceptance criteria

- [ ] `/courses/[slug]` matches `design/vertex-course.png` structure on desktop (hero, outcomes, content list, sticky footer).
- [ ] Data is live from Sanity seed (not hardcoded PNG copy).
- [ ] Popular badge only when `popular === true`.
- [ ] Module numbers are 1-based array order.
- [ ] Durations format from seconds; students compact-format.
- [ ] Accordion + show-all behavior works; lesson links use the agreed path.
- [ ] Sticky progress is presentational at 35%.
- [ ] Responsive stack works; sticky bar does not cover content.
- [ ] `images.remotePatterns` allows Sanity CDN covers.
- [ ] Typecheck, lint, and production build pass.

## Checks

From repo root:

1. `npm run typecheck`
2. `npm run lint`
3. `npm run build`
4. If queries changed: `npm run typegen` then typecheck again.

## Manual test steps

1. Ensure `.env.local` has Sanity project/dataset + `SANITY_API_READ_TOKEN` and seed is imported.
2. `npm run dev` → open `http://localhost:3000/courses/nextjs-app-router-in-depth`.
3. Place `design/vertex-course.png` beside the browser; compare layout (not copy).
4. Confirm Popular badge, outcomes icons, four modules, expand shows three lessons each.
5. Click Continue Learning → navigates to first lesson path (404 OK until lesson page exists).
6. Open a non-popular course (e.g. `react-performance-engineering`) — no Popular badge; different content.
7. Unknown slug `/courses/does-not-exist` → 404.
8. Resize to mobile: stacked hero, single-column outcomes, usable footer.
