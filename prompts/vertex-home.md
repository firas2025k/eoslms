# Implement the Vertex home page

## Goal

Replace the temporary `/` pointer with the home page from `design/vertex-home.png`. Match layout, spacing, typography, color, and states exactly. Presentational only: static demo courses, no Sanity, no search API, no auth wiring.

## Skills read

- `AGENTS.md` — UI matches the reference image exactly; responsive down to mobile while desktop stays faithful; reuse existing Tailwind/components; My Learning and the notifications bell are presentational; do not overbuild.
- `prompts/vertex-design-system.md` — tokens and primitives already shipped; compose them rather than inventing a second visual language.
- No Sanity / Clerk / PostHog / Context skills apply. This pass is UI only.
- Next.js docs under `node_modules/next/dist/docs/` were not present in this install. Follow existing App Router patterns in `app/layout.tsx` and `app/page.tsx`.

## Code inspected

- Design system is live: `app/globals.css` tokens, Inter + Playfair in `app/layout.tsx`, primitives under `components/`.
- `app/page.tsx` is a short pointer to `/design-system` — replace it with the real home.
- `components/nav/header.tsx` — logo + Courses / My Learning + search + bell + avatar. Home PNG has **no header search icon** (bell + avatar only).
- `components/ui/button.tsx`, `SearchInput`, `CourseCard`, `Badge`, `Logo` exist and should be reused / lightly adjusted.
- `CourseCard` today: Inter `text-heading-1` title, letter thumbnail tile, `Layers` for modules. Home PNG: **Playfair** titles, brand marks (Next.js N, Docker whale, TypeScript TS), **document** icon for modules.
- `Logo` today: single filled chevron. Home PNG mark is a **three-segment** orange triangle cluster — update the mark to match.
- No `/courses` or `/my-learning` routes yet. Links may point at those paths (404 until built) or `#`; prefer the intended paths so later routes light up.
- Other design files (`vertex-course.png`, `vertext-lesson.png`, `vertex-search.png`) are out of scope.

## Decisions and assumptions

- **Source of truth:** `design/vertex-home.png`. Do not restyle or “improve.” Sample any ambiguous spacing/radius/shadow from the PNG against existing tokens (`neutral-50` page bg, `primary-500`, `shadow-md`, `rounded-md`, etc.).
- **Compose, don’t fork.** Build the page from `Header`, `Button`, `SearchInput`, `CourseCard`, `Logo`. Adjust those components only where the home PNG disagrees with the current gallery defaults (header search visibility, logo mark, course card title font / icon / thumbnail).
- **Static catalog.** Hardcode the three courses shown on the PNG (Next.js for Production, Docker & Containers, TypeScript Fundamentals) with the copy, levels, durations, and module counts visible there. No fetch.
- **Search is presentational.** Hero `SearchInput` uses placeholder `Ask anything about your learning...`, shows `⌘ K`, no submit handler and no command palette. Do not call an API.
- **CTAs are links.** “Explore Courses” and “View all courses →” go to `/courses`. Header nav already uses `/courses` and `/my-learning`.
- **Header on home:** no active nav highlight required for `/` (neither Courses nor My Learning is the home route). Add a prop such as `showSearch?: boolean` (default `true` so `/design-system` stays unchanged) and pass `showSearch={false}` on home. Optionally allow `activeHref` to be omitted so neither link is active.
- **Hero badge:** small rounded pill, Primary 100 fill / Primary 500 (or 400) label, uppercase tracking, text `INTELLIGENT LEARNING`. Can be a local span or a thin `Badge`-like style; do not invent a new badge variant unless it stays reusable and matches the PNG.
- **Hero type:** headline = `font-display text-display-1` (or larger only if the PNG clearly exceeds Display 1 — prefer the token). Subcopy = Body Large / Neutral 500, centered, max-width constrained.
- **Course cards:** accept an optional `thumbnail` React node (or `thumbnailSrc`) so home can pass brand SVGs; keep letter fallback for the gallery. Title uses `font-display` + size matching the PNG (likely Display 2 scale scaled down or Heading sized with `font-display`). Modules meta uses `FileText`. Card remains a presentational article; wrap in `Link` to `/courses` only if the PNG treats the whole card as clickable — otherwise leave non-linked like the gallery.
- **Bottom strip:** thin rule interrupted by a centered star (Lucide `Star`, outline, primary) + “New courses and lessons added every week.” in Small / Neutral 500.
- **Footer bars:** decorative only — CSS or inline SVG vertical bars with orange→transparent gradient, blurred/soft as on the PNG. No interaction, `aria-hidden`.
- **Background grid:** subtle diagonal/grid texture in the side margins if clearly visible on the PNG; keep it very light (CSS repeating gradient or a tiny SVG pattern). If it fights readability, prefer fidelity to the cream field over a loud grid.
- **Responsive:** desktop matches the PNG (centered hero, 3-column course grid). Below ~md: stack course cards to one column, keep header usable (existing `sm:flex` nav), tighten horizontal padding, keep hero centered and search full-width. Do not invent a mobile-only redesign.
- **Leave `/design-system` working.** Any shared-component tweaks must not break the gallery.
- **No** Sanity, Clerk, PostHog, search route, progress, or new env vars.

