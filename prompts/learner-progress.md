# Implement learner progress

## Goal

Replace the fake 35% progress UI with **real per-learner state**: completed lessons and a resume position, keyed by Clerk user id, stored as Sanity `progress` documents, **written only through a server route**. Surface that state on the course page, lesson page, catalog (resume when started), and a `/my-learning` page that reads it for display.

Without this, My Learning and the progress bars stay demo data.

## Skills read

- `AGENTS.md` — progress is app state apart from read-only content; browser never holds a write token or writes Sanity; Clerk `userId` is the key; My Learning has no backend of its own but **may read existing progress**; browsing stays public; gate only what a feature marks as protected; do not overbuild; do not build a custom video player.
- `.agents/skills/sanity-best-practices/SKILL.md` + `references/schema.md` — `defineType` / `defineField` / `defineArrayMember`, icons from `@sanity/icons/<Name>`, `_key` on array items, generated IDs for ordinary docs (exception: per-user singleton `_id` documented below).
- `.agents/skills/clerk-setup/SKILL.md` + `.agents/skills/clerk-nextjs-patterns/SKILL.md` + `references/api-routes.md` + `references/middleware-strategies.md` — `await auth()` on the server; 401 vs 403; public-first middleware; `auth.protect()` only on `/my-learning` and the progress write route. Clerk SDK is **v7** (`isAuthenticated` exists).
- Next.js App Router: route handlers in `app/api/`, Server vs Client components, `params` / `searchParams` as Promises (already used). `next.config.ts` does **not** enable `cacheComponents`. Progress must never sit in a shared cache without `userId` in the key.

## Code inspected

- Schema: `studio/schemaTypes/` has `course`, `lesson`, `instructor`, `category`, `video`. **No `progress` type.** Desk in `studio/structure.ts` lists content + ingested videos only.
- Search Context `groqFilter` already excludes `progress` (`course|lesson|instructor|category|video` only) — leave it alone.
- Web data layer: `sanity/lib/client.ts` is `server-only` with **read** token (`SANITY_API_READ_TOKEN`). No write client. `sanity/lib/fetch.ts` tags content; that cache is shared — **do not** fetch progress through the same long-lived content tags.
- Fake progress: `components/course/course-progress-bar.tsx` defaults `value = 35`; `components/lesson/lesson-sidebar.tsx` hardcodes `Progress value={35}` and empty circles (no checkmarks). Course page Continue always goes to the **first** lesson (`firstLessonHref`).
- Lesson player is a static allowlisted iframe (`components/lesson/lesson-player.tsx` + `lib/video-embed.ts`). `?t=` already starts YouTube/Vimeo/Bunny. Next/Prev is a plain `Link` in `components/lesson/lesson-nav.tsx` — no complete hook.
- Catalog `CourseCard` has no progress slot. Header already links to `/my-learning`; **that route does not exist**.
- Auth: `ClerkProvider` in `app/layout.tsx`; `proxy.ts` is public-first `clerkMiddleware()` with no `protect()`. Sign-in/up routes exist.
- Env: `.env.example` has the read token, not a write token.
- No My Learning design PNG (design folder has home, course, lesson, search, design-system only). Reuse catalog/course primitives; do not invent a new visual language.

## Decisions and assumptions

### Data model

One `progress` document per Clerk user:

| field | type | notes |
|---|---|---|
| `clerkUserId` | string | required; the Clerk `userId`; unique |
| `completedLessons` | array of `reference` → `lesson` | unique refs; `_key` = lesson `_id` so patches are idempotent |
| `lastLesson` | reference → `lesson` | the lesson they should resume |
| `lastPositionSeconds` | number | integer ≥ 0; last known playback second in `lastLesson` |

`_type: "progress"`. Studio `readOnly: true` (Studio UI only — the HTTP API with a write token still patches). Description: app state, not authored content. Preview: `clerkUserId` + completed count.

