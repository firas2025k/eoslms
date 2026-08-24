# Implement Sanity content model, standalone Studio, and web data layer

## Goal

Ship the Vertex content model (course, module, lesson, instructor, category) in a **standalone Studio**, plus a **server-only** Sanity read client and fetch/query layer in the Next.js app. No catalog UI wiring yet. No video documents, agent context, or progress in this pass.

## Skills read

- `AGENTS.md` — two workspaces (Studio + web), no embedded Studio; private dataset; token never in the browser; content shape in §8; pages stay read-only.
- `.agents/skills/sanity-best-practices/SKILL.md` + `references/project-structure.md`, `nextjs.md`, `schema.md`, `typegen.md` — standalone Studio, `defineType`/`defineField`/`defineArrayMember`, Live Content API / `defineLive`, TypeGen from Studio into the web app.
- `.agents/skills/content-modeling-best-practices/SKILL.md` + `references/reference-vs-embedding.md` — module embedded in course; lesson/instructor/category as documents with references.

## Code inspected

- Repo is a single Next.js app at root. Someone already ran an **embedded** Studio scaffold: `app/studio/[[...tool]]/page.tsx`, root `sanity.config.ts` / `sanity.cli.ts`, empty `sanity/schemaTypes`, CDN-only `sanity/lib/client.ts`, `defineLive` without `serverToken`.
- `package.json` already has `sanity`, `next-sanity`, `@sanity/image-url`, `@sanity/vision`.
- `.env.example` / `.env.local` have Sanity project id/dataset placeholders (and real Clerk keys in `.env.example` — strip those to empty placeholders).
- Home/design-system pages are presentational; nothing fetches Sanity yet.
- Next.js agent docs under `node_modules/next/dist/docs/` were not relied on for this CMS pass; follow existing App Router layout patterns.

## Decisions and assumptions

### Architecture

- **Standalone Studio in `studio/`.** Remove the embedded Studio route and root Studio config. Keep Next.js at **repo root** (treat root as the web workspace) rather than moving the whole app into `web/` — same boundary, less churn.
- Studio depends on `sanity` + `@sanity/vision` (+ icons). Web keeps `next-sanity` + `@sanity/image-url`. Drop Studio packages from the root app once the embedded route is gone (root no longer needs `sanity` / `@sanity/vision` / `styled-components` unless still required by `next-sanity` — verify and prune).
- Root scripts: keep `dev` / `build` / `lint` for Next; add convenience scripts that delegate to Studio (`studio:dev`, `typegen`). Studio has its own `package.json` with `dev` / `build` / `deploy` / `typegen`.

### Schema (AGENTS.md §8)

| Type | Kind | Fields (sensible choices) |
|------|------|---------------------------|
| `category` | document | `title`, `slug`, `description` |
| `instructor` | document | `name`, `slug`, `photo` (image + hotspot), `expertise` (string[]), `bio` (text) |
| `lesson` | document | `title`, `slug`, `videoUrl`, `poster` (image), `durationMinutes` (number), `freePreview` (boolean), `studentCount` (number), `notes` (Portable Text, basic blocks/marks), `keyPoints` (string[]), `proTip` (text, optional), `resources` (array of `resource` objects) |
| `module` | **object** (embedded on course) | `title`, `summary`, `lessons` (ordered refs → `lesson`) |
| `course` | document | `title`, `slug`, `summary`, `coverImage`, `level` (beginner \| intermediate \| advanced), `price` (number), `popular` (boolean), `studentCount`, `learningOutcomes` (array of `learningOutcome`), `instructor` (ref), `category` (ref), `modules` (array of `module`) |
| `learningOutcome` | object | `icon` (string — Lucide icon name for the UI), `title`, `description` |
| `resource` | object | `type` (string list: pdf \| link \| repo \| other), `title`, `description`, `url` |

- Slugs: `source` from title/name, required, unique where Sanity supports it via custom validation on documents.
- Icons from `@sanity/icons` on every document/object.
- Studio structure: list Courses, Lessons, Instructors, Categories (no modules list — they live on courses).
- **Out of scope:** `video`, `agentContext` / `sanity.agentContext`, learner `progress`. Add later with search/ingestion/auth features.
- Do not invent SEO/page-builder fields.

### Web data layer

- Move / replace root `sanity/` helpers into a clear web location: `lib/sanity/` (or `sanity/` at root without Studio config — prefer `lib/sanity/` to avoid confusion with the old embedded tree).
  - `env.ts` — projectId, dataset, apiVersion from `NEXT_PUBLIC_*`; assert present.
  - `client.ts` — `createClient` from `next-sanity`, `useCdn: true`, **no token** on the shared client object that could leak; token only via Live / fetch config.
  - `live.ts` — `defineLive` with `serverToken: process.env.SANITY_API_READ_TOKEN` (required for private datasets). Do **not** put the read token in a `NEXT_PUBLIC_` var. Prefer omitting `browserToken` unless draft/Visual Editing is added later; this pass is published read only.
  - `image.ts` — `@sanity/image-url` builder from the client.
  - `queries/*.ts` — `defineQuery` GROQ for:
    - all courses (catalog card fields + instructor/category light refs)
    - course by slug (full modules → lessons, instructor, category, outcomes)
    - lesson by slug (notes, resources, key points; reverse-lookup parent course/module labels)
    - instructor by slug; all instructors
    - all categories; category by slug
  - `fetch.ts` or thin wrappers that call `sanityFetch` with sensible tags (`course`, `lesson`, etc.).
