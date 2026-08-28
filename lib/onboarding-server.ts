import 'server-only'

import {auth} from '@clerk/nextjs/server'
import {redirect} from 'next/navigation'

import {coursePercent} from '@/lib/progress'
import {onboardingHref} from '@/lib/forms/paths'
import {client} from '@/sanity/lib/client'
import {
  FEEDBACK_BY_USER_COURSE_QUERY,
  ONBOARDING_BY_USER_QUERY,
} from '@/sanity/lib/queries'

export async function hasCompletedOnboarding(userId: string): Promise<boolean> {
  const id = await client.fetch(
    ONBOARDING_BY_USER_QUERY,
    {userId},
    {cache: 'no-store'},
  )
  return Boolean(id)
}

export async function hasCourseFeedback(
  userId: string,
  courseId: string,
): Promise<boolean> {
  const id = await client.fetch(
    FEEDBACK_BY_USER_COURSE_QUERY,
    {userId, courseId},
    {cache: 'no-store'},
  )
  return Boolean(id)
}

export function isCourseComplete(
  completedIds: Iterable<string>,
  courseLessonIds: ReadonlyArray<unknown> | null | undefined,
): boolean {
  return coursePercent(completedIds, courseLessonIds) === 100
}

/** Signed-in learners without onboarding are sent to `/onboarding`. Signed-out is a no-op. */
export async function redirectIfOnboardingIncomplete(nextPath: string) {
  const {isAuthenticated, userId} = await auth()
  if (!isAuthenticated || !userId) return
  const done = await hasCompletedOnboarding(userId)
  if (done) return
  redirect(onboardingHref(nextPath))
}