**Document `_id`:** `progress.{clerkUserId}`. Clerk ids are `user_…` (safe Sanity id characters). This is a **per-user singleton**, same rationale as schema.md §6 singletons: `createIfNotExists` must be race-safe. Store `clerkUserId` as a field too so we can query without parsing ids. Never accept a client-supplied document id.

Do **not** store parent course on progress; derive it with the existing reverse ref (`*[_type == "course" && references(lesson._id)]`).

Percent complete for a course = `round(100 * completedInCourse / totalLessonsInCourse)`. Clamp 0–100. 0 lessons → 0. Do not invent counts.

### Write path (only mutation)

`POST /api/progress` — App Router route handler.

1. `const { isAuthenticated, userId } = await auth()`. If not authenticated → **401**. Never take `userId` from the body.
2. Parse body with Zod:

```ts
{
  lessonId: z.string().min(1),          // Sanity lesson _id
  completed: z.boolean().optional(),
  positionSeconds: z.number().int().nonnegative().optional(),
}
```

At least one of `completed` / `positionSeconds` / implicit “touch lastLesson” is required. Viewing a lesson always updates `lastLesson` (and `lastPositionSeconds` when provided).

3. Confirm the lesson exists with a server GROQ (`*[_type == "lesson" && _id == $id][0]._id`). Unknown id → **400**. Do not trust the client.
4. Server-only write client (`SANITY_API_WRITE_TOKEN`, `useCdn: false`, `import 'server-only'`). Transaction:

   - `createIfNotExists({ _id, _type: "progress", clerkUserId: userId, completedLessons: [] })`
   - Always `set({ lastLesson: { _type: "reference", _ref: lessonId } })` when touching a lesson.
   - If `positionSeconds` is a number: `set({ lastPositionSeconds })`.
   - If `completed === true`: unset any existing `completedLessons[_ref == lessonId]` then `append` `{ _type: "reference", _ref: lessonId, _key: lessonId }` (idempotent). Do not un-complete in this pass (no UI for it).

5. Return the updated progress JSON (completed lesson ids, lastLesson id, lastPositionSeconds). **200**.

The write token lives only in `sanity/lib/write-client.ts` (or equivalent) and this route. Client components `fetch("/api/progress")` with cookies (same-origin); they never see the token.

### Read path

Server Components call `auth()`, then fetch progress with the **read** client (Viewer can read the private dataset). Query by `clerkUserId`, never by guessing other users.

- Cache: `next: { revalidate: 0 }` **or** tags `['progress', \`progress:${userId}\`]` and `revalidateTag(\`progress:${userId}\`)` after POST. **Never** mix progress into `['course']` / `['lesson']` tags.
- Signed out → treat as empty progress (0%, no checkmarks, Continue = first lesson). Do not show 35%.

Helper (pure, unit-testable by inspection), e.g. `lib/progress.ts`:

- `coursePercent(completedIds, courseLessonIds)`
- `resumeHref({ courseSlug, modules, lastLessonId, lastPositionSeconds, completedIds })` → first incomplete after last viewed, else last viewed, else first lesson. If resuming `lastLesson` and `lastPositionSeconds > 0`, append `?t=`. Prefer the lesson page path already in use: `/courses/[slug]/lessons/[lessonSlug]`.
- `isCompleted(id, completedIds)`

### How the UI writes (no custom player)

Keep the provider iframe. Do **not** rebuild player chrome.

Signed-in only (signed-out: no-op, no error toast that blocks watching):

1. **Lesson view (mount)** — client beacon `POST { lessonId }` so Continue / My Learning point at this lesson. `positionSeconds` omitted unless known.
2. **Resume seconds (YouTube only)** — add `enablejsapi=1` + `origin` to the existing YouTube embed helper; a small client wrapper uses the YouTube IFrame API to `getCurrentTime()` and **debounced** POST `{ lessonId, positionSeconds }` on pause, every ~15s while playing, and `pagehide`. Still the YouTube iframe — not a custom player. Vimeo/Bunny: lesson-level resume only in this pass (no extra SDKs).
3. **Complete** — wrapping Next (and a last-lesson “complete” if there is no next) `POST { lessonId, completed: true }` then navigate. Do not add a new “Mark complete” button; the PNG has none. Completing on Next is the affordance.

