# Deploying Eos Academy to Vercel

This guide covers deploying the Next.js web app to Vercel. The Sanity Studio is deployed separately to Sanity's hosting and is not part of the Vercel deployment.

---

## Prerequisites

Before deploying, make sure these are already done:

- [ ] Sanity Studio deployed — run `npm run studio:deploy` from the project root (or `npm run deploy` from `studio/`)
- [ ] Sanity schema deployed — run `npx sanity schema deploy` from `studio/`
- [ ] A Sanity **Viewer** token created at [sanity.io/manage](https://sanity.io/manage) → your project → API → Tokens
- [ ] Clerk application created at [dashboard.clerk.com](https://dashboard.clerk.com)
- [ ] Google Gemini API key from [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
- [ ] Sanity Context document (`vertex-search`) imported into your dataset

---

## Step 1 — Push your code to GitHub

Your code must be on GitHub (or GitLab / Bitbucket) for Vercel to import it.

```bash
git push origin feat/sanity-content-model
```

---

## Step 2 — Import the project on Vercel

1. Go to [vercel.com/new](https://vercel.com/new) and click **Add New → Project**
2. Click **Import** next to your `eoslms` repository
3. Vercel will detect Next.js automatically — leave **Framework Preset** as `Next.js`
4. Leave **Root Directory** as `.` (the repo root — the Next.js app lives there, not in a subdirectory)
5. Leave **Build Command** and **Output Directory** as default (`next build` / `.next`)
6. Do **not** deploy yet — configure environment variables first (Step 3)

---

## Step 3 — Add environment variables

In the Vercel project settings, go to **Settings → Environment Variables** and add each variable below. Set all of them for **Production**, **Preview**, and **Development** unless noted.

| Variable | Where to get it | Browser-safe? |
|---|---|---|
| `NEXT_PUBLIC_SANITY_PROJECT_ID` | [sanity.io/manage](https://sanity.io/manage) → your project → Project ID | Yes |
| `NEXT_PUBLIC_SANITY_DATASET` | Usually `production` | Yes |
| `NEXT_PUBLIC_SANITY_API_VERSION` | Use `2026-08-15` | Yes |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk dashboard → API Keys | Yes |
| `CLERK_SECRET_KEY` | Clerk dashboard → API Keys | **No — server only** |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | `/sign-in` | Yes |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | `/sign-up` | Yes |
| `NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL` | `/` | Yes |
| `NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL` | `/` | Yes |
| `SANITY_API_READ_TOKEN` | sanity.io/manage → API → Tokens (Viewer role) | **No — server only** |
| `SANITY_CONTEXT_MCP_URL` | `https://api.sanity.io/v2026-03-03/context/mcp/<projectId>/production/vertex-search` | **No — server only** |
| `GOOGLE_GENERATIVE_AI_API_KEY` | [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey) | **No — server only** |

> **Security rule:** Variables without `NEXT_PUBLIC_` prefix are server-only and never sent to the browser. Never add `NEXT_PUBLIC_` to `CLERK_SECRET_KEY`, `SANITY_API_READ_TOKEN`, `SANITY_CONTEXT_MCP_URL`, or `GOOGLE_GENERATIVE_AI_API_KEY`.

---

## Step 4 — Deploy

Click **Deploy** in the Vercel dashboard. The build runs `next build`. A successful build looks like:

```
✓ Compiled successfully
✓ Linting and checking validity of types
Route (app)                    Size
├ ○ /                          ...
├ ○ /courses                   ...
├ ○ /search                    ...
└ ...
```

Once the deploy finishes, Vercel gives you a URL like `https://eos-lms.vercel.app`. Copy it — you need it for the next two steps.

If the build fails, check the Vercel build logs. The most common causes are:

- A missing environment variable (TypeScript will error on undefined env access)
- A type error — run `npm run typecheck` locally first to catch these

---

## Step 5 — Add your Vercel domain to Clerk

Clerk blocks sign-in from unknown origins. Do this after deploy so you have the real URL.

1. In your Clerk dashboard, go to **Domains**
2. Add your Vercel production URL (e.g. `https://eos-lms.vercel.app`)
3. If you later add a custom domain, add that too

No redeploy needed — Clerk checks are at runtime.

---

## Step 6 — Add your Vercel domain to Sanity CORS

Sanity blocks API requests from unknown origins. Do this after deploy for the same reason.

1. Go to [sanity.io/manage](https://sanity.io/manage) → your project → **API → CORS Origins**
2. Click **Add CORS origin**
3. Add your Vercel URL: `https://eos-lms.vercel.app`
4. Check **Allow credentials**
5. Click **Save**

No redeploy needed — CORS is checked at request time.

---

## Step 7 — Verify the deployment

After deploy, open your Vercel URL and run through these checks:

- [ ] Home page loads with the Eos Academy logo
- [ ] `/courses` lists your courses
- [ ] Clicking a course opens the course detail page
- [ ] Search bar on the home page navigates to `/search?q=…`
- [ ] A search query (e.g. "react hooks") returns results within ~10 seconds
- [ ] Signing in via Clerk works

---

## Continuous deployment

Once connected, Vercel automatically redeploys on every push to your default branch. Pushes to other branches create **Preview deployments** with their own URL — useful for reviewing changes before merging.

---

## Re-deploying after content changes

| Action | What to do |
|---|---|
| Add/edit course or lesson content | Nothing — Sanity content is fetched at request time |
| Add a new video to a course | Run `npm run ingest:videos && npm run ingest:build && npm run ingest:import` from `studio/`, then the next search automatically picks up the new video |
| Change the search agent's system prompt | Push your code change — Vercel redeploys automatically |
| Change the Sanity Context document (agent instructions) | No deploy needed — the agent reads it on the next request |
| Add a new schema type | Run `npx sanity schema deploy` from `studio/`, then push any code changes |

---

## Custom domain (optional)

1. In Vercel, go to **Settings → Domains** and add your domain
2. Follow Vercel's DNS instructions (add a CNAME or A record at your registrar)
3. Remember to add the new domain to both Clerk (Step 4) and Sanity CORS (Step 5)
