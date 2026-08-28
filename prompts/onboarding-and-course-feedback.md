# Implement onboarding pre-form and per-course feedback

## Goal

Add two learner forms to the LMS, with answers stored in Sanity (same write pattern as progress). Testers and later learners use the **normal site URL**. No special `/start` link. No PostHog surveys. No Tally/Typeform.

1. **Onboarding (pre-form)** — once per Clerk user. After sign-in, if they have not submitted it, they must complete a full onboarding page before they can use signed-in learning (lessons, My Learning, search). Not a dismissible popup.
2. **Course feedback (post-form)** — per course, **opt-in in Studio**. When a learner finishes that course and the toggle is on, they get a feedback page. Other courses skip it.

Current catalog courses are test content and will be replaced later. This feature must work for whatever course is published; it must not assume a single hardcoded slug.

## Skills read

- `AGENTS.md` — LMS hosts this course and future courses; pages are read-only content; app state (progress, now also form answers) is separate; browser never holds a write token; Clerk `userId` is the key; writes go through a server route; browsing stays public; gate only what this feature marks as protected; do not overbuild; no form builder, no custom video player.
- `.agents/skills/sanity-best-practices/SKILL.md` + `references/schema.md` + `references/typegen.md` — `defineType` / `defineField`; icons from `@sanity/icons/<Name>`; explicit `_id` only for per-user (or per-user-per-course) singletons; TypeGen via Studio `sanity.cli.ts` into `../sanity.types.ts`.
- `.agents/skills/content-modeling-best-practices/SKILL.md` — onboarding/feedback are app state, not curriculum; do not mix them into `progress` or into Portable Text course fields.
- `.agents/skills/clerk-nextjs-patterns/SKILL.md` + `references/api-routes.md` + `references/middleware-strategies.md` — `await auth()`; Clerk v7 `isAuthenticated`; public-first `proxy.ts`; `auth.protect()` on the new private routes; 401 vs 403.
- Next.js App Router as already used (`proxy.ts`, `params` as Promises). `node_modules/next/dist/docs/` was not present in this workspace snapshot; follow existing routing and server/client boundaries.

## Code inspected

- Course schema (`studio/schemaTypes/documents/course.ts`): overview / marketing / curriculum groups. **No learner/feedback fields.**
- App state today: `progress` document, `readOnly` in Studio, `_id` `progress.{clerkUserId}`, written only by `POST /api/progress` via `sanity/lib/write-client.ts` (`SANITY_API_WRITE_TOKEN`). Read with `cache: 'no-store'` in `lib/progress-server.ts` — **do not** fetch learner state through `sanityFetch` content tags.
- Desk (`studio/structure.ts`): Courses, Lessons, Instructors, Categories, Videos, Learner progress.
- Search Context `groqFilter` is an **allowlist**: `_type in ["course","lesson","instructor","category","video"]`. New app-state types stay off that list automatically. Do not change the Context document.
- `proxy.ts`: public-first; `auth.protect()` only `/my-learning(.*)` and `/api/progress(.*)`. Sign-in is a **Clerk modal** (`AuthControls`) plus `/sign-in` pages. Fallback redirect env is `/`. Modal sign-in stays on the current page — a fallback URL alone is **not** enough to catch first login.
- Course Start/Continue (`course-hero.tsx`, `resumeHref`) does **not** require auth. Lessons are publicly viewable. Progress writes no-op without a session.
- Last lesson: `LessonNav` renders **no next CTA** when `next` is null. Completing the last lesson is easy to miss. `LessonProgressSync` can mark complete on YouTube `ENDED`. There is no “you finished” or feedback handoff.
- UI: `Button` / `buttonClassName`, `Input`, `Header`, home page centered layout (neutral-50 grid). **No onboarding or form design PNG.** Reuse those primitives; do not invent a new visual language. No design-system page updates unless a small shared control is required.
- Env: write token already in `.env.example`. No new secrets.

## Decisions and assumptions

### Product rules

