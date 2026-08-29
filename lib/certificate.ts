/** Certificate routes and the unlock rule. Safe to import from client components. */

export function certificatePagePath(courseSlug: string): string {
  return `/courses/${courseSlug}/certificate`
}

export function certificatePdfPath(courseId: string): string {
  return `/api/certificates/${encodeURIComponent(courseId)}`
}

export function certificateFilename(courseSlug: string): string {
  const slug = courseSlug.trim() || "course"
  return `EOS-Academy-${slug}-certificate.pdf`
}

export function isCertificateUnlocked(input: {
  courseComplete: boolean
  feedbackEnabled: boolean
  hasFeedback: boolean
}): boolean {
  if (!input.courseComplete) return false
  if (input.feedbackEnabled && !input.hasFeedback) return false
  return true
}

/** Human-readable issue date in UTC, e.g. "29 August 2026". */
export function formatCertificateDate(date: Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(date)
}
