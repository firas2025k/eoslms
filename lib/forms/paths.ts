/**
 * Same-origin relative path only. Rejects protocol-relative URLs, other hosts,
 * and anything that is not a site path.
 */
export function safeNextPath(raw: string | string[] | null | undefined): string | null {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (!value || typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed.startsWith("/")) return null;
  if (trimmed.startsWith("//")) return null;
  if (trimmed.includes("://")) return null;
  if (trimmed.includes("\\")) return null;
  return trimmed;
}

export function onboardingHref(nextPath?: string | null): string {
  const next = nextPath ? safeNextPath(nextPath) : null;
  if (!next || next === "/onboarding") return "/onboarding";
  return `/onboarding?next=${encodeURIComponent(next)}`;
}
