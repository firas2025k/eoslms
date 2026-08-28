import {auth} from '@clerk/nextjs/server'
import {NextResponse} from 'next/server'
import {z} from 'zod'

import {feedbackDocumentId, isSafeSanityId} from '@/lib/forms/ids'
import {hasCourseFeedback, isCourseComplete} from '@/lib/onboarding-server'
import {getProgressForUser} from '@/lib/progress-server'
import {client} from '@/sanity/lib/client'
import {COURSE_FOR_FEEDBACK_QUERY} from '@/sanity/lib/queries'
import {getWriteClient} from '@/sanity/lib/write-client'

const Likert = z.number().int().min(1).max(5)

const FeedbackBodySchema = z
  .object({
    courseId: z.string().min(1),
    organised: Likert,
    knowledgeSkills: Likert,
    navigation: Likert,
    workload: Likert,
    peerConnection: Likert,
    whatWouldChange: z.string().trim().min(1),
  })
  .strict()

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

  const parsed = FeedbackBodySchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json({error: 'Invalid feedback payload'}, {status: 400})
  }

  const {courseId, ...answers} = parsed.data
  if (!isSafeSanityId(courseId)) {
    return NextResponse.json({error: 'Invalid course id'}, {status: 400})
  }

  const course = await client.fetch(
    COURSE_FOR_FEEDBACK_QUERY,
    {id: courseId},
    {cache: 'no-store'},
  )
  if (!course?._id) {
    return NextResponse.json({error: 'Unknown course'}, {status: 400})
  }
  if (course.feedbackEnabled !== true) {
    return NextResponse.json({error: 'Feedback is not enabled for this course'}, {status: 400})
  }

  const progress = await getProgressForUser(userId)
  if (!isCourseComplete(progress.completedLessonIds, course.lessonIds)) {
    return NextResponse.json({error: 'Course is not complete'}, {status: 403})
  }

  if (await hasCourseFeedback(userId, courseId)) {
    return NextResponse.json({alreadySubmitted: true})
  }

  const writeClient = getWriteClient()
  if (!writeClient) {
    return NextResponse.json(
      {error: 'SANITY_API_WRITE_TOKEN is not configured'},
      {status: 503},
    )
  }

  try {
    await writeClient.createIfNotExists({
      _id: feedbackDocumentId(userId, courseId),
      _type: 'courseFeedback',
      clerkUserId: userId,
      course: {_type: 'reference', _ref: courseId},
      ...answers,
      submittedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Failed to save feedback', error)
    return NextResponse.json({error: 'Failed to save feedback'}, {status: 500})
  }

  return NextResponse.json({alreadySubmitted: false})
}
