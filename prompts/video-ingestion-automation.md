# Automatic video ingestion on Studio publish

## Goal

**Authors never run terminal commands.** When an author publishes a lesson with a YouTube `videoUrl` in
Sanity Studio, the platform automatically creates or updates the matching `video` document
(chapters + transcript chunks) so search can return VIDEO results with real timestamps.

Author experience:

1. Add a course, modules, and lessons in Studio (as today).
2. Set each lesson's `videoUrl` (YouTube).
3. **Publish** the lesson(s).
4. Done — no `ingest:videos`, no NDJSON import, no deploy step for the author.

Behind the scenes: Sanity fires a **webhook** → `POST /api/ingest/video` on the Next.js app → server
fetches captions/chapters → upserts one `video` doc per unique URL.

The existing batch CLI pipeline (`studio/scripts/ingest/*`) stays as a **developer-only** tool for
initial seeding and disaster recovery. It is not part of the author workflow.

## Skills and docs read

- `AGENTS.md` §§5, 7, 9, 12, 13 — ingestion is offline (not in the learner request path); `video`
  docs are internal lookup; write token server-only; YouTube-only adapter for now; deterministic ids;
  never write a doc with empty `chunks`.
- `.agents/skills/sanity-best-practices/SKILL.md` + `references/functions.md` — **Sanity Functions
  are not v1** (YouTube scrape is brittle, runtime limits, hard to debug). A **webhook → server route**
  is the right automatic trigger. Functions doc consulted to confirm when not to use them.
- `references/nextjs.md` — webhook / revalidation patterns in Next.js App Router.
- Existing code: `studio/scripts/ingest/*` (batch + YouTube adapter to port), `sanity/lib/write-client.ts`,
  `lib/search/run-search.ts` (search reads `video` docs), `proxy.ts` (Clerk — ingest route must stay
  outside `auth.protect()`).

## Code inspected

- `studio/scripts/ingest/ingest-videos.mjs` — batch fetch, 1200ms throttle, cache, never partial writes.
- `studio/scripts/ingest/build-ndjson.mjs` — document shape, validation, deterministic `_key`s.
- `studio/scripts/ingest/parse-video-url.mjs` + `providers/youtube.mjs` + `chunk.mjs` — working YouTube
  path (InnerTube iOS + json3 cues).
- `sanity/lib/write-client.ts` — Editor token, used by `/api/progress`; reuse for ingest upserts.
- `studio/schemaTypes/documents/lesson.ts` — `videoUrl` required, host allowlist (YouTube/Vimeo/Bunny).
- `studio/schemaTypes/documents/video.ts` — read-only in Studio; pipeline owns the data.
- Search is server-side GROQ (`lib/search/run-search.ts`) — new lessons need `video` docs for VIDEO hits.

## Decisions and assumptions

### Primary mechanism: Sanity webhook → `/api/ingest/video`

**One-time setup** (platform admin, not authors):

| Step | Where |
|---|---|
| Deploy Next.js app with ingest route | Vercel |
| Set env vars | `SANITY_API_WRITE_TOKEN`, `INGEST_WEBHOOK_SECRET` |
| Create webhook | sanity.io/manage → API → Webhooks |

**Webhook config:**

- **Name:** Video ingestion on lesson publish
- **Dataset:** `production`
- **Trigger:** Create + Update on **`lesson`** documents
- **Filter:** `_type == "lesson" && defined(videoUrl)`
- **Projection:** `{ "videoUrl": videoUrl }` (minimal payload)
- **URL:** `https://<production-domain>/api/ingest/video`
- **HTTP method:** POST
- **API version:** current project default
- **Deliver only on publish:** enable if the UI offers it (do not ingest drafts)

When an author publishes one lesson → one webhook → one video ingested (~5–15s).  
When they publish a course with 12 new lessons → up to 12 webhooks (one per lesson publish). Dedupe
by video URL so two lessons sharing one YouTube video produce one `video` doc.

**Courses do not carry `videoUrl`.** The webhook listens on **`lesson`**, not `course`. Authors publish
lessons (or bulk-publish); each lesson triggers its own ingest.

### Server route behaviour

