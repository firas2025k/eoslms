const SANITY_ID = /^[a-zA-Z0-9._-]+$/;

export function sanitizeSanityIdSegment(value: string): string {
  return value.replace(/[^a-zA-Z0-9._-]/g, "_");
}

export function isSafeSanityId(id: string): boolean {
  return SANITY_ID.test(id) && !id.startsWith("drafts.");
}

export function onboardingDocumentId(userId: string): string {
  return `onboarding.${sanitizeSanityIdSegment(userId)}`;
}

export function feedbackDocumentId(userId: string, courseId: string): string {
  return `feedback.${sanitizeSanityIdSegment(userId)}.${sanitizeSanityIdSegment(courseId)}`;
}
