import "server-only"

import {currentUser} from "@clerk/nextjs/server"

import {isCertificateUnlocked} from "@/lib/certificate"
import {isCourseComplete} from "@/lib/onboarding-server"
import {getProgressForUser} from "@/lib/progress-server"
import {client} from "@/sanity/lib/client"
import {
  COURSE_FOR_FEEDBACK_QUERY,
  FEEDBACK_META_BY_USER_COURSE_QUERY,
  ONBOARDING_NAME_BY_USER_QUERY,
  PROGRESS_UPDATED_AT_BY_USER_QUERY,
} from "@/sanity/lib/queries"

export type CertificatePayload = {
  courseId: string
  courseTitle: string
  courseSlug: string
  learnerName: string
  issueDate: Date
}

function parseDate(value: string | null | undefined): Date | null {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

export async function getLearnerDisplayName(userId: string): Promise<string | null> {
  const onboarding = await client.fetch(
    ONBOARDING_NAME_BY_USER_QUERY,
    {userId},
    {cache: "no-store"},
  )
  const fromOnboarding = onboarding?.fullName?.trim()
  if (fromOnboarding) return fromOnboarding

  const user = await currentUser()
  if (!user || user.id !== userId) return null
  const fromClerk =
    user.fullName?.trim() ||
    [user.firstName, user.lastName].filter(Boolean).join(" ").trim()
  return fromClerk || null
}

export async function getCertificateIssueDate(
  userId: string,
  course: {_id: string; feedbackEnabled?: boolean | null},
): Promise<Date> {
  if (course.feedbackEnabled === true) {
    const feedback = await client.fetch(
      FEEDBACK_META_BY_USER_COURSE_QUERY,
      {userId, courseId: course._id},
      {cache: "no-store"},
    )
    const fromFeedback = parseDate(feedback?._createdAt)
    if (fromFeedback) return fromFeedback
  } else {
    const updatedAt = await client.fetch(
      PROGRESS_UPDATED_AT_BY_USER_QUERY,
      {userId},
      {cache: "no-store"},
    )
    const fromProgress = parseDate(updatedAt)
    if (fromProgress) return fromProgress
  }

  return new Date()
}

export async function loadCertificatePayload(
  userId: string,
  courseId: string,
): Promise<{ok: true; data: CertificatePayload} | {ok: false; status: 403 | 404}> {
  const course = await client.fetch(
    COURSE_FOR_FEEDBACK_QUERY,
    {id: courseId},
    {cache: "no-store"},
  )
  if (!course?._id) {
    return {ok: false, status: 404}
  }

  const [progress, feedback, learnerName] = await Promise.all([
    getProgressForUser(userId),
    course.feedbackEnabled === true
      ? client.fetch(
          FEEDBACK_META_BY_USER_COURSE_QUERY,
          {userId, courseId: course._id},
          {cache: "no-store"},
        )
      : Promise.resolve(null),
    getLearnerDisplayName(userId),
  ])

  const unlocked = isCertificateUnlocked({
    courseComplete: isCourseComplete(progress.completedLessonIds, course.lessonIds),
    feedbackEnabled: course.feedbackEnabled === true,
    hasFeedback: Boolean(feedback?._id),
  })
  if (!unlocked || !learnerName) {
    return {ok: false, status: 403}
  }

  const title = course.title?.trim()
  const slug = course.slug?.trim()
  if (!title || !slug) {
    return {ok: false, status: 404}
  }

  return {
    ok: true,
    data: {
      courseId: course._id,
      courseTitle: title,
      courseSlug: slug,
      learnerName,
      issueDate: await getCertificateIssueDate(userId, course),
    },
  }
}