`POST /api/ingest/video` — App Router handler, `server-only` ingestion core.

1. **Verify webhook authenticity** before any work — use Sanity's webhook signature verification
   (`@sanity/webhook` / `isValidSignature` or equivalent). Reject unsigned/invalid requests with **401**.
   Also accept `Authorization: Bearer <INGEST_WEBHOOK_SECRET>` for local curl smoke tests.
2. **Parse payload** — Sanity sends `{ ids: string[], ... }`. For each id, fetch the published lesson's
   `videoUrl` with the read client (`*[_type=="lesson" && _id==$id][0]{ videoUrl }`). Skip drafts.
3. **Dedupe URLs** in the batch (same webhook can include multiple ids).
4. For each unique URL: call `ingestVideoByUrl(url)`.
5. Return **200** with `{ ingested, skipped, failed }` even when individual URLs fail (list failures in
   body; avoid 500 for partial success so Sanity does not endlessly retry successful work).
6. `export const runtime = 'nodejs'`, `dynamic = 'force-dynamic'`, `maxDuration = 60` (one video per
   invocation is the common case).

**Do not** gate this route with Clerk. Sanity has no user session.

### Ingestion core: `lib/ingest/` (server-only TypeScript)

Vercel deploys the **web** workspace, not `studio/scripts/*.mjs`. Port the working YouTube logic into
`lib/ingest/` so the webhook route runs in production:

| Module | Responsibility |
|---|---|
| `parse-video-url.ts` | Mirror `parse-video-url.mjs` — provider, id, `video.youtube-<id>` |
| `chunk.ts` | Cue → chunk merge (~45s / ~350 chars) |
| `providers/youtube.ts` | Port InnerTube fetch from `providers/youtube.mjs` |
| `build-document.ts` | Validate + build `{ _type: 'video', chapters, chunks, ingestedAt }` |
| `ingest-video.ts` | `ingestVideoByUrl(url)` — fetch, validate, `createOrReplace` via write client |

**Upsert rules:**

- `_id`: `video.youtube-<videoId>` (deterministic, same as batch pipeline)
- `chunks`: required, non-empty — **fail the ingest** rather than write an empty doc
- `ingestedAt`: ISO timestamp at fetch time
- Idempotent: re-publish same lesson → replace same doc with fresh transcript

**Provider gating (§9):**

- **YouTube:** ingest
- **Vimeo / Bunny:** skip with `{ reason: 'no adapter' }` in response — playback works, search gets
  lesson-only hits until adapters exist

### What authors see in Studio

- Publish a lesson → no new UI, no button, no terminal
- After ~seconds/minutes: **Videos (ingested)** list shows the doc (`N chapters · M chunks`)
- If ingest failed (YouTube block): lesson still publishes; `video` doc missing until retry — document
  how ops can re-trigger (republish lesson, or dev curl — see below)

### Batch pipeline (developer-only, unchanged)

Keep `npm run ingest:videos` / `ingest:build` / `ingest:import` for:

- First-time dataset seed (120 videos)
- Full re-fetch after YouTube adapter fix (`--force`)
- Recovery when webhooks were misconfigured

Add a short note at the top of `studio/scripts/ingest/README.md`: **authors use publish; developers
use batch only for seed/recovery.**

Optional dev helper (not required for acceptance): a single `curl` example to hit the route manually.
**Do not** add `ingest:missing` / `ingest:one` npm scripts to the author-facing docs.

### Out of scope (v1)

- Sanity Functions / Blueprints as the scraper runtime
- Studio plugin or "Ingest now" button
- Vimeo/Bunny ingestion adapters
- Nightly cron / GitHub Action (optional follow-up for ops)
- Inngest or job queue (only needed at high volume)
- Removing the batch `.mjs` pipeline
- Ingest on **draft** save (publish only)

## Files to touch

**Add**

- `lib/ingest/parse-video-url.ts`
- `lib/ingest/chunk.ts`
- `lib/ingest/providers/youtube.ts`
- `lib/ingest/build-document.ts`
- `lib/ingest/ingest-video.ts`
- `lib/ingest/types.ts`
- `app/api/ingest/video/route.ts`

**Change**

