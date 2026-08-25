# Intelligent Search — Test Checklist

Run through these steps after `npm run dev` is running and your Gemini key is set in `.env.local`.

---

## Prerequisites

- [ ] `GOOGLE_GENERATIVE_AI_API_KEY` is set in `.env.local`
- [ ] `SANITY_CONTEXT_MCP_URL` is set to `https://api.sanity.io/v2026-03-03/context/mcp/en553rqm/production/vertex-search`
- [ ] Studio is deployed at `https://eos.sanity.studio/`
- [ ] At least 5 video docs ingested (`cd studio && npm run ingest:videos && npm run ingest:build && npm run ingest:import`)
- [ ] `npm run dev` is running at `http://localhost:3000`

---

## 1. Home page search

1. Go to `http://localhost:3000`
2. Click the hero search box
3. Type `data fetching`
4. Press **Enter**

**Expected:** Browser navigates to `/search?q=data+fetching`

---

## 2. Results page loads

On `/search?q=data+fetching`:

- [ ] Orange **"SEARCH RESULTS"** eyebrow is visible
- [ ] Heading reads **Results for "data fetching"**
- [ ] Loading skeletons appear while the API is working (~5–15 sec)
- [ ] "Found N results across M courses" appears after loading
- [ ] Results count + **Most Relevant** sort dropdown are visible

---

## 3. VIDEO cards

Look for at least one card with an orange **VIDEO** badge:

- [ ] Dark thumbnail with a play icon
- [ ] Duration chip (e.g. `12:45`) in the thumbnail corner
- [ ] Course name + VIDEO badge
- [ ] Lesson title + short description
- [ ] `Lesson X.Y · Module name` metadata row
- [ ] **"Watch from mm:ss"** link in the bottom-right

Click **"Watch from mm:ss"**:

- [ ] Navigates to `/courses/[slug]/lessons/[lessonSlug]?t=NNN`
- [ ] Video player starts near that timestamp (may be a few seconds off — that's normal)

---

## 4. LESSON cards

Look for at least one card with a purple **LESSON** badge:

- [ ] Left panel shows a document icon + 1–3 key points
- [ ] Course name + LESSON badge
- [ ] Lesson title + short description
- [ ] `Module N · Module name` metadata row
- [ ] **"View lesson"** link in the bottom-right

Click **"View lesson"**:

- [ ] Navigates to `/courses/[slug]/lessons/[lessonSlug]` (no `?t=`)
- [ ] Lesson page loads normally

---

## 5. Sort control

On the results page:

- [ ] Change dropdown from **Most Relevant** to **Course Title**
- [ ] Cards re-order alphabetically by course name (no page reload)
- [ ] Switch back to Most Relevant — original order restored

---

## 6. Empty state

1. In the search box on the results page, type `xyznonexistentquery123`
2. Press **Enter**

- [ ] Loading skeletons appear
- [ ] **"No results found"** empty state appears
- [ ] "Browse all courses" button is visible and links to `/courses`

---

## 7. Header search icon

1. Go to `/courses`
2. Click the search icon (magnifying glass, top right of the header)

- [ ] Navigates to `/search` with no query
- [ ] Idle state shows "Type a question or topic above…"

---

## 8. API smoke test (terminal)

Run this while `npm run dev` is active:

```bash
curl -s -X POST http://localhost:3000/api/search \
  -H "Content-Type: application/json" \
  -d '{"query":"react hooks"}' | python3 -m json.tool | head -40
```

- [ ] Returns JSON (not an error page)
- [ ] Top-level keys: `query`, `resultCount`, `courseCount`, `results`
- [ ] `results` is an array; each item has `kind: "video"` or `kind: "lesson"`

---

## 9. Error handling

1. Stop the dev server
2. Remove `GOOGLE_GENERATIVE_AI_API_KEY` from `.env.local` temporarily
3. Restart `npm run dev`
4. Search for anything

- [ ] Error message appears on the results page ("Search failed. Please try again." or the 503 message)
- [ ] App does not crash or show a blank screen

Restore the key when done.

---

## 10. Mobile layout

Open DevTools → toggle device toolbar → iPhone 14 size (390px):

- [ ] Search input fills the full width
- [ ] Cards stack vertically
- [ ] Thumbnail / key-points panel is hidden (small screen — only the text content shows)
- [ ] Footer CTA is readable and button is tappable

---

## Known limitations at this stage

- Only 5 of 120 videos are ingested — VIDEO cards only appear for those 5 YouTube videos. Run the full ingest (`npm run ingest:videos && npm run ingest:build && npm run ingest:import` from `studio/`) to cover all courses.
- Vimeo and Bunny videos produce LESSON results only (no timestamps) until their ingest adapters are built.
- Search response time is 5–15 seconds depending on how many GROQ queries Gemini runs.