`?t=` from the URL **wins** over stored `lastPositionSeconds` when present (search deep-links).

Debounce position writes. Ignore 401 on the client (user signed out mid-session).

### Where it shows up

**Course page** (`/courses/[slug]`): sticky footer and hero Continue use real percent + `resumeHref`. Signed out or no progress: 0% and first lesson (label stays **Continue Learning** to match the PNG; do not switch to “Start course”).

**Lesson page:** sidebar `Progress` uses the parent course percent. Completed lessons get a check (`CheckCircle2` / existing `Status` completed treatment); current stays “Now playing”; others stay empty circles. Player start seconds: `?t=` else stored seconds if `lastLesson` is this lesson.

**Catalog** (`/courses`): when signed in, courses the learner has started (any completed lesson in that course, or `lastLesson` in that course) get a small existing `Progress` under the card meta. Do not restyle the card otherwise. Unstarted: unchanged.

**My Learning** (`/my-learning`): no PNG — **reuse the catalog page shell** (same header, grid, `CourseCard` + progress). Protect the route with Clerk (`auth.protect()` in `proxy.ts` via `createRouteMatcher(['/my-learning(.*)'])` plus the write API). Signed-in with no started courses: empty state that points at `/courses` (same idea as search empty → catalog). Cards link to the course; primary resume is the course Continue / card href to course (keep it small — do not invent a second card type).

`/api/progress` is also protected (401 if no session; middleware `protect()` is optional if the handler already 401s — do both: matcher + handler check).

Catalog, course, and lesson pages stay **public**.

### Out of scope

- PostHog, bookmarks, Notes tab backend, free-preview access control, search, ingestion, un-complete, per-lesson position map, Vimeo/Bunny time APIs, custom player, new design tokens, seeding progress docs.

## Files expected

**Add**

- `studio/schemaTypes/documents/progress.ts`
- `sanity/lib/write-client.ts` — `server-only`, write token
- `app/api/progress/route.ts` — POST
- `lib/progress.ts` — percent / resume helpers
- `lib/progress-server.ts` (or similar) — `getProgressForUser(userId)` with no shared content cache
- `components/lesson/lesson-progress-sync.tsx` — client beacon + YouTube time + Next complete
- `app/my-learning/page.tsx` — signed-in list of started courses

**Change**

- `studio/schemaTypes/index.ts` — register `progress`
- `studio/structure.ts` — “Learner progress” under a divider (debug; read-only type)
- `sanity/lib/queries.ts` — `PROGRESS_BY_USER_QUERY`; lesson `_id` already on course/lesson trees (needed for completed matching). Add `_id` on nested lessons if any projection is missing it (course modules already have `lessons[]->{_id, ...}`).
- `sanity.types.ts` — regenerate (`npm run typegen`)
- `.env.example` — `SANITY_API_WRITE_TOKEN=` (server only, Editor or similar write role; not Viewer)
- `proxy.ts` — protect `/my-learning(.*)` (and `/api/progress(.*)` if desired)
- `app/courses/[slug]/page.tsx` — real percent + resume
- `app/courses/[slug]/lessons/[lessonSlug]/page.tsx` — pass progress into sidebar/player/nav; `?t=` wins
- `app/courses/page.tsx` — optional progress on started cards
- `components/course/course-progress-bar.tsx` — remove 35 default; require a real `value`
- `components/course/course-hero.tsx` — continue href from resume helper
- `components/course/module-list.tsx` — optional completed check on lesson rows
- `components/lesson/lesson-sidebar.tsx` — real percent + checkmarks
- `components/lesson/lesson-player.tsx` / `lib/video-embed.ts` — YouTube `enablejsapi` + origin when tracking
- `components/lesson/lesson-nav.tsx` — complete-on-Next when signed in
- `components/ui/card.tsx` — optional `progress` number on `CourseCard` (omit when undefined)

