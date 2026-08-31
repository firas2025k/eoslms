# Send transactional emails after onboarding and certificate unlock

## Goal

After a learner submits **onboarding**, email them a short welcome. After they **unlock a certificate** (survey submitted when `feedbackEnabled`, otherwise when the course hits 100%), email them that the PDF is ready.

Do **not** email form answers. Do **not** attach the PDF. Do **not** BCC EOS staff. Resend is the sender. The Sanity write is the source of truth; email is best-effort.

## Skills read

- `AGENTS.md` — writes stay on the server; secrets never in the browser; do not overbuild; browsing/auth boundaries unchanged.
- `.agents/skills/resend/SKILL.md` + `references/installation.md` + `references/sending/overview.md` + `references/sending/best-practices.md` — `npm install resend` (latest, min 6.14); `new Resend(process.env.RESEND_API_KEY)`; SDK returns `{ data, error }` (does **not** throw for API errors); idempotency key option `{ idempotencyKey }`; `from` format `Name <email@domain.com>`.
- `.agents/skills/email-best-practices/SKILL.md` + `references/email-types.md` + `references/transactional-emails.md` + `references/sending-reliability.md` + `references/accessibility.md` — these are transactional (user-initiated confirmation), not marketing; no promo, no unsubscribe required; send immediately after the event; if send fails, the user action still succeeded; `lang`/`dir` on `<html>` and the body wrapper; 16px body; tappable button; include a `<title>`; prefer a text part as well as HTML. No React Email package in this pass (simple HTML strings).

## Code inspected

- `POST /api/onboarding` saves the Sanity doc then returns JSON. Email of record is `parsed.data.email`. `alreadySubmitted` returns early — do not send then.
- `POST /api/feedback` saves then returns. Certificate unlocks at that moment when the survey is on. `alreadySubmitted` — do not send then.
- `POST /api/progress` patches completion. For courses with **feedback off**, certificate unlocks the first time this write makes the parent course 100%. Need a GROQ reverse-ref: course that references this lesson (`_id`, `title`, `slug`, `feedbackEnabled`, `lessonIds`). Compare complete **before** vs **after** the write so a later resume tick does not resend (idempotency is the backstop).
- `lib/request-origin.ts` already builds `https://host` from forwarded headers — use it for absolute links.
- `lib/certificate.ts` has `certificatePagePath(slug)`.
- Onboarding name query already exists (`ONBOARDING_NAME_BY_USER_QUERY`). Extend or add a query that also returns `email` for the certificate send (progress path has no form body).
- `.env.example` has no Resend vars yet. Footer already uses `info@eosacademy.global`.
- No `resend` package today.

## Decisions

### When to send

| Event | Email | Idempotency key |
|---|---|---|
| Onboarding created (not `alreadySubmitted`) | Welcome | `welcome/${clerkUserId}` |
| Feedback created (not `alreadySubmitted`) | Certificate ready | `certificate-ready/${clerkUserId}/${courseId}` |
| Progress write that **newly** completes a course with `feedbackEnabled !== true` | Certificate ready | same as above |

Do not send certificate-ready when the survey is still required. Do not send welcome or certificate on GET routes.

### Copy (exact)

**Welcome**

- Subject: `Welcome to EOS Academy`
- Title / heading: `Welcome to EOS Academy`
- Body: `Hi {firstNameOrFullName},` then `Thanks for joining EOS Academy. Your place on the programme is confirmed.` then `You can start a course whenever you are ready.`
- Button: `Start learning` → `{origin}/courses`
- Footer line: `EOS Academy · Education · Opportunity · Support`

**Certificate ready**

- Subject: `Your certificate for {courseTitle} is ready`
- Heading: `Your certificate is ready`
- Body: `Hi {firstNameOrFullName},` then `You have completed {courseTitle}. Your certificate of completion is ready to download.`
- Button: `Download certificate` → `{origin}{certificatePagePath(slug)}`
- Footer: same as welcome

First name: first token of `fullName` if it contains a space, else the full name. Never leave `Hi ,`.

Plain-text alternative with the same sentences and raw URLs.

HTML: `lang="en"` `dir="ltr"` on `<html>` and the inner wrapper; orange (`#f97316`) button, navy text (`#0f172a`); one column; no layout tables unless marked `role="presentation"`. No survey answers, no Likert numbers.

### Send mechanics

- `lib/resend.ts` (server-only): client from `RESEND_API_KEY`. If the key is missing, log and return (local/dev still works).
- `from`: `RESEND_FROM` env, default `EOS Academy <onboarding@resend.dev>` so local tests work before the domain is verified. Production should set `EOS Academy <hello@eosacademy.global>` (or similar) after DNS in Resend.
- `replyTo`: `RESEND_REPLY_TO` or `info@eosacademy.global`.
- After Sanity **succeeds**, call send. Check `{ error }` and `console.error`; **never** fail the HTTP handler because email failed. One attempt (no retry loop) in this pass.
- Recipient: onboarding `email` (the address they typed). Certificate-from-progress: fetch onboarding `fullName` + `email`. If email is missing, skip and log.

### Do not build

React Email, Resend templates dashboard, webhooks, broadcasts, contacts/segments, PDF attachments, staff notify, marketing, unsubscribe, queue/worker.

## Files expected

- `lib/resend.ts` — send helper + HTML/text builders
- `sanity/lib/queries.ts` — onboarding name+email; course-by-lesson for progress
- `app/api/onboarding/route.ts` — send welcome after create
- `app/api/feedback/route.ts` — send certificate-ready after create
- `app/api/progress/route.ts` — send certificate-ready on new 100% when survey off
- `.env.example` — `RESEND_API_KEY`, `RESEND_FROM`, `RESEND_REPLY_TO`
- `package.json` — `resend`

TypeGen after new queries.

## Security

`RESEND_API_KEY` server-only. Never `NEXT_PUBLIC_`. Send only to the learner’s stored email, not a client-supplied extra address on the certificate path (onboarding POST may use the form email — already validated). Absolute links use the request origin, not a hardcoded production host (unless you already have a site URL env; prefer `requestOrigin()`).

## Acceptance criteria

- First onboarding submit → one welcome email; second submit (`alreadySubmitted`) → none.
- Feedback-on course: complete last lesson → no certificate email; submit survey → one certificate email with a working signed-in download link.
- Feedback-off course: completing the last lesson → one certificate email; later progress saves → none.
- Missing `RESEND_API_KEY` → forms still 200, nothing thrown.
- Resend API error → forms still 200, error logged.
- Typecheck and lint pass.

## Checks

- `npm run typecheck`
- `npm run lint`
- Production build (API/server modules changed)

## Manual test (needs a Resend test key)

1. Set `RESEND_API_KEY` in `.env.local`. Until the domain is verified, `from` must be `onboarding@resend.dev` and `to` must be the Resend account email (or use `delivered@resend.dev` only for sandbox — for a real inbox, send to yourself).
2. Sign in, submit onboarding → inbox: welcome, Start learning → `/courses`.
3. Feedback-off course: finish last lesson → certificate email, button → certificate page.
4. Feedback-on course: finish last lesson → no mail; submit feedback → certificate mail.
5. Submit onboarding/feedback a second time → no second mail.
6. Unset the key, submit onboarding → page still succeeds.

## Needs the user

Verify `eosacademy.global` (or a sending subdomain) in the Resend dashboard and set `RESEND_FROM` / `RESEND_API_KEY` on Vercel before testers should get real mail. Until then, only the Resend account holder receives `onboarding@resend.dev` sends.
