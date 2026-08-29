# Implement a downloadable certificate of completion

## Goal

After a learner finishes a course, they receive a **certificate of completion** they can download as a PDF.

If that course has the post-survey on (`feedbackEnabled`), the certificate unlocks **only after** they submit feedback. If the survey is off, the certificate unlocks as soon as the course is 100% complete.

This is a real downloadable file, not “print this page.” Do not wait for a designer PNG. Build a simple branded A4 in code, using Vertex type and color (orange primary, Playfair-like display via PDF Times, Inter-like body via Helvetica). If a design file arrives later, replace the layout — do not invent a second visual language now.

## Skills read

- `AGENTS.md` — pages are read-only; learner state is separate; browser never holds a write token; Clerk `userId` is the key; browsing stays public; gate only what this feature marks as protected; do not overbuild; match existing UI primitives when there is no design PNG.
- `.agents/skills/clerk-nextjs-patterns/SKILL.md` + `references/api-routes.md` — `await auth()`; Clerk v7 `isAuthenticated`; 401 vs 403; protect the certificate page and PDF route the same way as feedback.
- `.agents/skills/sanity-best-practices/SKILL.md` — no new authored content type; do not store PDFs in Sanity; do not add certificate docs unless a field is required for eligibility (it is not).
- Next.js App Router as already used (`proxy.ts`, `params` as Promises, Node route handlers). `node_modules/next/dist/docs/` was not present in this workspace snapshot; follow existing routing and server/client boundaries. The PDF route must run on the **Node.js** runtime, not Edge.

## Code inspected

- Finish path today: last lesson `finishHref` is `/courses/[slug]/feedback` when `feedbackEnabled` and no submission, else the course page (`app/courses/[slug]/lessons/[lessonSlug]/page.tsx`). `LessonNav` “Complete course” and YouTube `ENDED` (`LessonProgressSync` `completeHref`) both follow that href.
- Feedback submit (`components/feedback/feedback-form.tsx`) `router.push(courseHref)` after POST. Change this to the certificate page.
- Course page CTA (`app/courses/[slug]/page.tsx`): in progress → Continue Learning; 100% + feedback due → Share feedback; 100% otherwise → Review course. When the certificate is unlocked, that last state becomes the certificate (not “Review course” as the primary).
- Name source: onboarding `fullName` (`studio/schemaTypes/documents/onboarding.ts`), already required. `ONBOARDING_BY_USER_QUERY` currently returns only `_id`. Add a query that also returns `fullName` (and `_id` if useful). Fallback: Clerk `currentUser()` name if onboarding name is missing. Never print a blank name.
- Eligibility inputs already exist: `isCourseComplete` / `coursePercent`, `hasCourseFeedback`, `course.feedbackEnabled`, `getProgressForUser`. Reuse them. Do not mix certificate state into `progress`.
- `proxy.ts`: public-first; `auth.protect()` on My Learning, onboarding, feedback, and those APIs. Cookie gate skips `/api/*`. Add the certificate page and PDF route to `isProtectedRoute`.
- UI: `Header`, `Button` / `buttonClassName`, course-page grid background, footer. **No certificate design PNG.** Reuse those primitives on the web page. PDF is a separate A4 layout in `pdf-lib`, not HTML-to-PDF.
- Env: no new secrets. No write token needed (PDF is generated on demand, not stored).
- Stack: Next 16, React 19. Prefer `pdf-lib` over `@react-pdf/renderer` to avoid renderer/RSC issues. No Puppeteer, no print-dialog, no third-party credentialing (Accredible, Certifier).

## Decisions and assumptions

### Unlock rule (source of truth)

A signed-in learner may see and download a certificate for a course when **all** of:

1. Every lesson in that course is in `completedLessonIds` (`isCourseComplete`).
2. If `course.feedbackEnabled === true`, a `courseFeedback` document exists for that Clerk user + course. If the toggle is off, skip this check.
3. They have completed onboarding (already required for signed-in learning).

