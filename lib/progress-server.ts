import 'server-only'

import {auth} from '@clerk/nextjs/server'

import {client} from '@/sanity/lib/client'
import {PROGRESS_BY_USER_QUERY} from '@/sanity/lib/queries'
import {emptyProgress, type LearnerProgress} from '@/lib/progress'

function normalizeProgress(
  raw: {
    completedLessonIds?: Array<string | null> | null
    lastLessonId?: string | null
    lastPositionSeconds?: number | null
  } | null,
): LearnerProgress {
  if (!raw) return emptyProgress
  return {
    completedLessonIds: (raw.completedLessonIds ?? []).filter(
      (id): id is string => Boolean(id),
    ),
    lastLessonId: raw.lastLessonId ?? null,
    lastPositionSeconds:
      typeof raw.lastPositionSeconds === 'number' &&
      Number.isFinite(raw.lastPositionSeconds) &&
      raw.lastPositionSeconds >= 0
        ? Math.floor(raw.lastPositionSeconds)
        : null,
  }
}

export async function getProgressForUser(userId: string): Promise<LearnerProgress> {
  const raw = await client.fetch(
    PROGRESS_BY_USER_QUERY,
    {userId},
    {cache: 'no-store'},
  )
  return normalizeProgress(raw)
}

/** Empty progress when signed out; otherwise the caller's stored record. */
export async function getCurrentUserProgress(): Promise<LearnerProgress> {
  const {isAuthenticated, userId} = await auth()
  if (!isAuthenticated || !userId) return emptyProgress
  return getProgressForUser(userId)
}
