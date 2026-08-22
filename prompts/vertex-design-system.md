# Implement the Vertex design system

## Goal

Encode the Vertex design system from `design/vertext-designsystem.png` into the existing Next.js app as Tailwind v4 tokens, fonts, and reusable UI primitives. Replace the create-next-app starter look. Do not build catalog, course, lesson, search, auth, or any other product feature in this pass.

## Skills read

- `AGENTS.md` — UI work must match the reference image exactly. Do not invent visuals. Do not overbuild. Tailwind follows package docs and existing patterns.
- No Sanity / Context / Clerk / PostHog skills apply. This is tokens and UI only.
- Next.js docs at `node_modules/next/dist/docs/` were not present in this install. Follow Next.js 16 App Router + `next/font/google` as already used in `app/layout.tsx`.

## Code inspected

- Repo is still a single Next.js 16.3.2 app at the root (React 19, Tailwind v4 via `@import "tailwindcss"` and `@tailwindcss/postcss`). The two-workspace split in `AGENTS.md` does not exist yet. Implement here. Do not create `web/` or `studio/` in this pass.
- `app/globals.css` still has Geist tokens, default `--background` / `--foreground`, and a `prefers-color-scheme: dark` flip.
- `app/layout.tsx` loads Geist Sans / Geist Mono and generic "Create Next App" metadata.
- `app/page.tsx` is the default starter page.
- No `components/` directory. No `tailwind.config`. No `clsx` / `lucide-react` yet.
- Path alias `@/*` already maps to the repo root.
- Other design files exist (`vertex-home.png`, `vertex-course.png`, `vertext-lesson.png`, `vertex-search.png`) and are out of scope.

## Decisions and assumptions

- **Source of truth:** `design/vertext-designsystem.png`. Sample any color not printed as a hex (badge fills, lesson blue, success green, pagination active, button hover) from that PNG. Do not invent a second palette.
- **Light only.** Remove the dark-mode media query. The sheet is a light product UI.
- **Tokens live in CSS.** Use Tailwind v4 `@theme inline` in `app/globals.css` so utilities like `bg-primary-500`, `text-neutral-900`, `font-display`, `shadow-md`, `rounded-md` come from the sheet.
- **Fonts:** `Playfair_Display` → `--font-display` (Display 1 / Display 2). `Inter` → `--font-sans` (everything else). Load both with `next/font/google` in `app/layout.tsx`. Drop Geist.
- **Spacing:** Tailwind’s default 4px scale already matches 4 / 8 / 12 / 16 / 24 / 32 / 40 / 48 / 64. Do not redefine the spacing scale.
- **Icons:** Add `lucide-react`. Use 24×24, `strokeWidth={2}`, rounded caps/joins. Do not build a custom icon set.
- **Class helper:** Add a small `lib/cn.ts` (`clsx` + `tailwind-merge`) so variants stay readable. Add those two packages.
- **Primitives, not pages.** Build reusable components that later screens will compose. Put a visual gallery at `/design-system` so we can check them against the PNG without claiming `/` as the real home page. Leave `/` as a short pointer to `/design-system` (not the Geist starter).
- **Static gallery data only.** Cards, nav, breadcrumbs, and pagination on the gallery use hardcoded demo copy from the sheet (`Next.js for Production`, `Lesson 5.1`, etc.). No Sanity, no fetch.
- **Native controls.** Buttons, inputs, and the select are native elements styled to spec. No Radix / shadcn. The search field shows a leading search icon and a `⌘ K` hint; do not wire a command palette.
- **Logo:** Orange downward chevron + the word “Vertex” in Inter. Recreate in SVG/JSX. Do not use the Next.js / Vercel marks.
- **Accessibility:** Visible focus rings using Primary 400 (`#FB923C`). `disabled` buttons and inputs are not focusable for activation. Status text is not color-only (icon + label). Gallery page has a real `h1`.
- **No design-system docs site, Storybook, or theme switcher.**

## Files expected

**Change**

- `app/globals.css` — Vertex `@theme` tokens, base body styles, remove dark mode and Geist.
- `app/layout.tsx` — Inter + Playfair Display, metadata title/description for Vertex.
- `app/page.tsx` — Short landing that links to `/design-system`. Remove starter content.

**Add**

