# Gate lessons behind sign-in; Start Learning for guests

## Goal

Unsigned visitors may browse the catalog and the course overview. They must **not** play or open a lesson. The course primary button must not say **Continue Learning** when they have not started (and when they are signed out).

Chosen product rule: lock **all** lessons. Do not treat `freePreview` as access. After Clerk sign-in, existing onboarding + `next` already sends them to the lesson they asked for.

## Skills read

- `AGENTS.md` — browsing stays public; gate only what this feature marks as protected (lessons). Free preview stays a label, not access control. Clerk via `proxy.ts`, not client-only checks.
- `.agents/skills/clerk-nextjs-patterns/SKILL.md` + `references/middleware-strategies.md` — public-first; `auth.protect()` on the new private routes; Clerk v7 `isAuthenticated`.
- Existing `ContinueLearningCta` already wraps signed-out clicks in `SignInButton` with `forceRedirectUrl`. Reuse that. Do not invent a new auth UI.

## Code inspected

- `proxy.ts`: `auth.protect()` on My Learning, onboarding, feedback, certificates. **`/courses/[slug]/lessons/[lessonSlug]` is not protected.** Direct URLs and module `Link`s render the full lesson (video, notes) with progress writes no-op.
- Course page (`app/courses/[slug]/page.tsx`): guests get empty progress, so `courseComplete` is false and `primaryLabel` is always **Continue Learning**. Hero CTA still uses `SignInButton` (does not navigate unsigned). Sticky `CourseProgressBar` shows 0% plus the same CTA when `value < 100`.
- `components/course/module-list.tsx`: lesson titles are plain `Link`s to the lesson URL. This is the path the bug report used (dropdown → lesson).
- Search result cards also link to lesson URLs. Hard-gating lessons in `proxy.ts` covers those without a card rewrite.
- `courseHasStarted` already exists in `lib/progress.ts`. Use it for signed-in copy.

## Decisions

| Visitor | Catalog / course overview | Lesson URL | Course primary button | Sticky progress bar |
|---|---|---|---|---|
| Signed out | Public | Clerk sign-in, then that lesson (`next`) | **Start Learning** → existing `SignInButton` to first lesson | Hide (no progress) |
| Signed in, not started | Public | Lesson | **Start Learning** → first lesson | Hide (0%, have not started) |
| Signed in, in progress | Public | Lesson | **Continue Learning** (unchanged) | Unchanged |
| Signed in, 100% | Unchanged (feedback / certificate / review) | — | Unchanged | Unchanged |

Module list while signed out: clicking a lesson opens the Clerk **modal** with `forceRedirectUrl` / `signUpForceRedirectUrl` set to that lesson (same pattern as `ContinueLearningCta`). Still add `auth.protect()` so a pasted URL cannot skip the modal.

Do not: paywall, honor `freePreview` as a real gate, change search ranking, or restyle the course page.

## Files expected

- `proxy.ts` — protect `/courses/(.*)/lessons(.*)`
- `app/courses/[slug]/page.tsx` — `Start Learning` when unsigned or `!courseHasStarted`; hide progress bar in those cases
- `components/course/module-list.tsx` — accept `isSignedIn`; unsigned lesson rows use `SignInButton` instead of a naked `Link`
- `components/course/continue-learning-cta.tsx` — default label may stay; callers pass **Start Learning**
- Search cards: no change (middleware is enough)

## Requirements

1. Signed-out `GET /courses/{slug}/lessons/{lessonSlug}` hits Clerk, not the player.
2. Signed-out module-list click opens sign-in (modal), then returns to that lesson (then onboarding if needed).
3. Hero button for guests: **Start Learning**, not Continue Learning.
4. Signed-in with no progress on that course: same **Start Learning** label.
5. Home, catalog, course overview, search stay public.

## Security

`auth.protect()` is the real gate. UI wrapping is UX only. Do not rely on hiding links.

## Acceptance criteria

- Incognito: open a course, expand a module, click a lesson → sign-in, never the video.
- Paste a lesson URL while signed out → sign-in.
- Course hero while signed out: **Start Learning**. After sign-in + onboarding, land on that lesson.
- Signed-in new learner on a course they have not started: **Start Learning**. After first lesson progress: **Continue Learning**.
- Typecheck and lint pass.

## Checks

- `npm run typecheck`
- `npm run lint`

No Studio deploy.

## Manual test

1. Sign out (or incognito). Open a course. Confirm overview. Confirm hero **Start Learning**. Confirm no 0% sticky bar.
2. Expand a module, click a lesson → Clerk modal. Complete sign-in (and onboarding if needed) → that lesson.
3. Sign out. Paste the lesson URL → Clerk, not the player.
4. Sign in, course not started: **Start Learning**. Complete a lesson, return to course: **Continue Learning**.
5. Search while signed out, click a result → Clerk then the lesson (or onboarding first).