| Moment | Rule |
|---|---|
| Signed out | Home, catalog, course page, lessons, search stay public (unchanged). |
| Just signed in, no onboarding | Full-page `/onboarding`. Required. No skip. |
| Onboarding already submitted | Normal app. Never show the pre-form again. |
| Course with `feedbackEnabled` | After **this** course hits 100% complete, send them to `/courses/[slug]/feedback` once. |
| Course with feedback off | No feedback page, no prompt. |
| Feedback already submitted for that course | Do not show the form again. |

Onboarding is **platform-wide** (once per learner), not a per-course toggle. Feedback **is** a per-course toggle.

Do not build: a Studio form builder, skip logic, results charts, CSV UI, a tester-only `/start` route, or mixing answers into `progress`.

### Question set (hardcoded in the web app)

Questions live in code (e.g. `lib/forms/questions.ts`) and as **matching typed Sanity fields**. Authors do not edit questions in Studio in this pass. Use the **exact labels** below. Do not add extra questions.

**Onboarding** (supplied; this is the pre-survey). Render as three titled sections. All fields required unless noted.

**Section 1 — About You**

| field | type | label |
|---|---|---|
| `fullName` | string | Full name |
| `email` | email string | Email address |
| `location` | string | Where do you live? (City/Country) |

Pre-fill `fullName` and `email` from Clerk (`currentUser()`: name + primary email) when present. Keep the fields **editable**. Still save them on the onboarding document so Studio/export is a complete row without opening Clerk. Validate email format. Do not skip these fields just because Clerk has them.

**Section 2 — Your Stage**

| field | type | label |
|---|---|---|
| `stage` | string, **one** answer (radios) | Which best describes your current situation? |

Stored values and **exact** option copy:

| value | label |
|---|---|
| `planning_3_years` | I plan to start a social business within the next 3 years |
| `setting_up` | I am currently setting up a business (not yet operational) |
| `new_business` | I run a new business (under 42 months) |
| `established` | I run an established business (42+ months) |

**Section 3 — Your Motivation**

| field | type | label |
|---|---|---|
| `motivation` | text | What draws you to social entrepreneurship? |
| `twelveMonthGoal` | text | What is your main goal for the next 12 months? |

**Feedback** (supplied from the “How Did We Do” / RATE THE COURSE form). Title on the page: **How did we do**. Section label: **Rate the course**. Scale legend, exact: **1 = Strongly Disagree  5 = Strongly Agree**. All six questions are **required** (asterisk). Use the **exact** question wording. Radios for 1–5, not a dropdown. Do **not** clone the teal/striped screenshot layout — reuse Vertex `Input`, radios, `Button`, type, and spacing.

| field | type | label |
|---|---|---|
| `organised` | number 1–5 | The course was well organised and easy to follow. |
| `knowledgeSkills` | number 1–5 | The learning materials genuinely increased my knowledge and skills. |
| `navigation` | number 1–5 | The e-learning experience was smooth and easy to navigate. |
| `workload` | number 1–5 | The workload was appropriate for the level. |
| `peerConnection` | number 1–5 | I had meaningful opportunities to connect with other participants. |
| `whatWouldChange` | text | What worked well, what didn't, and what would you change? |

Keep Q5 even though the LMS has no cohort/community feature yet — it is part of this survey. Do not add extra questions.

### Data model (Sanity)

#### Course (authored)

Add to `course`, new group **Learners** (or equivalent — not curriculum):

```ts
feedbackEnabled: boolean
initialValue: false
description: 'After a learner completes every lesson, show a feedback form. Off by default.'
```

Existing courses stay **off** until an author publishes the toggle. That is intentional for the test catalog.

#### `onboarding` (app state, not authored)

One document per Clerk user. Studio `readOnly: true` (UI only; HTTP write token can still create/patch).

| field | type |
|---|---|
| `clerkUserId` | string, required |
| `fullName` | string, required |
| `email` | string, required |
| `location` | string, required |
| `stage` | string, required, list of the four `planning_3_years` / `setting_up` / `new_business` / `established` values |
| `motivation` | text, required |
| `twelveMonthGoal` | text, required |
| `submittedAt` | datetime, required |

**`_id`:** `onboarding.{clerkUserId}` (sanitize like `progressDocumentId`). Store `clerkUserId` as a field too. Never accept a client-supplied document id.

Preview: `fullName` (fallback `clerkUserId`) + `email` as subtitle.

