# Video ingestion

Builds the `video` documents search depends on: one per unique video URL, with chapter markers
(table of contents) and transcript chunks (AGENTS.md §9).

## For authors (normal workflow)

**You do not run anything in the terminal.**

1. Add or edit a lesson in Studio and set its YouTube `videoUrl`.
2. **Publish** the lesson.
3. A webhook calls `POST /api/ingest/video` on the deployed site, which fetches captions/chapters
   and upserts the matching `video` document automatically.
4. After ~seconds, check Studio → **Videos (ingested)** — the doc should show `N chapters · M chunks`.

Search VIDEO results for that lesson work once the doc exists.

### One-time webhook setup (platform admin)

Do this once per environment (production):

1. Generate a secret: `openssl rand -hex 32`
2. Add to Vercel (and `.env.local` for local curl tests):
   - `INGEST_WEBHOOK_SECRET=<secret>`
   - `SANITY_API_WRITE_TOKEN=<Editor token>` (same as progress)
3. In [sanity.io/manage](https://sanity.io/manage) → **API** → **Webhooks** → **Create**:
   - **Name:** Video ingestion on lesson publish
   - **URL:** `https://<your-production-domain>/api/ingest/video`
   - **Dataset:** `production`
   - **Trigger:** Create + Update on document type **`lesson`**
   - **Filter:** `_type == "lesson" && defined(videoUrl)`
   - **Projection:** `{ "videoUrl": videoUrl }`
   - **Secret:** same value as `INGEST_WEBHOOK_SECRET`
   - **HTTP method:** POST
   - Deliver on **publish** only (if the UI offers it)

Local Studio cannot reach `localhost` unless you use a tunnel (ngrok). For local testing, use curl
(see below).

### Smoke test (developers)

```bash
curl -sX POST http://localhost:3000/api/ingest/video \
  -H "Authorization: Bearer $INGEST_WEBHOOK_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"videoUrl":"https://www.youtube.com/watch?v=<youtube-id>"}' | jq
```

---

## For developers (batch seed / recovery)

Use the offline batch pipeline when seeding a new dataset, re-fetching everything after a YouTube
adapter fix, or recovering from webhook misconfiguration. **Authors never run these.**

Incremental upserts in production live in `lib/ingest/` (TypeScript, used by the webhook route).
Keep `providers/youtube.mjs` in sync with `lib/ingest/providers/youtube.ts` until the batch path
is migrated.

```bash
cd studio
npm run ingest:videos    # fetch chapters + transcripts for anything not cached
npm run ingest:build     # expand the cache into videos.ndjson
npm run ingest:import    # sanity dataset import ... --replace
```

| Flag | What it does |
| --- | --- |
| `--limit=N` | Fetch at most N videos. Use for a smoke run. |
| `--force` | Ignore the cache and re-fetch everything. |

Both reads and the import authenticate through the Sanity CLI, so no write token is needed for import.

## The files

| File | What it is |
| --- | --- |
| `ingest-videos.mjs` | Batch runner: queries lesson video URLs, dedupes, fetches, caches. |
| `providers/youtube.mjs` | YouTube adapter for batch CLI (mirror of `lib/ingest/providers/youtube.ts`). |
| `chunk.mjs` | Caption cues → timestamped chunks. |
| `parse-video-url.mjs` | Provider + id from a lesson's `videoUrl`. |
| `build-ndjson.mjs` | Expands the cache into NDJSON, self-checking as it goes. |
| `.cache/` | One JSON per video. Not committed. |
| `videos.ndjson` | Generated output. Not committed. |

Web app (automatic path): `lib/ingest/*`, `app/api/ingest/video/route.ts`.

## Things worth knowing

- **The URL list comes from the dataset**, not from the seed files, so hand-authored lessons are
  covered too. Two lessons sharing a video produce one document.
- **Ids are deterministic** (`video.youtube-<videoId>`). Re-running is idempotent.
- **Nothing partial is ever written.** A fetch that yields no cues fails rather than creating an
  empty `chunks` array.
- **Only YouTube is ingested today.** Vimeo/Bunny URLs are skipped until adapters exist (§9).
- **YouTube's caption fetch is undocumented and brittle.** If it breaks, fix
  `lib/ingest/providers/youtube.ts` (and keep `providers/youtube.mjs` in sync for batch).
