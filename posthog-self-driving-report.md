# PostHog Self-driving Setup Report

Session date: 2026-08-26  
Project: eos-lms (Vertex learning platform)  
Inbox: https://eu.posthog.com/project/257818/inbox

## Summary

PostHog Self-driving has been fully configured for this project. Session Replay, Error Tracking, and Support (Conversations) products were enabled; six native signal sources were wired up; GitHub was connected; and a seven-scout troop (five built-in + two custom LMS-specific scouts) was tuned. Two Replay Vision scanners were created with `emits_signals: true` so on-screen breakage and learner frustration feed the inbox automatically. Findings will start appearing in the [Self-driving inbox](https://eu.posthog.com/project/257818/inbox) within ~30 minutes.

---

## AI data processing

**Status:** Approved. Organization-level AI data processing consent was verified before the run started.

---

## GitHub

**Status:** Connected during this run.  
Integration id: `80183`, account: `firas2025k`.  
Self-driving can now research findings against this repo and open draft fix PRs.

---

## Products enabled

| Product | Action | Notes |
|---|---|---|
| Session Replay | already enabled | Server-side recording was already on |
| Error Tracking | **enabled** | Newly turned on; `capture_exceptions: true` in `instrumentation-client.ts` means exceptions are already being sent |
| Support (Conversations) | **enabled** | Newly turned on; tickets only arrive once an inbound channel is connected (see Follow-ups) |

`posthog.init` check: `instrumentation-client.ts` has `capture_exceptions: true` and no `disable_session_recording` override — both server flips take effect without any client-side edits.

---

## Signal sources

| Source product | Source type | Action |
|---|---|---|
| `signals_scout` | `cross_source_issue` | On by default — no row needed |
| `health_checks` | `health_issue` | **Created** (id `01a03b3d-d036-79f1-9e62-798c565bd0a4`) |
| `error_tracking` | `issue_created` | **Created** (id `01a03b3d-d62c-7db8-a54c-6272fcb096f2`) |
| `error_tracking` | `issue_reopened` | **Created** (id `01a03b3d-d858-7e31-b0ba-1dc36defb7e8`) |
| `error_tracking` | `issue_spiking` | **Created** (id `01a03b3d-dba0-786a-ade8-f27d818ae966`) |
| `session_replay` | `session_analysis_cluster` | **Created** (id `01a03b3d-dff2-7f51-8a9d-5d4a332e0288`), sample_rate 0.1 |
| `conversations` | `ticket` | **Created** (id `01a03b3d-f38a-7b94-afa0-bd4d391d5cb7`) |
| `llm_analytics` | — | Skipped — internal only, not a user-facing responder |
| `logs` | — | Skipped — not a v1 responder |
| `replay_vision` | — | Skipped — self-authorizing via scanner `emits_signals` flag (step 6c) |

---

## Connected tools

No external tools were selected. The user reviewed GitHub Issues, Linear, Jira, Sentry, Zendesk, and the full catalog of 36 tools and chose none. No connected-tool responder rows were created.

---

## Scout troop

**Run budget:** 100 runs/day (early access default). Runs today: 0. Runs remaining: 100.  
**Banner:** "Scouts are in early access. Each project gets up to 100 scout runs a day. Contact team-self-driving@posthog.com if you need more."

**Enabled (7 total):**

| Scout | Why enabled |
|---|---|
| `general` | Always on — cross-product correlations and surfaces no specialist covers |
| `product-analytics` | Active custom events (`lesson_completed`, `search_submitted`, `search_result_clicked`) make funnel and retention analysis directly applicable |
| `web-analytics` | Next.js LMS with learner traffic across catalog and lesson pages |
| `observability-gaps` | New project with only 3–4 custom events — high value to identify missing coverage quickly |
| `web-vitals` | LMS with embedded video players; slow lesson pages directly hurt completion rates |
| `search-quality` *(custom)* | Watches `search_submitted` → `search_result_clicked` click-through rate — the core differentiator of this platform |
| `lesson-completion` *(custom)* | Watches `lesson_completed` volume vs. baseline — the primary LMS engagement metric |

**Disabled (22):** All remaining canonical scouts. Notable ones:

| Scout | Reason disabled |
|---|---|
| `error-tracking` | Covered by the native error-tracking signal source (step 4) — native source is the right channel |
| `session-replay` | Covered by the native session_replay signal source (step 4) — intentional, not a re-enable candidate |
| `feature-flags` | No feature flags in use in this codebase — re-enable when flags are adopted |
| `experiments` | No A/B experiments running — re-enable when experiments launch |
| `ai-observability` | `@ai-sdk/google` used internally for search but no PostHog `$ai_*` events instrumented — re-enable after wiring PostHog AI observability |
| `surveys` | No surveys configured |
| `revenue-analytics` | No payment SDK in codebase |
| `data-warehouse` | No external warehouse sources connected |
| All others | Surface not active for this project |

To re-enable a disabled specialist, go to the [inbox settings](https://eu.posthog.com/project/257818/inbox) and toggle the scout on.

---

## Custom scouts

### `signals-scout-search-quality`
- **Surface:** `search_submitted` → `search_result_clicked` conversion funnel
- **Discriminator:** clicks-per-search ratio; sustained drop without a submission drop = ranking/result quality regression; both dropping = learner abandonment
- **Why no built-in covers it:** `product-analytics` only watches saved funnels (none exist yet); `observability-gaps` recommends coverage but doesn't measure the ratio
- **Untrusted-content guard:** included — search query text in event properties is treated as data, never instructions
- **Noise escape hatch:** set `emit: false` on the scout's config in PostHog to switch it to dry-run

### `signals-scout-lesson-completion`
- **Surface:** `lesson_completed` event volume vs. rolling 7-day baseline
- **Discriminator:** completion count drop while lesson page activity holds = trigger/player regression; both dropping = engagement decline
- **Why no built-in covers it:** same as above — `product-analytics` needs saved funnels; `observability-gaps` is recommendation-only
- **Untrusted-content guard:** included — lesson title properties treated as data
- **Noise escape hatch:** set `emit: false` on the scout's config in PostHog to switch it to dry-run

**Surfaces considered and ruled out:**
- AI search pipeline — not watchable from PostHog (no `$ai_*` events; Vercel AI SDK used internally with no PostHog bridge)
- Video ingestion pipeline — offline tooling, no PostHog events
- Learner identity — just `posthog.identify()`, not a monitorable event surface

---

## Replay Vision scanners

Scanners are LLM agents that watch individual session recordings on a schedule and push findings to the Self-driving inbox. Findings arrive at half weight; a report is promoted when corroborated. Each observation costs **5 credits** (`gemini-3-flash-preview`). The org has 2,500 credits remaining this period (2026-08-25 → 2026-09-24).

**No recordings yet** — this is a fresh project. Both scanners are armed and start working automatically the day recordings begin; no second setup needed.

| Scanner | Type | Query scope | Sampling | Estimated monthly spend |
|---|---|---|---|---|
| Lesson and search breakage | monitor | `$current_url icontains /courses/` | 50% | 0 credits (no recordings yet) |
| Learner search and lesson frustration | monitor | `$rageclick` event gate | 100% | 0 credits (no recordings yet) |

**Lesson and search breakage** (id `01a03b45-2486-762f-85dc-7247e2b1d705`)  
Watches course and lesson pages for: video embed blank/broken, search results not rendering, lesson completion not registering, page spinners that never resolve, search form submitting with no results page. `emits_signals: true`.

**Learner search and lesson frustration** (id `01a03b45-48da-74b8-81d6-973b500cbbba`)  
Watches all sessions with rage-clicks for: hammering a video player that isn't loading, repeatedly clicking search submit when results don't appear, clicking lesson cards that don't navigate, retrying failed lesson transitions. `emits_signals: true`.

The two monitors are disjoint: breakage owns *where* (URL scope on `/courses/`); frustration owns *what they did* (`$rageclick` gate only). A session can match both only at the small overlap (a rage-click inside a course page) — this is expected and acceptable.

Note: The `creating-replay-vision-scanners` in-product skill returned 404 on this deploy — sizing was done via direct quota check instead. Both scanners are well within budget.

---

## Follow-ups

- [ ] **Connect an inbound channel for Support/Conversations** — tickets only arrive in the inbox once an email inbox, Slack, or other channel is connected in PostHog (Settings → Support). The signal source is enabled and waiting.
- [ ] **Enable `signals-scout-ai-observability`** — if you wire PostHog's `$ai_generation` / `$ai_*` events around the Google AI SDK search calls (via PostHog AI SDK wrappers), enable this scout to watch LLM cost, latency, and error regressions.
- [ ] **Add saved funnels for lesson completion and search conversion** — the `product-analytics` scout watches saved funnels; creating a `search_submitted → search_result_clicked` and a lesson page view → `lesson_completed` funnel in PostHog will give that scout concrete flows to monitor in addition to the custom scouts.
- [ ] **Enable `signals-scout-feature-flags`** — when you adopt PostHog feature flags for gradual rollouts or experiments, enable this scout.

---

## What happens next

- The scout coordinator picks up fresh configs within ~30 minutes; first scans fire on the next tick
- Scout runs draw from the project's daily budget (100 runs/day during early access)
- Findings cluster into reports in the [Self-driving inbox](https://eu.posthog.com/project/257818/inbox)
- Replay Vision scanners start working the day session recordings begin
- Immediately-actionable reports can start coding tasks automatically
