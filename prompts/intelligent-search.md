# Implement Vertex intelligent search

## Goal

Wire **Sanity Context MCP → server-side search API → `/search` results page** so a plain-language query returns ranked **VIDEO** and **LESSON** cards across all courses and lessons, matching `design/vertex-search.png`. Deep-link video moments to the lesson page with `?t=` start seconds.

## Skills read

- `AGENTS.md` §§5–12 — search is Context MCP + LLM; results page not a chatbox; grounded cards only; video docs are internal; chapters first then transcript; private token server-only; `@sanity/context` plugin may lag Studio major — prefer import when incompatible.
- `.agents/skills/create-agent-with-sanity-context/SKILL.md` + `references/nextjs-agent.md`, `references/studio-setup.md` — MCP HTTP client, `/initial-context` cache, Bearer read token, slug URL.
- `.agents/skills/dial-your-context/SKILL.md` — Context `instructions` as pure deltas; `groqFilter` scoping content types.
- `.agents/skills/shape-your-agent/SKILL.md` — system prompt for behavior/guardrails only (not schema duplication).
- `.agents/skills/sanity-best-practices/SKILL.md` — GROQ, TypeGen, Next.js fetch boundaries.
- Next.js docs under `node_modules/next/dist/docs/` — App Router route handlers, `searchParams` as Promises, server vs client.

## Code / environment inspected

- Design: `design/vertex-search.png` — SEARCH RESULTS eyebrow, “Results for …”, count across courses, search input, “Most Relevant” sort, VIDEO vs LESSON cards, footer catalog CTA.
- Home: `app/page.tsx` — hero `SearchInput` is presentational (no submit).
- Lesson page already accepts `?t=` via `lib/video-embed.ts`.
- UI primitives: `SearchInput`, `Badge` (`video` / `lesson`), `Select`, `Header`, design-system `LessonCard` (gallery mock — **not** the search layout; search needs dedicated result cards matching the PNG).
- Schema: `course`, `lesson`, `video` (chapters + chunks), instructor, category exist. Studio on **Sanity 5.31**; `@sanity/context` peers **sanity ^6** → **do not install the Studio plugin**. Create/edit `sanity.agentContext` via NDJSON import.
- Dataset (`en553rqm` / `production`): **10 courses, 120 lessons, 0 videos, 0 agentContext**. Schema deploy and Studio application deploy are **missing** (Context MCP will not serve until Studio is deployed).
- Ingest + context scripts are present under `studio/scripts/`:
  - `context/vertex-search.ndjson` — slug `vertex-search`, filter on course/lesson/instructor/category/video (no drafts), instructions cover reverse course refs, positional module/lesson numbers, `pt::text(notes)`, chapter-then-chunk matching, no whole chunks arrays.
  - `ingest/` — YouTube-only offline pipeline (`ingest:videos` → `ingest:build` → `ingest:import`). Vimeo/Bunny skipped until API credentials exist.
- Env: `.env.example` has `SANITY_CONTEXT_MCP_URL` and `OPENAI_API_KEY` (empty). No AI SDK packages installed yet in the web app.

## Decisions and assumptions

### LLM provider (pending user confirmation)

- Prefer **Google Gemini** via `@ai-sdk/google` if the user does not want OpenAI in this phase (Vercel AI SDK + tool calling works with either provider).
- Env: `GOOGLE_GENERATIVE_AI_API_KEY` (or `GEMINI_API_KEY` per SDK docs) instead of / in addition to documenting `OPENAI_API_KEY`.
- If the user chooses OpenAI instead, use `@ai-sdk/openai` and keep `OPENAI_API_KEY` as in AGENTS.md / `.env.example`.
- Model: a current Gemini Flash / Pro with reliable tool calling (pin a concrete model id at implement time from docs). Same pattern if OpenAI.

### Architecture (not a chat UI)

1. Learner submits a query → navigates to **`/search?q=…`** (optional `sort=relevant`).
2. Client (or server) calls **`POST /api/search`** with `{ query, sort }`.
3. Route handler (server-only):
   - Connects to Sanity Context MCP (`@ai-sdk/mcp` HTTP transport + `SANITY_API_READ_TOKEN`).
   - Fetches and caches `/initial-context` (TTL ~5m); excludes `initial_context` from tools passed to the model.
   - Runs the LLM with MCP tools (`groq_query`, `schema_explorer`) and a **strict Zod structured output** for results (video + lesson cards + counts). No chat transcript UI.
4. Results page renders cards from that JSON. Optional short markdown “reply” only if useful for empty/error copy; primary UX is cards per the PNG.

### Sanity Context setup

- Deploy schema (`npx sanity schema deploy` from `studio/`) and **deploy the Studio application** (`npm run studio:deploy`) — required for Context MCP.
- Import agent context via provided `context:import` / NDJSON (slug e.g. `vertex-search`).
- `SANITY_CONTEXT_MCP_URL=https://api.sanity.io/v2026-03-03/context/mcp/en553rqm/production/<slug>`.
- `groqFilter` scopes to content types the agent needs, e.g. `_type in ["course","lesson","video","instructor","category"] && !(_id in path("drafts.**"))` (tune with user scripts).
- Instructions (deltas only): lesson↔course via reverse ref; modules embedded on course; video joined by `url == lesson.videoUrl`; match chapters before chunks; never return whole `chunks` arrays; never invent timestamps; `pt::text(notes)` for lesson text match; token-based wildcards OR’d; video docs never appear as results — always the lesson that uses that URL.

### Ingestion prerequisite

- Run provided ingest pipeline so `video` documents exist (chapters + chunks). Without them, **lesson** results still work; **VIDEO** moment results will be empty or weak.
- Ingest stays offline; never in the request path.