- Mount `<SanityLive />` in `app/layout.tsx` so Live Content API works.
- TypeGen: Studio `sanity.cli.ts` extracts schema and generates `sanity.types.ts` at **repo root** (or `lib/sanity/sanity.types.ts`), scanning web query files. Commit generated types. Add root `npm run typegen` that runs in `studio/`.
- Queries project only fields pages need; never return whole transcript-like blobs (N/A until video exists). Include `_key` on arrays. For Portable Text notes, project the block content; for text search later, callers can use `pt::text(notes)` — not required in this pass’s queries beyond what lesson pages need.
- Lesson ↔ course: reverse reference in the lesson-by-slug query (`*[_type == "course" && references(^._id)][0]{...}` with module index derived in GROQ where practical).

### Env

- Keep `NEXT_PUBLIC_SANITY_PROJECT_ID`, `NEXT_PUBLIC_SANITY_DATASET`, `NEXT_PUBLIC_SANITY_API_VERSION` (optional, default a pinned date), `SANITY_API_READ_TOKEN`.
- Studio uses `SANITY_STUDIO_PROJECT_ID` / `SANITY_STUDIO_DATASET` **or** the same `NEXT_PUBLIC_*` via `studio/.env` — prefer Studio’s standard `SANITY_STUDIO_*` in `studio/.env.example`, documented in root `.env.example` as “also copy into studio/.env”.
- **Strip real Clerk secret/publishable values from `.env.example`** — leave empty placeholders. Do not touch `.env.local` secrets beyond documenting that `SANITY_API_READ_TOKEN` must be a Viewer token for private datasets.

### What we will not do

- No catalog/course/lesson page UI changes (home stays static).
- No schema deploy / Studio deploy / content import in this pass (document the commands in acceptance checks; run typecheck/lint/build locally).
- No write client, no progress API, no Context MCP, no embeddings.

## Files expected

**Add**

- `studio/package.json`, `studio/sanity.config.ts`, `studio/sanity.cli.ts`, `studio/tsconfig.json`, `studio/.env.example`
- `studio/schemaTypes/index.ts`
- `studio/schemaTypes/documents/{category,instructor,lesson,course}.ts`
- `studio/schemaTypes/objects/{module,learningOutcome,resource}.ts`
- `studio/structure.ts`
- `lib/sanity/{env,client,live,image,fetch}.ts`
- `lib/sanity/queries/{courses,lessons,instructors,categories,index}.ts`
- `sanity.types.ts` (generated)
- `studio/schema.json` (generated extract; commit if typegen needs it)

**Change**

- Root `package.json` — remove embedded Studio deps if unused; add scripts; keep `next-sanity` / `@sanity/image-url`.
- `app/layout.tsx` — render `<SanityLive />`.
- `.env.example` — Sanity vars + empty Clerk placeholders (no real keys).

**Delete**

- `app/studio/**`
- Root `sanity.config.ts`, `sanity.cli.ts`, `sanity/**` (replaced by `studio/` + `lib/sanity/`)

## Requirements

1. Authors can run `npm run dev` inside `studio/` and create courses (with embedded modules → lesson refs), lessons, instructors, and categories.
2. Web can `import { sanityFetch } from '@/lib/sanity/live'` (or re-export) and run typed queries with the private read token on the server only.
3. No Sanity token or write capability in client bundles.
4. Schema matches AGENTS.md relationships: module embedded; lesson has no parent course field; instructor and category referenced from course.
5. TypeGen produces types for the defined queries.

## Security

- `SANITY_API_READ_TOKEN` server-only; never `NEXT_PUBLIC_`.
- Dataset treated as private; CDN + token via Live API / server fetch.
- `.env.example` must not contain real secrets.
- Browser never writes content.

## Acceptance criteria

- [ ] Embedded `/studio` route and root Studio config are gone.
- [ ] `studio/` boots with Vision + structure listing the four document types.
- [ ] All five conceptual types exist (course, module object, lesson, instructor, category) with the fields above.
- [ ] `lib/sanity` client + `sanityFetch` + image helper + GROQ queries exist and typecheck.
- [ ] `<SanityLive />` in root layout.
- [ ] `npm run lint` and `npx tsc --noEmit` (or project equivalent) pass in the web app; Studio installs and typechecks.
- [ ] `.env.example` documents required vars without real keys.

## Checks to run

1. `cd studio && npm install && npm run typegen` (or root `npm run typegen`).
2. From repo root: lint + TypeScript check; `npm run build` (layout/live client changed).
3. Manually: `cd studio && npm run dev` → open Studio → create one category, instructor, lesson, course with a module pointing at the lesson.
4. Optional smoke: temporary server component fetch of course list (remove before finish **or** leave unused query helpers only — prefer no throwaway pages).

## Manual test steps

1. Copy Sanity project id/dataset into root `.env.local` and `studio/.env`; create a Viewer API token and set `SANITY_API_READ_TOKEN`.
2. Start Studio (`cd studio && npm run dev`), confirm schema and desk structure.
3. Create sample documents; publish.
4. Start Next (`npm run dev`); confirm home still renders and build does not expose the token (no `NEXT_PUBLIC` token).
5. From a Node/server context or a quick temporary RSC log, `sanityFetch` a course query and see real data (then remove any temporary log).