Do **not** add a Studio `certificateEnabled` toggle. Every completed course issues a certificate. The survey is the only extra gate, and it already exists.

Unsigned visitors never see the certificate page or PDF. `auth.protect()` on those routes.

### Product flow

| Moment | Where they go |
|---|---|
| Last lesson, survey on, not yet submitted | `/courses/[slug]/feedback` (unchanged) |
| Last lesson, survey off **or** survey already submitted | `/courses/[slug]/certificate` (was the course page) |
| Feedback form submitted | `/courses/[slug]/certificate` (was the course page) |
| Course page, 100%, survey still due | Primary CTA **Share feedback** (unchanged) |
| Course page, certificate unlocked | Primary CTA **Download certificate** → certificate page (replace **Review course** as primary) |
| Course page, in progress | Continue Learning (unchanged) |
| Open certificate URL before eligible | Redirect: incomplete → course page; survey due → feedback page |
| Already downloaded | Same page and PDF; generating again is fine |

My Learning: do not redesign cards. Completed courses already appear via `courseHasStarted`. The course page and certificate page are enough. Do not add a new My Learning section in this pass.

Do not build: public verification URLs, QR codes, unique credential IDs, emailing the PDF, storing files in Sanity or Vercel Blob, per-course certificate copy in Studio, or a certificate designer.

### Web page (`/courses/[slug]/certificate`)

Signed-in only. Onboarding gate like other learning routes (`redirectIfOnboardingIncomplete`).

Layout: same family as the feedback page (Header, max width, grid background). Copy, exact:

- Title: **Certificate of completion**
- Body: **You have completed {course title}.** Then one line that they can download a PDF.
- Primary button: **Download PDF** — links to the PDF route (`Content-Disposition: attachment` so it downloads).
- Secondary text link: **Back to course** → `/courses/[slug]`.

Show the learner’s name (onboarding `fullName`) so they can see what will print. Do not fake a full-page HTML replica of the PDF.

### PDF

- Library: `pdf-lib`.
- Size: A4 **landscape**.
- Runtime: Node (`export const runtime = "nodejs"` if the project defaults otherwise).
- Filename: `EOS-Academy-{course-slug}-certificate.pdf`.
- Route: `GET /api/certificates/[courseId]` (Sanity course `_id`). Check auth, then eligibility; 401 if signed out, 403 if signed in but not eligible, 404 if unknown course.
- Cache: `Cache-Control: private, no-store`. Never cache one learner’s PDF for another.

**Drawn content (this copy, this order):**

1. Small Eos triangle mark (simple paths, `primary-500` `#f97316`) + **EOS Academy**
2. **Certificate of Completion**
3. **This certifies that**
4. Learner **full name** (largest type)
5. **has successfully completed**
6. Course **title** from Sanity (never invent a title)
7. Issue date, human readable (e.g. `29 August 2026`)
8. Footer: **Education · Opportunity · Support**

Colors: slate/navy text (`#0f172a`, `#64748b`), orange accent rule, generous margins, a thin border inset. Standard PDF fonts only (`TimesRoman` / `Helvetica` / `HelveticaOblique`) — do not embed `next/font` files in this pass (fragile on serverless).

**Issue date (stable, no new document):**

- Survey required: `courseFeedback._createdAt`
- Survey off: progress document `_updatedAt` (when they reached 100%)
- If a date is missing, use today’s UTC date — do not fail the download

Never invent a course, name, or completion they do not have.

### Data

No new Sanity types. No TypeGen schema deploy required unless you add a query-only change (TypeGen for GROQ is still required if you add queries).

New GROQ (examples; match existing `defineQuery` style):

- Onboarding name: `*[_type == "onboarding" && clerkUserId == $userId && !(_id in path("drafts.**"))][0]{ fullName }`
- Feedback created-at when needed: extend the feedback-by-user-course query or add `{ _id, _createdAt }`
- Progress `_updatedAt` when needed for the date
- Reuse `COURSE_FOR_FEEDBACK_QUERY` (already has `_id`, title, slug, `feedbackEnabled`, `lessonIds`) or the equivalent by slug for the page

