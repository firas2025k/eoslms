# Implement the Vertex lesson page

## Goal

Build `/courses/[slug]/lessons/[lessonSlug]` to match `design/vertext-lesson.png` and wire it to **seeded Sanity lesson + course content**. Play the lesson video **on the page** via the provider embed (YouTube / Vimeo / Bunny). Read-only: no progress API writes, no PostHog, no search.

## Skills read

- `AGENTS.md` — UI matches the reference exactly; responsive down to mobile; pages are read-only; progress / bookmark / free-preview / Notes tab may be presentational; module and lesson numbers derived from order; playback stays on-site via provider embed with optional start-seconds query param; never expose the Sanity token; do not overbuild; do not build a custom video player.
- `.agents/skills/sanity-best-practices/SKILL.md` + `references/nextjs.md`, `references/groq.md`, `references/portable-text.md` — server fetch, `defineQuery`, image URL builder, TypeGen; Portable Text via `@portabletext/react` (available in the tree; `next-sanity` v13 does not re-export it).
- `.agents/skills/portable-text-serialization/SKILL.md` + `rules/react.md` — component mapping for notes.
- Next.js docs under `node_modules/next/dist/docs/` — App Router dynamic segments, `params` / `searchParams` as Promises, server vs client boundaries, embedding third-party iframes.

## Code inspected

- Design: `design/vertext-lesson.png` (header, left curriculum sidebar, breadcrumbs, lesson header + meta, video player, Lesson Content / Notes tabs, overview + key points + pro tip + resources, prev/next footer).
- Existing course page: `app/courses/[slug]/page.tsx` already links lessons to `/courses/${courseSlug}/lessons/${lesson.slug}`.
- Queries: `LESSON_BY_SLUG_QUERY` and `LESSON_SLUGS_QUERY` exist in `sanity/lib/queries.ts`. Lesson reverse-resolves its parent course and full module/lesson tree. **Missing for UI:** `course.level` (meta row). Extend the query and re-run typegen.
- Schema: lesson has `videoUrl`, `thumbnail`, `duration` (seconds), `freePreview`, `studentCount`, `notes` (blockContent), `keyPoints[]`, `proTip`, `resources[]` (`type` pdf|link|repo|code|slides). No dedicated `summary` field — seed stores the lesson summary as the **first normal block** of `notes`.
- Seed: e.g. course `nextjs-app-router-in-depth`, module 3 “Data Fetching and Caching”, lessons `fetching-in-server-components`, `caching-and-revalidation`, `streaming-and-suspense`. Real YouTube `videoUrl`s from the resolver. Copy/counts will **not** match PNG demo strings (12 modules / “Next.js for Production”) — layout matches PNG; data comes from Sanity.
- Design system: `Header`, `Breadcrumbs`, `Badge`, `Button`, `Progress`, Lucide, tokens in `app/globals.css`, `lib/format.ts` (`formatDuration`, `formatStudentCount`, `formatLevel`).
- `next.config.ts` already allows `cdn.sanity.io` images. No iframe CSP yet — add only if the build or browser blocks embeds.
- No lesson route or video embed helper yet. `ResourceCard` in `components/ui/card.tsx` is a design-system download mock; lesson resources need external-link cards matching the PNG (title, description, type icon, external-link affordance).

## Decisions and assumptions

### Routing and data

- Route: **`app/courses/[slug]/lessons/[lessonSlug]/page.tsx`**. Server Component. Await `params` and `searchParams` (Next 16 Promise pattern).
- Fetch with `sanityFetch({ query: LESSON_BY_SLUG_QUERY, params: { slug: lessonSlug }, tags: ['lesson', \`lesson:${lessonSlug}\`, 'course'] })`.
- `notFound()` when the lesson is missing, has no course, or `course.slug !==` the URL `slug` (prevents cross-course URLs).
- `generateStaticParams`: for each course slug, emit `{ slug, lessonSlug }` for every lesson in its modules (prefer extending / adding a GROQ that returns course+lesson slug pairs; or compose from existing course list + lesson tree). Keep it server-only and tagged.
- `generateMetadata` from lesson title + first notes paragraph / course title.
- Extend `LESSON_BY_SLUG_QUERY` course projection with `level`. Optionally project module duration sums if useful for the sidebar; otherwise sum in JS from lesson durations.
- Support **`?t=`** (seconds, integer) as the start-seconds query param for search deep-links. Pass into the embed URL. Ignore invalid values.