#### `courseFeedback` (app state, not authored)

One document per Clerk user **per course**. Studio `readOnly: true`.

| field | type |
|---|---|
| `clerkUserId` | string, required |
| `course` | reference → `course`, required |
| `organised` | number, required, integer 1–5 |
| `knowledgeSkills` | number, required, integer 1–5 |
| `navigation` | number, required, integer 1–5 |
| `workload` | number, required, integer 1–5 |
| `peerConnection` | number, required, integer 1–5 |
| `whatWouldChange` | text, required |
| `submittedAt` | datetime, required |

**`_id`:** `feedback.{clerkUserId}.{courseId}` with both segments sanitized to Sanity-safe id characters. Confirm the course exists server-side before write. Never trust a client-supplied document id.

Preview: course title + `clerkUserId`.

Register both types in `studio/schemaTypes/index.ts`. Desk: after Learner progress, add **Onboarding** and **Course feedback** lists (read-only types; authors can **view** rows, not invent them).

Do **not** put form answers on `progress`.

### Write path

Reuse `getWriteClient()`. Two routes:

**`POST /api/onboarding`**

1. `auth()`. Unauthenticated → **401**. Never take `userId` from the body.
2. Zod-parse the onboarding fields (strict). Invalid → **400**.
3. If a document already exists for this user → **200** with `{ alreadySubmitted: true }` (idempotent; do not overwrite).
4. `createIfNotExists` with `_id`, `_type: "onboarding"`, `clerkUserId`, answers, `submittedAt: now`.
5. Set the onboarding cookie (below). **200**.

**`POST /api/feedback`**

1. `auth()`. **401** if signed out.
2. Zod: `courseId` + feedback fields. `courseId` must be a safe Sanity id (same regex as progress). Unknown course → **400**.
3. Load the course. If `feedbackEnabled !== true` → **400**.
4. Confirm this learner has completed **every lesson** in that course (same completion rule as `coursePercent === 100`). If not → **403**.
5. If feedback already exists for this user+course → **200** `{ alreadySubmitted: true }` (no overwrite).
6. `createIfNotExists` with the deterministic `_id`. **200**.

Browser `fetch`es these routes same-origin with cookies. Token never in the client.

Protect in `proxy.ts`: `/onboarding(.*)`, `/api/onboarding(.*)`, `/courses/.*/feedback(.*)`, `/api/feedback(.*)` (plus existing `/my-learning` and `/api/progress`).

### Read path

Server-only helpers (`cache: 'no-store'`), query by `clerkUserId` (and course id for feedback). Never fetch another user’s documents.

Helpers:

- `hasCompletedOnboarding(userId): boolean`
- `hasCourseFeedback(userId, courseId): boolean`
- `isCourseComplete(progress, courseLessonIds): boolean` — reuse `coursePercent === 100`

### Gate UX (this is the product)

**Not a modal overlay.** `/onboarding` is a real page: Header (search off is fine), short title (“Before you start”), one-line why (“About a minute — then you can begin.”), then the three sections (About You, Your Stage, Your Motivation), primary submit. Reuse `Input`, radios for stage (not a dropdown), textareas for the two motivation questions, `Button`. Mobile: single column, no horizontal overflow.

**Catch every sign-in, including the header modal.** Because Clerk modal does not navigate to a fallback URL:

1. **Cookie (middleware):** After a successful onboarding POST, set an httpOnly cookie whose **value is the Clerk user id** (e.g. `vertex_onboarded=<userId>`), `path=/`, `SameSite=Lax`, `secure` in production. In `proxy.ts`, if the user is authenticated, the cookie is missing **or does not equal this `userId`**, and the path is not onboarding / sign-in / sign-up / Clerk internals / `/api/onboarding`, **redirect to `/onboarding?next=<original path>`**.
2. **Source of truth (Sanity):** `/onboarding` loads the document. If it already exists, set/refresh the cookie and redirect to `next` (must be a same-origin relative path; default `/courses`). If a forged cookie appears, the next real check (onboarding page or a learning layout) still uses Sanity.
3. **Learning routes:** Lesson pages, `/my-learning`, and `/search` — if signed in and Sanity says no onboarding, `redirect('/onboarding?next=...')`. Defense in depth if middleware and cookie drift.
4. **Signed-out Continue:** Keep catalog/course **viewing** public. For **Start / Continue** on the course hero: if signed out, use Clerk `SignInButton` (or redirect to sign-in) with return to that resume/first-lesson URL. After sign-in they hit the onboarding gate, then `next`. Do not send a signed-out click straight into a lesson **from that CTA** anymore — testers would skip the form. Direct lesson URLs stay public when signed out (AGENTS.md public browsing). Once **signed in**, a lesson URL without onboarding redirects to `/onboarding`.