## Files expected

**Change**

- `app/page.tsx` — full home page composition.
- `components/nav/header.tsx` — optional hide search; optional no active link.
- `components/logo.tsx` — three-segment mark matching the PNG.
- `components/ui/card.tsx` — `CourseCard` title font-display; `FileText` for modules; optional custom thumbnail node.

**Add (only if it keeps `page.tsx` readable)**

- `components/home/hero-bars.tsx` or similar — decorative footer bars (optional; inline in page is fine if short).
- `components/home/course-marks.tsx` — small Next.js / Docker / TypeScript SVG marks for the three cards (optional).

Do not add Storybook, a second design-system page, or new routes beyond composing `/`.

## Requirements

1. **Header** — Logo, Courses, My Learning, bell, avatar; no search icon on home.
2. **Hero** — badge, Display headline “Search your learning in plain English.”, supporting sentence from the PNG, primary “Explore Courses →” button, large search field.
3. **All Courses** — section title (Playfair) left, “View all courses →” text link right, three-column card grid with the PNG’s three courses.
4. **Footer cue** — star + weekly copy; decorative orange bars below.
5. **A11y** — one page `h1` (the hero headline); section headings for All Courses; decorative bars/`kbd`/`aria-hidden` icons as appropriate; focus rings stay Primary 400 via existing primitives.
6. **Metadata** — keep or lightly tighten root metadata in `layout.tsx` only if the home copy warrants a clearer description; do not rename the product.

## Security

- No secrets or tokens.
- No user input persisted; search field is uncontrolled/presentational.
- Links stay on-site (`/`, `/courses`, `/my-learning`, `/design-system` if referenced).
- No `dangerouslySetInnerHTML`.

## Acceptance criteria

- [ ] `/` matches `design/vertex-home.png` on desktop (hero, courses, footer cue, bars).
- [ ] Reuses design-system tokens and primitives; no parallel palette.
- [ ] Header on home has no search icon; gallery header still can show search.
- [ ] Logo mark matches the three-segment PNG treatment.
- [ ] Three static courses render with correct meta and brand marks.
- [ ] Search and notifications remain presentational.
- [ ] Responsive stack works; no horizontal overflow.
- [ ] `/design-system` still renders correctly after shared tweaks.
- [ ] `npx tsc --noEmit` and `npm run lint` pass; `npm run build` because `/` and shared components changed.

## Checks

From the repo root:

1. `npx tsc --noEmit`
2. `npm run lint`
3. `npm run build`

## Manual test steps

1. Run `npm run dev` and open `http://localhost:3000/`.
2. Place `design/vertex-home.png` beside the browser. Compare hero copy, badge, CTA, search, course grid, footer strip, and bars.
3. Confirm Playfair on the hero title and course titles; Inter elsewhere.
4. Confirm header has bell + avatar only (no search icon).
5. Tab through CTA, search, and nav links; focus ring is Primary 400.
6. Resize to a narrow viewport: courses stack; hero stays centered; no broken overflow.
7. Open `/design-system` and confirm the gallery still looks correct (header with search, course card demo).