### Search API contract (Zod)

Rough shape (finalize in code):

```ts
{
  query: string
  resultCount: number
  courseCount: number
  results: Array<
    | {
        kind: "video"
        courseTitle: string
        courseSlug: string
        courseIconUrl?: string | null
        lessonTitle: string
        lessonSlug: string
        moduleTitle: string
        moduleIndex: number   // 1-based display
        lessonIndex: number   // 1-based within module
        description: string
        thumbnailUrl?: string | null
        clipDurationLabel?: string  // e.g. "12:45" display
        startSeconds: number
      }
    | {
        kind: "lesson"
        courseTitle: string
        courseSlug: string
        courseIconUrl?: string | null
        lessonTitle: string
        lessonSlug: string
        moduleTitle: string
        moduleIndex: number
        description: string
        keyPoints: string[]  // up to ~3 for the left panel
      }
  >
}
```

- Rank most-specific first (title hit > chapter > transcript / notes).
- Return **all** relevant matches the agent can ground (no artificial cap of a handful). Sort control defaults to most relevant; secondary sorts (e.g. course title) may be client-side on the returned set if cheap — do not invent relevance scores the model did not provide.
- Grounding rule: every card field must come from GROQ data. If nothing matches → empty state + browse catalog CTA.

### Results UI (`/search`)

- Match `design/vertex-search.png` exactly on desktop; stack sensibly on mobile.
- Header: `showSearch={false}` (search lives in-page), Courses active when appropriate or no forced active — prefer matching PNG (Courses active).
- Wire home (and any other) `SearchInput` to navigate to `/search?q=…` on submit / Enter.
- Build **search result cards** (extend or replace gallery `LessonCard` usage) with:
  - VIDEO: thumbnail + play affordance, duration chip, course row + VIDEO badge, title, snippet, “Lesson X.Y • Module”, “Watch from mm:ss” → `/courses/[slug]/lessons/[lessonSlug]?t=seconds`.
  - LESSON: key-points panel, LESSON badge, title, snippet, “Module N”, “View lesson” → lesson URL without `t`.
- Loading and empty states; footer “Browse all courses” banner.
- No PostHog in this pass (unless already trivial — default **out of scope**).
- No Conversation Insights / `@sanity/context` Studio plugin.

### Security

- `SANITY_API_READ_TOKEN`, MCP URL, LLM key: server-only.
- Browser never calls MCP or LLM.
- Never return raw `chunks` arrays to the client or dump full transcripts into the model context.
- Validate/limit query length; return 400 on empty query.
- CORS not needed for same-origin fetch.

## Files expected to touch

- `prompts/intelligent-search.md` (this file)
- `app/api/search/route.ts` — search handler
- `lib/search/` — system prompt, Zod schema, MCP helpers, initial-context cache
- `app/search/page.tsx` + search UI components under `components/search/`
- `components/ui/input.tsx` / home / header — wire search submit → `/search`
- `.env.example` — MCP URL + Gemini (or OpenAI) key docs
- `package.json` — `ai`, `@ai-sdk/mcp`, `@ai-sdk/google` (or openai), `zod`, `react-markdown` only if a reply string is shown
- Use existing `studio/scripts/context` + `ingest` as documented in their READMEs (import context; run ingest then import videos)
- Studio: schema deploy + Studio deploy; optionally list `video` in structure (read-only)

## Requirements

1. Working `POST /api/search` using Context MCP + LLM tools + structured results.
2. `/search` page matching the design with VIDEO and LESSON cards over real Sanity data.
3. Home search navigates to results with the query.
4. Video cards deep-link with `?t=`.
5. Agent context document imported; MCP URL configured.
6. Schema + Studio deployed so MCP serves the dataset.
7. Ingest run (or clearly blocked with “Needs your attention” if captions/API keys missing) so video moments can resolve.
8. Typecheck + lint (+ build because routes/server code change).

## Out of scope

- Chatbox / streaming chat UI
- `@sanity/context` Studio plugin / Conversation Insights
- PostHog search events (later)
- Progress / auth gating of search (browsing stays public)
- Custom video player
- Upgrading Studio to Sanity 6 solely for the plugin

## Acceptance criteria

- [ ] Query from home lands on `/search?q=…` with real cards or a correct empty state.
- [ ] Desktop layout matches `vertex-search.png` (eyebrow, heading, count, input, sort, card types, footer).
- [ ] VIDEO and LESSON badges and actions behave as designed.
- [ ] “Watch from …” opens the lesson embed at that second.
- [ ] No Sanity/LLM secrets in client bundles.
- [ ] MCP `/initial-context` works against the deployed Studio.
- [ ] `npm run typecheck` and `npm run lint` pass; `npm run build` succeeds.

## Checks to run

- Web: `npm run typecheck`, `npm run lint`, `npm run build`, `npm run dev`
- Studio: `schema deploy`, `studio:deploy`, context import, ingest (per provided scripts)
- Curl MCP tools/list and `/api/search` with a sample query (e.g. “data fetching”)

## Manual test steps

1. Confirm Studio is deployed and `SANITY_CONTEXT_MCP_URL` is set with the context slug.
2. Confirm at least some `video` docs exist after ingest (or note lesson-only behavior).
3. Set the Gemini (or OpenAI) API key in `.env.local`.
4. `npm run dev` → home → type “data fetching” → Enter.
5. Results page shows count + mixed VIDEO/LESSON cards grounded in seed courses.
6. Click “Watch from …” → lesson plays near that timestamp.
7. Click “View lesson” → lesson page without forced start.
8. Nonsense query → empty state + “Browse all courses”.
9. Resize to mobile → stacked cards, usable search field.