Put a shared helper in `lib/` (e.g. `lib/certificate.ts` + server-only eligibility) so the page and the GET route do not duplicate the unlock rule.

### Analytics

Capture `certificate_downloaded` in the browser when they click Download PDF (`course_id` / slug). Do not send PII in the event. No server-side PostHog key.

### Security

- PDF bytes only for the **current** Clerk user who is eligible for **that** course.
- `courseId` must pass the same `isSafeSanityId` check as feedback.
- Read token stays server-only. No write.
- Do not put name, course id, or user id in query strings that another user could guess to fetch someone else’s file — the session is the only key.

## Files expected

- `lib/certificate.ts` (and/or `lib/certificate-server.ts`) — eligibility + date + name
- `lib/certificate-pdf.ts` — `pdf-lib` document builder (server-only)
- `app/api/certificates/[courseId]/route.ts` — GET PDF
- `app/courses/[slug]/certificate/page.tsx` — congratulations + download
- `sanity/lib/queries.ts` — onboarding name; feedback/progress dates as needed; TypeGen
- `proxy.ts` — protect `/courses/(.*)/certificate(.*)` and `/api/certificates(.*)`
- `app/courses/[slug]/page.tsx` — primary CTA when unlocked
- `app/courses/[slug]/lessons/[lessonSlug]/page.tsx` — `finishHref` → certificate when unlocked
- `components/feedback/feedback-form.tsx` — redirect to certificate after submit
- `package.json` — add `pdf-lib`

Do not change search Context, Studio desk lists, or course schema.

## Requirements

1. Certificate unlocks only under the rule above.
2. Survey-on courses: no PDF and no certificate page until feedback exists.
3. Survey-off courses: certificate after 100%, no feedback step.
4. Download is a real `application/pdf` attachment.
5. Name and course title come from stored data.
6. Signed-out users cannot hit the page or the file.
7. No PDF stored in Sanity or the repo.
8. UI matches existing Vertex pages, not a new brand.

## Security considerations

Session-gated download; 401/403 as above; private dataset reads on the server; no new tokens; no PII in PostHog; no public certificate URL.

## Acceptance criteria

- Completing the last lesson on a survey-off course lands on the certificate page; Download PDF saves an A4 landscape file with the onboarding name and course title.
- Completing the last lesson on a survey-on course still goes to feedback; after submit, the certificate page; PDF date matches feedback `_createdAt`.
- Opening `/courses/{slug}/certificate` at 90% redirects to the course; at 100% with survey due redirects to feedback.
- Course page primary button is **Download certificate** only when unlocked.
- Signed-out request to the PDF route is 401 (or Clerk sign-in from the page).
- Another user’s `courseId` in the URL cannot download this learner’s certificate (they only get their own if eligible).
- Typecheck and lint pass; production build passes because the PDF route is new server code.

## Checks to run

From the app root (this repo’s Next app):

- `npm run typecheck`
- `npm run lint`
- `npm run build` (new route + server PDF module)

No Studio schema deploy. No content import.

## Manual test steps

1. Use a course with **feedback off**. Sign in (onboarding done). Complete every lesson (or mark complete through the last-lesson CTA). Land on `/courses/{slug}/certificate`. Confirm name. Download PDF. Open it: A4 landscape, name, course title, date, EOS Academy.
2. Use a course with **feedback on**. Complete lessons → feedback form (not certificate). Submit → certificate page. Download PDF. Date should be the feedback day.
3. Visit the certificate URL before finishing the course → redirected to the course page.
4. At 100% with feedback still due, visit the certificate URL → redirected to feedback.
5. Sign out. Hit the certificate page → Clerk sign-in. Hit `/api/certificates/{id}` → unauthorized.
6. Course page at 100% unlocked: primary **Download certificate**. Mid-course: still **Continue Learning**. Survey due: still **Share feedback**.