On `/onboarding`, if they are already done, never flash the form; redirect immediately.

### Finish-course → feedback UX

Fix the last-lesson dead end:

- When this is the **last lesson** and the user is signed in, `LessonNav` shows a primary **Complete course** (or “Finish”) that POSTs `completed: true` for this lesson (existing progress API), then:
  - if the course has `feedbackEnabled` and they have no feedback yet → `/courses/[slug]/feedback`
  - else → course page
- If YouTube `ENDED` on the last lesson and the same conditions hold, `LessonProgressSync` may navigate to feedback **once** after the complete POST. Do not interrupt mid-video. Do not use a popup over the player.
- Feedback page: same visual language as onboarding. Title uses the **real course name**. Submit → `/courses/[slug]` or `/my-learning`. If the course has feedback off, or they already submitted, or the course is not 100% complete → do not show the form; `redirect` to the course page.
- If they finished earlier and skipped feedback: on the course page when `feedbackEnabled` && 100% && no submission, a single secondary link/button **Share feedback** is enough. Not a modal. Not in the global header.

### What the search agent must not see

Leave `groqFilter` and the Context NDJSON alone. Do not add `onboarding` or `courseFeedback` to any search prompt.

## Files expected to touch

**Studio**

- `studio/schemaTypes/documents/course.ts` — `feedbackEnabled`
- `studio/schemaTypes/documents/onboarding.ts` — new
- `studio/schemaTypes/documents/courseFeedback.ts` — new
- `studio/schemaTypes/index.ts`
- `studio/structure.ts`

**Web**

- `sanity/lib/queries.ts` — onboarding + feedback + `feedbackEnabled` on course fetches that need it (`COURSE_BY_SLUG_QUERY` and whatever the lesson page needs to know last-lesson + toggle)
- `app/api/onboarding/route.ts`
- `app/api/feedback/route.ts`
- `app/onboarding/page.tsx`
- `app/courses/[slug]/feedback/page.tsx`
- `components/onboarding/onboarding-form.tsx` (client)
- `components/feedback/feedback-form.tsx` (client)
- `lib/forms/questions.ts` (or similar) + document-id helpers
- `lib/onboarding-server.ts` (or combined learner-state server module)
- `proxy.ts`
- `components/nav/auth-controls.tsx` and/or course hero — signed-out Start/Continue → sign-in with `next`
- `components/course/course-hero.tsx` / course page — feedback affordance when complete
- `components/lesson/lesson-nav.tsx` — last-lesson Complete course
- `components/lesson/lesson-progress-sync.tsx` — optional last-lesson ENDED → feedback
- `app/courses/[slug]/lessons/[lessonSlug]/page.tsx` — gate + last-lesson props
- `app/courses/[slug]/page.tsx` — Continue/sign-in + feedback link
- `app/search/page.tsx` and `app/my-learning/page.tsx` — signed-in onboarding gate
- `sanity.types.ts` — via `npm run typegen` (do not hand-edit)

No new env vars unless a cookie name needs documenting in a comment only. Do not add PostHog events unless a single `onboarding_completed` / `course_feedback_submitted` capture is trivial next to existing progress captures; it is optional, not required.

## Requirements

- Answers are real documents the user can open in Studio and export later via GROQ. That is the dataset.
- Deterministic ids + `createIfNotExists` so double-submit is safe.
- Validate course existence and `feedbackEnabled` on the server.
- `next` query param: only same-origin relative paths (`/` or `/courses/...`). Reject `//`, `http`, and other hosts.
- Accessible forms: labels, `required`, radio groups with `fieldset`/`legend`, focus rings already used on buttons.
- Responsive down to mobile; desktop should look like the rest of Vertex (spacing, type, primary button).
- TypeGen after schema/query changes.

