"use client";

import { useEffect, useRef } from "react";
import { useUser } from "@clerk/nextjs";
import posthog from "posthog-js";

/**
 * Identifies the signed-in Clerk user in PostHog.
 * Calls posthog.reset() only when transitioning from signed-in to signed-out
 * (not on initial anonymous page load, which would discard the anonymous session).
 * Rendered inside ClerkProvider so useUser is available.
 */
export function PostHogIdentity() {
  const { isSignedIn, isLoaded, user } = useUser();
  const wasSignedIn = useRef(false);

  useEffect(() => {
    if (!isLoaded) return;

    if (isSignedIn && user) {
      wasSignedIn.current = true;
      posthog.identify(user.id, {
        email: user.primaryEmailAddress?.emailAddress,
        name: user.fullName ?? undefined,
      });
    } else if (wasSignedIn.current) {
      // Only reset when transitioning out of an identified session
      wasSignedIn.current = false;
      posthog.reset();
    }
  }, [isSignedIn, isLoaded, user]);

  return null;
}