### Video embed (required)

- **Do not** rebuild the PNG’s custom player chrome. Use the provider’s iframe player.
- Add a small pure helper (e.g. `lib/video-embed.ts`) that, given `videoUrl` + optional `startSeconds`, returns `{ provider, embedUrl }` or `null` for unsupported URLs:
  - **YouTube** — watch / youtu.be / embed → `https://www.youtube-nocookie.com/embed/{id}?start={n}&rel=0`
  - **Vimeo** — `https://player.vimeo.com/video/{id}#t={n}s` (or `?t=` per Vimeo docs)
  - **Bunny** — `iframe.mediadelivery.net` / `video.bunnycdn.com` embed URL; append start if the provider supports it, otherwise ignore start
- Render a responsive 16:9 iframe (`aspect-video`, rounded, dark background) with `title`, `allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"`, `allowFullScreen`, and `referrerPolicy="strict-origin-when-cross-origin"`.
- If URL cannot be parsed: show the thumbnail (if any) plus a short “Video unavailable” message — do not invent a URL.
- Client component only if needed for the iframe wrapper; prefer a server-rendered iframe so the page stays mostly server.

### UI fidelity (PNG is layout truth; Sanity is copy truth)

Compose to match the PNG:

1. **Header** — `Header` with `activeHref="/courses"`, `showSearch={false}`.
2. **Two-column layout** — left curriculum sidebar (~320px), right main column. Below `lg`: stack sidebar above or collapse into a details/accordion “Course content” so mobile stays usable without a fixed dual-pane.
3. **Sidebar**
   - “Back to course” → `/courses/[slug]`.
   - Course card: cover thumbnail (or dark initial), course title, presentational **35%** `Progress`.
   - Module list (1-based order). Collapsed modules show number + title + module duration + chevron.
   - **Current module** expanded by default (and highlighted). Nested lessons with empty circle / check (presentational: only mark the **current** lesson as “Now playing” with play icon + primary text; do **not** invent completed checkmarks for prior lessons without a progress API — empty circles for others).
   - Lesson links → same route pattern. Current lesson is not a dead self-link (aria-current).
4. **Breadcrumbs** — `All Courses` → `/courses`, course title → `/courses/[slug]`, current module title, current lesson title (last crumb current, no href).
5. **Lesson header** — orange pill badge `LESSON {m}.{n}` (use primary/popular styling; existing `Badge variant="lesson"` is indigo — prefer a primary-tinted pill matching the PNG). Playfair title. Presentational bookmark icon button (no persistence). Subtitle = **first plain-text paragraph** extracted from `notes` (seed summary). Meta row: duration · course level · student count with Lucide icons (`Clock`, `BarChart3`, `Users`) in primary orange.
6. **Video** — embed as above, full width of main column.
7. **Tabs** — client tabs: **Lesson Content** (default) and **Notes**.
   - **Lesson Content:** Overview heading + subtitle paragraph (same first-notes extract); “In this lesson you will” + `keyPoints` with orange check icons; Pro Tip callout when `proTip` is set (light primary-100 box, lightbulb icon); Resources grid of external-link cards from `resources[]` (icon by `type`: FileText / Github / Code / etc., `target="_blank"` `rel="noopener noreferrer"`, ExternalLink icon).
   - **Notes:** render full Portable Text `notes` with sensible typography (prose-like, project tokens). Empty state if no notes. This tab is the presentational “Notes” surface; it still uses real Sanity content rather than fake copy.
8. **Footer nav** — Previous (outline/tertiary) and Next (primary) with adjacent title + duration. Flat ordered list of all lessons across modules. Omit or disable the missing side at ends. Soft top border / bar matching PNG.

### Background and spacing

- Same subtle grid treatment as course/home (`neutral-50` + light grid). Pad bottom so content clears the prev/next bar if it is sticky; sticky footer is preferred to match the PNG.

### Formatting

- Reuse `lib/format.ts`. Lesson label helper: `formatLessonLabel(moduleIndex, lessonIndex)` → `LESSON 3.2` (1-based).
- Module duration = sum of nested lesson durations.

### Out of scope

- Real Clerk progress writes / resume position API.
- PostHog instrumentation.
- Search results deep-link wiring beyond accepting `?t=`.
- Custom video controls matching the PNG chrome.
- Instructor page, My Learning, notifications behavior.
- Schema/Studio changes beyond GROQ projection + typegen.
- Reseeding or renaming titles to match the PNG.

