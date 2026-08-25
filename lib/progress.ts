export type LearnerProgress = {
  completedLessonIds: string[]
  lastLessonId: string | null
  lastPositionSeconds: number | null
}

export const emptyProgress: LearnerProgress = {
  completedLessonIds: [],
  lastLessonId: null,
  lastPositionSeconds: null,
}

export type CourseLessonRef = {
  id: string
  slug: string | null
}

/** Sanity document id for a learner's singleton progress record. */
export function progressDocumentId(userId: string): string {
  const safe = userId.replace(/[^a-zA-Z0-9._-]/g, '_')
  return `progress.${safe}`
}

function lessonIdList(ids: ReadonlyArray<unknown> | null | undefined): string[] {
  if (!ids) return []
  return ids.flat(2).filter((id): id is string => typeof id === "string" && id.length > 0)
}

export function isCompleted(
  lessonId: string | null | undefined,
  completedIds: Iterable<string>,
): boolean {
  if (!lessonId) return false
  const set = completedIds instanceof Set ? completedIds : new Set(completedIds)
  return set.has(lessonId)
}

export function coursePercent(
  completedIds: Iterable<string>,
  courseLessonIds: ReadonlyArray<unknown> | null | undefined,
): number {
  const ids = lessonIdList(courseLessonIds)
  if (ids.length === 0) return 0
  const completed = completedIds instanceof Set ? completedIds : new Set(completedIds)
  const done = ids.filter((id) => completed.has(id)).length
  return Math.min(100, Math.max(0, Math.round((100 * done) / ids.length)))
}

export function courseHasStarted(
  courseLessonIds: ReadonlyArray<unknown> | null | undefined,
  progress: LearnerProgress,
): boolean {
  const ids = new Set(lessonIdList(courseLessonIds))
  if (ids.size === 0) return false
  if (progress.lastLessonId && ids.has(progress.lastLessonId)) return true
  return progress.completedLessonIds.some((id) => ids.has(id))
}

export function flattenCourseLessons(
  modules:
    | Array<{
        lessons?: Array<{_id: string; slug?: string | null} | null> | null
      } | null>
    | null
    | undefined,
): CourseLessonRef[] {
  const out: CourseLessonRef[] = []
  for (const mod of modules ?? []) {
    for (const lesson of mod?.lessons ?? []) {
      if (!lesson?._id) continue
      out.push({id: lesson._id, slug: lesson.slug ?? null})
    }
  }
  return out
}

function firstIncompleteAfter(
  lessons: CourseLessonRef[],
  fromIndex: number,
  completed: Set<string>,
): CourseLessonRef | undefined {
  for (let i = fromIndex; i < lessons.length; i++) {
    const lesson = lessons[i]
    if (lesson && !completed.has(lesson.id)) return lesson
  }
  for (let i = 0; i < fromIndex; i++) {
    const lesson = lessons[i]
    if (lesson && !completed.has(lesson.id)) return lesson
  }
  return undefined
}

/**
 * Continue / resume URL for a course. Search `?t=` is applied by callers when
 * they already have a query override; this helper only appends stored seconds
 * when the target is the last viewed lesson.
 */
export function resumeHref({
  courseSlug,
  lessons,
  lastLessonId,
  lastPositionSeconds,
  completedIds,
}: {
  courseSlug: string
  lessons: CourseLessonRef[]
  lastLessonId: string | null
  lastPositionSeconds: number | null
  completedIds: Iterable<string>
}): string | null {
  const withSlug = lessons.filter((lesson) => Boolean(lesson.slug))
  if (withSlug.length === 0) return null

  const completed = completedIds instanceof Set ? completedIds : new Set(completedIds)
  const lastIndex = lastLessonId
    ? withSlug.findIndex((lesson) => lesson.id === lastLessonId)
    : -1
  const lastInCourse = lastIndex >= 0 ? withSlug[lastIndex] : undefined

  let target: CourseLessonRef | undefined

  if (lastInCourse && !completed.has(lastInCourse.id)) {
    target = lastInCourse
  } else if (lastInCourse && completed.has(lastInCourse.id)) {
    target =
      firstIncompleteAfter(withSlug, lastIndex + 1, completed) ?? lastInCourse
  } else {
    target = firstIncompleteAfter(withSlug, 0, completed) ?? withSlug[0]
  }

  if (!target?.slug) return null

  const path = `/courses/${courseSlug}/lessons/${target.slug}`
  const applySeconds =
    target.id === lastLessonId &&
    lastPositionSeconds != null &&
    lastPositionSeconds > 0

  return applySeconds ? `${path}?t=${lastPositionSeconds}` : path
}

export function youtubePlayerElementId(lessonId: string): string {
  return `yt-${lessonId.replace(/[^a-zA-Z0-9_-]/g, '')}`
}

export function lessonHref(
  courseSlug: string,
  lessonSlug: string,
  startSeconds?: number | null,
): string {
  const path = `/courses/${courseSlug}/lessons/${lessonSlug}`
  if (startSeconds == null || startSeconds <= 0) return path
  return `${path}?t=${startSeconds}`
}
