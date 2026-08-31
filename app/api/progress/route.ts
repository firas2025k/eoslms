import {auth} from '@clerk/nextjs/server'
import {NextResponse} from 'next/server'
import {z} from 'zod'

import {getPostHogClient} from '@/lib/posthog-server'
import {isCourseComplete} from '@/lib/onboarding-server'
import {progressDocumentId} from '@/lib/progress'
import {getProgressForUser} from '@/lib/progress-server'
import {requestOrigin} from '@/lib/request-origin'
import {sendCertificateReadyEmail} from '@/lib/resend'
import {getWriteClient} from '@/sanity/lib/write-client'
import {client} from '@/sanity/lib/client'
import {
  COURSE_FOR_LESSON_QUERY,
  LESSON_ID_EXISTS_QUERY,
  ONBOARDING_CONTACT_BY_USER_QUERY,
  PROGRESS_BY_USER_QUERY,
} from '@/sanity/lib/queries'

const SANITY_ID = /^[a-zA-Z0-9._-]+$/

const ProgressBodySchema = z
  .object({
    lessonId: z.string().min(1),
    completed: z.boolean().optional(),
    positionSeconds: z.number().int().nonnegative().optional(),
  })
  .strict()

function isSafeSanityId(id: string): boolean {
  return SANITY_ID.test(id) && !id.startsWith('drafts.')
}

export async function POST(request: Request) {
  const {isAuthenticated, userId} = await auth()
  if (!isAuthenticated || !userId) {
    return NextResponse.json({error: 'Unauthorized'}, {status: 401})
  }

  let json: unknown
  try {
    json = await request.json()
  } catch {
    return NextResponse.json({error: 'Invalid JSON body'}, {status: 400})
  }

  const parsed = ProgressBodySchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json({error: 'Invalid progress payload'}, {status: 400})
  }

  const {lessonId, completed, positionSeconds} = parsed.data
  if (!isSafeSanityId(lessonId)) {
    return NextResponse.json({error: 'Invalid lesson id'}, {status: 400})
  }

  const writeClient = getWriteClient()
  if (!writeClient) {
    return NextResponse.json(
      {error: 'SANITY_API_WRITE_TOKEN is not configured'},
      {status: 503},
    )
  }

  const existingLessonId = await client.fetch(LESSON_ID_EXISTS_QUERY, {id: lessonId}, {
    cache: 'no-store',
  })
  if (!existingLessonId) {
    return NextResponse.json({error: 'Unknown lesson'}, {status: 400})
  }

  const [previousProgress, courseForLesson] =
    completed === true
      ? await Promise.all([
          getProgressForUser(userId),
          client.fetch(
            COURSE_FOR_LESSON_QUERY,
            {lessonId},
            {cache: 'no-store'},
          ),
        ])
      : [null, null]

  const docId = progressDocumentId(userId)

  try {
    let patch = writeClient.patch(docId).setIfMissing({completedLessons: []}).set({
      lastLesson: {_type: 'reference', _ref: lessonId},
    })

    if (positionSeconds !== undefined) {
      patch = patch.set({lastPositionSeconds: positionSeconds})
    }

    if (completed === true) {
      patch = patch
        .unset([`completedLessons[_ref=="${lessonId}"]`])
        .append('completedLessons', [
          {_type: 'reference', _ref: lessonId, _key: lessonId},
        ])
    }

    await writeClient
      .transaction()
      .createIfNotExists({
        _id: docId,
        _type: 'progress',
        clerkUserId: userId,
        completedLessons: [],
      })
      .patch(patch)
      .commit({autoGenerateArrayKeys: false, visibility: 'sync'})
  } catch (error) {
    console.error('Failed to save progress', error)
    return NextResponse.json({error: 'Failed to save progress'}, {status: 500})
  }

  const updated = await client.fetch(
    PROGRESS_BY_USER_QUERY,
    {userId},
    {cache: 'no-store'},
  )

  const posthog = getPostHogClient()
  if (posthog) {
    posthog.capture({
      distinctId: userId,
      event: 'lesson_progress_saved',
      properties: {
        lesson_id: lessonId,
        completed: completed ?? false,
        position_seconds: positionSeconds ?? null,
      },
    })
    await posthog.flush()
  }

  if (
    completed === true &&
    courseForLesson?._id &&
    courseForLesson.feedbackEnabled !== true
  ) {
    const wasComplete = isCourseComplete(
      previousProgress?.completedLessonIds ?? [],
      courseForLesson.lessonIds,
    )
    const nowComplete = isCourseComplete(
      updated?.completedLessonIds ?? [],
      courseForLesson.lessonIds,
    )
    if (!wasComplete && nowComplete) {
      const [contact, origin] = await Promise.all([
        client.fetch(
          ONBOARDING_CONTACT_BY_USER_QUERY,
          {userId},
          {cache: 'no-store'},
        ),
        requestOrigin(),
      ])
      const email = contact?.email?.trim()
      const fullName = contact?.fullName?.trim()
      const title = courseForLesson.title?.trim()
      const slug = courseForLesson.slug?.trim()
      if (email && fullName && title && slug) {
        await sendCertificateReadyEmail({
          to: email,
          fullName,
          courseTitle: title,
          courseSlug: slug,
          origin: origin ?? new URL(request.url).origin,
          userId,
          courseId: courseForLesson._id,
        })
      } else {
        console.error('Skipping certificate email: missing contact or course fields')
      }
    }
  }

  return NextResponse.json({
    completedLessonIds: (updated?.completedLessonIds ?? []).filter(Boolean),
    lastLessonId: updated?.lastLessonId ?? lessonId,
    lastPositionSeconds: updated?.lastPositionSeconds ?? positionSeconds ?? null,
  })
}