## Files expected

**Add**

- `app/courses/[slug]/lessons/[lessonSlug]/page.tsx` — server page (fetch, metadata, layout composition, prev/next derivation).
- `components/lesson/lesson-sidebar.tsx` — client accordion curriculum + back link + progress card.
- `components/lesson/lesson-header.tsx` — badge, title, bookmark, subtitle, meta (can be server).
- `components/lesson/lesson-player.tsx` — embed iframe wrapper.
- `components/lesson/lesson-tabs.tsx` — client Lesson Content / Notes tabs + Portable Text notes + key points / pro tip / resources.
- `components/lesson/lesson-nav.tsx` — prev/next footer.
- `lib/video-embed.ts` — URL → embed URL helper (pure, unit-testable by inspection).
- Optional: `lib/portable-text.tsx` or colocated notes components map.

**Change**

- `sanity/lib/queries.ts` — add `level` (and anything else strictly needed) on the course projection in `LESSON_BY_SLUG_QUERY`; add a static-params query if cleaner than composing client-side.
- `sanity.types.ts` — regenerate via `npm run typegen`.

Reuse `Header`, `Breadcrumbs`, `Button`, `Progress`, `urlFor` / `SanityImage`, `sanityFetch`, `formatDuration` / `formatLevel` / `formatStudentCount`. Do not fork a second design language.

## Requirements

1. Visiting a seeded lesson URL (e. of. `/courses/nextjs-app-router-in-depth/lessons/caching-and-revalidation`) renders the PNG layout with that lesson’s Sanity title, notes, key points, pro tip, resources, and course sidebar.
2. YouTube (and other supported) video plays **in-page** via iframe embed.
3. `?t=90` (example) starts the YouTube embed near 90 seconds.
4. Module / lesson numbers are 1-based array order (`LESSON 3.2` for module index 3, lesson index 2).
5. Prev/next walk the flat curriculum order.
6. Wrong course slug for a lesson → 404. Unknown lesson → 404.
7. No Sanity token or write client in the browser bundle.
8. Bookmark and 35% progress remain presentational.

## Security

- Fetch only through `sanity/lib/fetch.ts` / server page. Never import `sanity/lib/client` or `token` into client components.
- Embed only allowlisted provider hosts derived from parsed `videoUrl` — never pass an arbitrary Sanity string straight into `iframe.src` without host checks.
- External resource links: `rel="noopener noreferrer"`, `target="_blank"`.
- No `dangerouslySetInnerHTML`. Portable Text via the React serializer only.
- Bookmark / progress UI must not write to Sanity.

## Acceptance criteria

- [ ] Desktop layout matches `design/vertext-lesson.png` structure (sidebar, header, player, tabs, content sections, prev/next).
- [ ] Data is live from Sanity seed (not hardcoded PNG copy).
- [ ] Video embeds and plays on the page for seeded YouTube URLs.
- [ ] `?t=` start seconds applied for YouTube.
- [ ] Current lesson shows “Now playing”; other lessons link correctly.
- [ ] Lesson Content shows overview, key points, pro tip (when present), resources.
- [ ] Notes tab renders Portable Text notes.
- [ ] Prev/next work across module boundaries.
- [ ] Responsive: usable stacked / collapsible curriculum on small screens.
- [ ] Typecheck, lint, and production build pass.

## Checks

From repo root:

1. `npm run typegen` (after query edits)
2. `npm run typecheck`
3. `npm run lint`
4. `npm run build`

## Manual test steps

1. Ensure `.env.local` has Sanity project/dataset + `SANITY_API_READ_TOKEN` and seed is imported.
2. `npm run dev` → open `http://localhost:3000/courses/nextjs-app-router-in-depth/lessons/caching-and-revalidation`.
3. Place `design/vertext-lesson.png` beside the browser; compare layout (not copy).
4. Confirm video iframe loads and plays; sidebar module 3 expanded; badge `LESSON 3.2`; key points + pro tip + resources present.
5. Open `?t=30` and confirm playback starts near 30s (YouTube).
6. Click Previous → `fetching-in-server-components`; Next → `streaming-and-suspense`.
7. Back to course → `/courses/nextjs-app-router-in-depth`.
8. Mismatched URL `/courses/react-performance-engineering/lessons/caching-and-revalidation` → 404.
9. Unknown lesson slug → 404.
10. Resize to mobile: curriculum usable, no horizontal overflow, player readable.