## Requirements

1. Signed-in user completing a lesson (via Next) persists a `progress` doc keyed to their Clerk id; refresh still shows it.
2. Course footer percent is `completed/total` for that course, not 35.
3. Continue Learning on a started course goes to the resume lesson (with `?t=` when seconds exist).
4. Lesson sidebar checks completed lessons; current is still Now playing.
5. Returning to the last YouTube lesson (no `?t=`) starts near the stored second.
6. Signed-out: 0%, first lesson, no writes, no token in the browser.
7. `/my-learning` requires sign-in and lists started courses with real percents; empty → catalog.
8. A learner cannot read or write another learner’s progress (id always from `auth()`).
9. Write token never in client bundles; grep `.next/static` after build.

## Security

- `SANITY_API_WRITE_TOKEN` and `CLERK_SECRET_KEY`: no `NEXT_PUBLIC_`, only server modules / this route.
- Body `lessonId` must exist as a `lesson` document; ignore extra fields.
- Never accept `clerkUserId` or `_id` from the client.
- Progress GROQ always filters `clerkUserId == $userId` from `auth()`.
- iframe `src` still only from `getVideoEmbed` allowlist.
- YouTube IFrame API: `origin` set to the app origin; `enablejsapi` only when signed in (or always on YouTube embeds — either is fine if origin is set).

## Acceptance criteria

- [ ] `progress` schema in Studio (read-only list) after schema deploy.
- [ ] POST `/api/progress` 401 when signed out; 400 on bad/missing lesson; 200 upserts the caller’s doc.
- [ ] Course, lesson, catalog, My Learning show stored state, not 35%.
- [ ] Next on a lesson marks it complete for the signed-in user.
- [ ] Continue / My Learning resume the last lesson; YouTube `?t=` from stored seconds when no query override.
- [ ] Typecheck, lint, and production build pass.
- [ ] Write token absent from `.next/static`.

## Checks

From repo root:

1. `npm run typegen` (from `studio/` / root script) after schema + query edits
2. `npm run typecheck`
3. `npm run lint`
4. `npm run build`
5. Confirm `.next/static` has no write token string

From `studio/`:

6. `npx sanity schema deploy` so the live dataset knows `progress` (required before writes succeed in production/dev against the hosted dataset)

## Manual test steps

1. Add `SANITY_API_WRITE_TOKEN` (Editor) to `.env.local`; keep the Viewer read token as-is. Restart `npm run dev`.
2. Signed **out**: open a course — footer is **0%**, Continue is first lesson. Complete/Next does not create a Studio `progress` doc.
3. Sign **in**. Open `/courses/nextjs-app-router-in-depth/lessons/fetching-in-server-components`. Wait a moment; Studio should show a `progress` doc for your `user_…` with `lastLesson` set.
4. Click Next → `caching-and-revalidation`. First lesson is checked; course percent is `round(100/12)` (12 lessons in that seed course) not 35. Footer on the course page matches.
5. Play the YouTube video, pause after ~20s, wait for the debounce, refresh **without** `?t=` — playback should start near that second. Open `?t=90` — 90 wins.
6. `/my-learning` while signed in lists this course with the same percent. Sign out → `/my-learning` redirects to sign-in.
7. Catalog: started course shows a small progress bar; others unchanged.
8. A second Clerk user does not see the first user’s checks or percent.

## Needs your attention

- **Write token.** Create an Editor (or custom write) token in sanity.io/manage → API → Tokens and set `SANITY_API_WRITE_TOKEN` in `.env.local`. I will not put the value in git.
- **Schema deploy.** `npx sanity schema deploy` from `studio/` after the type is added, or POSTs will fail against the hosted dataset.
- **My Learning has no PNG.** Layout copies the catalog (header + course cards + progress). Say if you want that page held until a design lands.
- **Vimeo/Bunny resume seconds** are lesson-level only this pass. YouTube is the seeded player.