- `app/design-system/page.tsx` — Gallery that walks sections 01–13 from the sheet (tokens + live components).
- `lib/cn.ts`
- `components/logo.tsx`
- `components/ui/button.tsx`
- `components/ui/input.tsx`
- `components/ui/select.tsx`
- `components/ui/badge.tsx`
- `components/ui/status.tsx`
- `components/ui/progress.tsx`
- `components/ui/card.tsx` — course, lesson (video + lesson), resource variants.
- `components/nav/header.tsx`
- `components/nav/breadcrumbs.tsx`
- `components/nav/pagination.tsx`

**Install**

- `lucide-react`, `clsx`, `tailwind-merge`

Do not add new env files, auth, or data clients.

## Requirements

### 01 Colors (`@theme`)

| Token | Hex |
| --- | --- |
| `primary-500` | `#F97316` |
| `primary-400` | `#FB923C` |
| `primary-300` | `#FDBA74` |
| `primary-200` | `#FED7AA` |
| `primary-100` | `#FFEEE5` |
| `neutral-900` | `#0F172A` |
| `neutral-700` | `#334155` |
| `neutral-500` | `#64748B` |
| `neutral-300` | `#CBD5E1` |
| `neutral-200` | `#E2E8F0` |
| `neutral-100` | `#F1F5F9` |
| `neutral-50` | `#FAFAFC` |
| `white` | `#FFFFFF` |

Add only extra semantic colors that the PNG actually uses (lesson badge blue, completed green, video badge red). Name them clearly (`lesson`, `success`, `video`) after sampling.

Default page background: Neutral 50. Default text: Neutral 900.

### 02–03 Typography

| Style | Font | Size / line | Weight | Class or element |
| --- | --- | --- | --- | --- |
| Display 1 | Playfair Display | 48 / 56 | Bold | `text-display-1` |
| Display 2 | Playfair Display | 36 / 44 | Bold | `text-display-2` |
| Heading 1 | Inter | 28 / 36 | Semibold | `text-heading-1` |
| Heading 2 | Inter | 22 / 30 | Semibold | `text-heading-2` |
| Heading 3 | Inter | 18 / 26 | Medium | `text-heading-3` |
| Body Large | Inter | 16 / 24 | Regular | `text-body-lg` |
| Body | Inter | 14 / 20 | Regular | `text-body` |
| Small | Inter | 12 / 16 | Regular | `text-small` |

Wire these as Tailwind theme font-size tokens (size + line-height). Use them on the gallery and in components.

### 04 Spacing

Use existing Tailwind spacing. Prefer the sheet steps (4, 8, 12, 16, 24, 32, 40, 48, 64) in new UI.

### 05 Radius and shadows

| Radius | Value | Token |
| --- | --- | --- |
| xs | 4px | `--radius-xs` |
| sm | 8px | `--radius-sm` |
| md | 12px | `--radius-md` |
| lg | 16px | `--radius-lg` |
| xl | 24px | `--radius-xl` |
| full | 9999px | `--radius-full` |

| Shadow | Value |
| --- | --- |
| sm | `0 1px 2px 0 rgba(15, 23, 42, 0.05)` |
| md | `0 4px 12px -2px rgba(15, 23, 42, 0.08)` |
| lg | `0 12px 24px -4px rgba(15, 23, 42, 0.10)` |
| xl | `0 20px 48px -8px rgba(15, 23, 42, 0.12)` |

Cards use white, 1px Neutral 200 border, and `shadow-md` unless the PNG clearly uses another shadow.

### 06 Icons

Lucide, 24×24, 2px stroke, rounded caps. Gallery shows a small outline row (bell, search, play, file, bookmark, chart, clock, user, chevron).

### 07 Buttons

`Button` variants: `primary` | `secondary` | `tertiary` | `text`.

- Height 44px, radius 12px (`rounded-md`).
- Horizontal padding 16px (default) or 12px (`size="md"`).
- Inter Medium, 14–16px.
- Primary: Primary 500 fill, white label. Hover: one step darker, sampled from the PNG.
- Secondary: transparent, Primary 500 border and label.
- Tertiary: Neutral 200/300 border, Neutral 900 label, optional leading icon.
- Text: no border, Primary 500 label, optional trailing icon.
- Disabled: faded / low contrast, `disabled` attribute, `aria-disabled` not used as a fake disabled.
- Support `asChild` is unnecessary. Accept native button props. Gallery shows default / hover / disabled for primary and secondary.