## Security

- Write token server-only. Client never talks to Sanity.
- Never take `clerkUserId` or document `_id` from the client.
- Do not cache onboarding/feedback under shared content tags.
- Onboarding and feedback documents are private learner data; keep the dataset private (already).
- Cookie is a UX hint, not authorization. Completing feedback still requires Sanity progress === 100% for that course.

## Acceptance criteria

- Signed-out user can open home, catalog, a course page, and a lesson. Start/Continue asks them to sign in.
- After sign-in (modal or `/sign-in`), a user without onboarding always lands on `/onboarding` and cannot open a lesson, search, or My Learning until they submit.
- Submitting onboarding creates **one** `onboarding` document. Refresh / second submit does not duplicate or overwrite.
- After onboarding, they return to `next` or `/courses` and can take lessons. Progress still works.
- A course with `feedbackEnabled` false never shows feedback UI.
- A course with the toggle on: completing the last lesson (Complete course, or video end if implemented) goes to `/courses/[slug]/feedback`. Submit creates **one** `courseFeedback` for that user+course. Visiting the URL again does not show an empty form.
- Incomplete course → feedback URL redirects away.
- Studio: course shows the Learners toggle; Onboarding and Course feedback lists show submitted rows as read-only.
- Search still does not query these types.

## Checks to run

From repo root (web):

- `npm run typecheck`
- `npm run lint`
- `npm run build` (routes + API + `proxy.ts` change)
- `npm run typegen --prefix studio` after schema/query edits

Studio (after implementation, from `studio/`):

- `npx sanity schema deploy` (or the project’s equivalent) so the Cloud schema matches
- `npm run deploy` if Studio UI must pick up the new desk lists (schema deploy alone is not always enough for the hosted Studio app)

Do not claim a check passed without running it.

## Manual test steps

1. Signed out: open `/`, `/courses`, a course, a lesson. Confirm they still load.
2. On a course page, click Start/Continue. Sign in (new Clerk user). Confirm `/onboarding` with no skip.
3. Try `/courses/.../lessons/...` and `/my-learning` in another tab while the form is unfinished. Confirm redirect back to onboarding.
4. Submit onboarding. Confirm redirect into the course/lesson `next`. In Studio, open **Onboarding** and see one row.
5. Submit onboarding again (devtools replay). Confirm still one document, same answers.
6. In Studio, on a **test** course, set **Feedback** on, publish. Complete every lesson (Complete course on the last one). Confirm the feedback page. Submit. Confirm one **Course feedback** row. Refresh the feedback URL — no second form.
7. Turn feedback **off** on another course, publish, complete it (or use a user who already finished). Confirm no feedback page.
8. Sign out, sign in as the same user. Confirm onboarding does not show again.
9. Sign in as a second user. Confirm they get onboarding (cookie must not leak from user 1).

## Sanity-side work (authors / you after code lands)

The app cannot collect data until this is done:

1. **Deploy the schema** (and Studio if desk items are missing) so production knows `onboarding`, `courseFeedback`, and `course.feedbackEnabled`.
2. **Turn feedback on** for the course you want testers to review, then **publish**. Leave other test courses off unless you are dogfooding the toggle.
3. **Do not create** onboarding/feedback documents by hand. The web app creates them.
4. **Write token:** the existing `SANITY_API_WRITE_TOKEN` (Editor) must be allowed to create these types — same token as progress. No new token if that one already writes `progress`.
5. **Search Context:** no change. Do not add the new types to `groqFilter`.
6. When you later delete test courses and upload the real course, turn **Feedback** on for that new course after it is published. Onboarding documents already collected stay (they are per user, not per course). Feedback rows for deleted courses will dangle by reference — acceptable; do not build a cleanup migration in this pass.

## Out of scope

- Replacing or deleting current test courses
- Per-course custom questions / Studio form builder
- Enrollment, payments, certificates
- Emailing testers, reminders, or incomplete-course nag
- Admin analytics dashboards
- Changing search behavior or the Context document