- `.env.example` — `INGEST_WEBHOOK_SECRET=` (server-only, used for signature verification and/or bearer smoke tests)
- `sanity/lib/write-client.ts` — comment: shared by progress + video ingest
- `studio/scripts/ingest/README.md` — author flow vs developer batch flow; **webhook setup checklist**

**Do not add** (unless needed internally during development)

- `cli-one.ts`, `cli-missing.ts`, or npm scripts authors would ever run

## Requirements

1. Author publishes a **new** YouTube lesson in Studio → within one webhook delivery a `video` document
   exists with non-empty `chunks`.
2. Author updates a lesson's `videoUrl` and re-publishes → `video` doc is replaced (same `_id` if same
   YouTube id, new doc if URL changed).
3. Two lessons share one YouTube URL → one `video` doc (deduped by URL / provider id).
4. Vimeo/Bunny URLs → 200 response with URL in `skipped`, no `video` doc written.
5. Invalid webhook signature → 401, no YouTube fetch, no Sanity write.
6. Write token never reaches the browser; all ingest modules use `import 'server-only'`.
7. Batch pipeline still works for developer seeding (unchanged).
8. Search returns a VIDEO hit for a mid-video keyword after automatic ingest (smoke test).

## Security

- `SANITY_API_WRITE_TOKEN` and `INGEST_WEBHOOK_SECRET`: server-only, never `NEXT_PUBLIC_`.
- Verify webhook signature on every request (mandatory in production).
- Parse `videoUrl` through the same allowlist as the lesson schema before fetching YouTube.
- Route performs **no mutations** other than upserting `video` docs keyed by deterministic id.
- Idempotent upserts — safe when Sanity retries webhook delivery.
- Do not log secrets or full webhook signing keys.

## Acceptance criteria

- [ ] Webhook registered in Sanity manage; publishing a test lesson triggers `/api/ingest/video` (visible in Vercel logs).
- [ ] New `video` doc appears in Studio → Videos (ingested) without any terminal command.
- [ ] Site search returns a VIDEO result with `?t=` for a keyword in that video.
- [ ] Forged webhook (no valid signature) → 401.
- [ ] `npm run typecheck`, `npm run lint`, `npm run build` pass.
- [ ] `studio/scripts/ingest/README.md` explains author vs developer workflows and one-time webhook setup.

## Checks to run

```bash
npm run typecheck
npm run lint
npm run build
```

Webhook smoke (local, after `npm run dev`):

```bash
curl -sX POST http://localhost:3000/api/ingest/video \
  -H "Authorization: Bearer $INGEST_WEBHOOK_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"videoUrl":"https://www.youtube.com/watch?v=<known-id>"}' | jq
```

Production: publish a lesson in Studio and confirm the `video` doc + search hit.

## Manual test steps (author workflow)

1. **One-time:** add `INGEST_WEBHOOK_SECRET` and confirm `SANITY_API_WRITE_TOKEN` in Vercel; create
   webhook in sanity.io/manage pointing at `/api/ingest/video`.
2. In Studio, create or duplicate a lesson with a **new** YouTube URL not yet in Videos (ingested).
3. **Publish** the lesson.
4. Within ~30s, open Studio → Videos (ingested) — doc shows `N chapters · M chunks`.
5. On the site, search for a phrase taught mid-video — VIDEO card with Watch from mm:ss.
6. Edit the lesson's `videoUrl` to a different YouTube video, re-publish — new `video` doc (or updated
   doc) reflects the new URL.
7. Security: POST to the route without a valid signature → 401.

## Needs your attention

- **Webhook URL must be production** — local Studio cannot hit `localhost` unless you use a tunnel
  (ngrok) for development; for local webhook testing, use curl with bearer secret instead.
- **Vercel env** — `SANITY_API_WRITE_TOKEN` and `INGEST_WEBHOOK_SECRET` on production before authors
  publish real content.
- **YouTube fragility** — if ingest starts failing site-wide, fix `lib/ingest/providers/youtube.ts`;
  batch `.mjs` remains the developer fallback to re-seed.
- **Optional later:** nightly reconciliation job if webhook misses are unacceptable — invisible to
  authors, ops-only.
