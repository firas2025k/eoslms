# Recover from Server Action deployment skew

## Goal

Stop a stale browser tab from throwing an unhandled `UnrecognizedActionError`
when it posts a Server Action id that a newer deployment no longer has. Recover
the tab instead, and keep the error out of PostHog error tracking.

## Background

- A visitor on `/courses/[slug]` hit `UnrecognizedActionError: Server Action
  "…" was not found on the server`.
- This is deployment skew, not app logic. The tab held JavaScript from an older
  build and posted that build's action id to a newer one. No `use server` action
  exists in this repo; the call comes from framework or library client code.
- `next.config.ts` set no `deploymentId`, so any redeploy can break open tabs.

## Skills and code read

- `node_modules/next/dist/server/app-render/action-handler.js` — the server
  returns 404 with the `NEXT_ACTION_NOT_FOUND_HEADER` when the action id is
  absent (the skew case).
- `node_modules/next/dist/client/components/router-reducer/reducers/server-action-reducer.js`
  — the client sends the `x-deployment-id` header when a `deploymentId` is set,
  and throws `UnrecognizedActionError` on that header. There is no built-in
  reload; the app must handle the error.
- `next/navigation` exports `unstable_isUnrecognizedActionError` to identify it.

## Changes

1. `next.config.ts` — set `deploymentId` from `VERCEL_DEPLOYMENT_ID`, falling
   back to `VERCEL_GIT_COMMIT_SHA`. This is the prerequisite for Vercel Skew
   Protection to route an old tab back to its own build.
2. `components/deploy-skew-reload.tsx` — a client listener that catches the
   `UnrecognizedActionError` from `unhandledrejection`/`error` and reloads once
   (with a cool-down guard), turning the crash into a refresh onto the new build.
3. `instrumentation-client.ts` — a PostHog `before_send` hook that drops the
   `$exception` for this error class so routine redeploys stop opening issues.

## Security

- No new secrets. `deploymentId` reads Vercel-injected build env only.
- The reload guard runs on the client and touches `sessionStorage` only.

## Checks

- `npm run typecheck` — passes.
- `npm run lint` — no new warnings from the changed files.
- `npm run build` — compiles and type-checks; page-data collection needs live
  Sanity credentials, unrelated to this change.

## Manual test

1. Enable Vercel Skew Protection for the project.
2. Open a course page, redeploy, then trigger the client action from the old tab.
3. The tab reloads onto the current build instead of showing an error, and no new
   error tracking issue appears.
