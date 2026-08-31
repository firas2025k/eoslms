"use client";

import { useEffect } from "react";
import { unstable_isUnrecognizedActionError } from "next/navigation";

/**
 * Recovers a tab from deployment skew. When a page loaded from an older build
 * posts a Server Action id that a newer deployment no longer has, Next.js throws
 * an UnrecognizedActionError on the client. That is a stale-tab condition, not an
 * app bug: a reload fetches the current build and the interaction works again.
 *
 * This listener catches that one error and reloads instead of letting it surface
 * as an unhandled exception. A short cool-down stops a reload loop if the reload
 * somehow lands on the same failure.
 */

const RELOAD_GUARD_KEY = "vertex:action-skew-reload";
const RELOAD_COOLDOWN_MS = 10_000;

function reloadOnce() {
  try {
    const last = Number(sessionStorage.getItem(RELOAD_GUARD_KEY) ?? 0);
    if (Date.now() - last < RELOAD_COOLDOWN_MS) return;
    sessionStorage.setItem(RELOAD_GUARD_KEY, String(Date.now()));
  } catch {
    // sessionStorage can be blocked; fall through and still reload once.
  }
  window.location.reload();
}

export function DeploySkewReload() {
  useEffect(() => {
    const onRejection = (event: PromiseRejectionEvent) => {
      if (unstable_isUnrecognizedActionError(event.reason)) {
        event.preventDefault();
        reloadOnce();
      }
    };
    const onError = (event: ErrorEvent) => {
      if (unstable_isUnrecognizedActionError(event.error)) {
        event.preventDefault();
        reloadOnce();
      }
    };

    window.addEventListener("unhandledrejection", onRejection);
    window.addEventListener("error", onError);
    return () => {
      window.removeEventListener("unhandledrejection", onRejection);
      window.removeEventListener("error", onError);
    };
  }, []);

  return null;
}