### 08 Inputs

- Shared field: height 44px, radius 12px, 1px Neutral 200 border, padding `0 16px`, white fill, Body Large text.
- Focus: border Primary 400 (`#FB923C`), visible ring, no default browser glow leftover.
- Search: leading search icon, placeholder “Search courses, lessons…”, trailing `⌘ K` in Small / Neutral 500. `aria-keyshortcuts="Meta+K"` is enough; no listener.
- Select: native `<select>` with chevron, same field chrome.

### 09 Badges

`video` | `lesson` | `popular`. Small, uppercase or as shown on the PNG, radius ~999 or 4px to match the sheet. Use sampled colors.

### 10 Status

`in-progress` | `completed` | `now-playing` | `locked`. Icon + label. Colors from the PNG (orange / green / orange / gray).

### 11 Progress

Track Neutral 200, fill Primary 500, height matching the thick bar on the sheet. Optional label `{n}% complete`. `role="progressbar"` with `aria-valuenow`, `aria-valuemin={0}`, `aria-valuemax={100}`.

### 12 Cards

Presentational components with typed props (title, description, meta). Gallery uses the sheet’s demo content.

- **Course:** logo/thumbnail tile, title, description, difficulty, duration, module count.
- **Lesson video:** VIDEO badge, title, description, lesson label, duration, “Watch from …” action.
- **Lesson:** LESSON badge, title, description, lesson label, duration, “View lesson” action.
- **Resource:** document icon, title, description, type + size, download action.

Actions on the gallery may be `<span>` or `#` links. Do not invent routes.

### 13 Navigation

- **Header:** logo left; “Courses” and “My Learning” as text links. Active link: Neutral 900. Inactive: Neutral 500. Optional right-side search icon + notification + avatar circle as on the sheet if present; keep it presentational.
- **Breadcrumbs:** `All Courses > Next.js for Production > Data Fetching & Caching` with `nav` + `ol` and `aria-current="page"` on the last item.
- **Pagination:** prev / 1 2 3 … 8 / next. Active page is a Primary 500 square with white numeral. Disabled arrows when at the ends.

### 14 Principles

Do not add a principles marketing section unless it is a one-line caption on the gallery. Principles are constraints, not UI to ship.

### Gallery page

A single readable page at `/design-system` with the same section order as the PNG (colors, type, spacing, radius/shadows, icons, buttons, inputs, badges, status, progress, cards, nav). Enough to compare side by side with the PNG. Responsive: stack columns on small screens; keep the desktop layout faithful.

## Security

- No secrets, tokens, or env vars.
- No user input persisted.
- Gallery-only links stay on-site (`/`, `/design-system`, `#`).
- Do not add `dangerouslySetInnerHTML`.

## Acceptance criteria

- [ ] Playfair Display and Inter load; Geist is gone.
- [ ] Theme tokens match the printed hex / type / radius / shadow values.
- [ ] No automatic dark theme.
- [ ] Button, input, select, badge, status, progress, four card types, header, breadcrumbs, and pagination exist as reusable components.
- [ ] `/design-system` renders those components with the sheet’s demo copy and states.
- [ ] `/` is no longer the Next.js starter.
- [ ] Focus, disabled, and status treatments are accessible as specified.
- [ ] `npx tsc --noEmit` and `npm run lint` pass.
- [ ] Visuals match the PNG; no restyling “improvements.”

## Checks

From the repo root:

1. `npx tsc --noEmit`
2. `npm run lint`
3. `npm run build` (layout, new route, and theme tokens changed)

## Manual test steps

1. Run `npm run dev` and open `http://localhost:3000/design-system`.
2. Place `design/vertext-designsystem.png` beside the page. Check color swatches, type samples, and component states against the sheet.
3. Confirm Display 1/2 are serif (Playfair) and all other type is Inter.
4. Tab through buttons and inputs. Focus ring is Primary 400. Disabled primary/secondary buttons do not activate.
5. Confirm search field shows the icon and `⌘ K`, and the select opens native options.
6. Resize to a narrow viewport. Gallery stacks; nothing overflows horizontally in a broken way.
7. Open `/` and confirm it is not the Geist starter and it links to the gallery.
8. Open the site in the browser’s dark color-scheme preference and confirm the UI stays light.
