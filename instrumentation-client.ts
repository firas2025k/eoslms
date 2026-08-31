import posthog from "posthog-js";
import type { CaptureResult } from "posthog-js";

const token = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;
const host = process.env.NEXT_PUBLIC_POSTHOG_HOST;

// Deployment skew is expected noise, not a bug: a tab on an older build posts a
// Server Action id a newer build no longer has. DeploySkewReload already recovers
// the tab, so drop this exception before a routine redeploy opens a new issue.
function dropDeploySkewException(event: CaptureResult | null): CaptureResult | null {
  if (event?.event === "$exception") {
    const list = event.properties?.$exception_list;
    const isSkew =
      Array.isArray(list) &&
      list.some(
        (item) =>
          item?.type === "UnrecognizedActionError" ||
          (typeof item?.value === "string" &&
            item.value.includes("was not found on the server")),
      );
    if (isSkew) return null;
  }
  return event;
}

if (!token) {
  if (process.env.NODE_ENV === "development") {
    console.error(
      "NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN variable required by PostHog is missing or un-configured, " +
        "this causes events to be silently missed. " +
        "This error stops appearing once NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN is configured",
    );
  }
} else {
  posthog.init(token, {
    api_host: "/ingest",
    ui_host: host ?? "https://eu.posthog.com",
    defaults: "2026-01-30",
    capture_exceptions: true,
    before_send: dropDeploySkewException,
    debug: process.env.NODE_ENV === "development",
  });
}

// IMPORTANT: Never combine this approach with other client-side PostHog initialization approaches,
// especially components like a PostHogProvider. instrumentation-client.ts is the correct solution
// for initializing client-side PostHog in Next.js 15.3+ apps.
