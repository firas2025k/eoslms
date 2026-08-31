import {auth} from '@clerk/nextjs/server'
import {NextResponse} from 'next/server'
import {z} from 'zod'

import {onboardingCookieOptions, ONBOARDING_COOKIE} from '@/lib/onboarding-cookie'
import {onboardingDocumentId} from '@/lib/forms/ids'
import {safeNextPath} from '@/lib/forms/paths'
import {ONBOARDING_STAGE_VALUES} from '@/lib/forms/questions'
import {hasCompletedOnboarding} from '@/lib/onboarding-server'
import {requestOrigin} from '@/lib/request-origin'
import {sendWelcomeEmail} from '@/lib/resend'
import {getWriteClient} from '@/sanity/lib/write-client'

const OnboardingBodySchema = z
  .object({
    fullName: z.string().trim().min(1),
    email: z.string().trim().email(),
    location: z.string().trim().min(1),
    stage: z.enum(ONBOARDING_STAGE_VALUES),
    motivation: z.string().trim().min(1),
    twelveMonthGoal: z.string().trim().min(1),
  })
  .strict()

function withOnboardingCookie(response: NextResponse, userId: string) {
  response.cookies.set(ONBOARDING_COOKIE, userId, onboardingCookieOptions())
  return response
}

/** If onboarding already exists, set the cookie and redirect to `next`. */
export async function GET(request: Request) {
  const {isAuthenticated, userId} = await auth()
  if (!isAuthenticated || !userId) {
    return NextResponse.json({error: 'Unauthorized'}, {status: 401})
  }

  const {searchParams} = new URL(request.url)
  const next = safeNextPath(searchParams.get('next')) ?? '/courses'
  const done = await hasCompletedOnboarding(userId)

  if (done) {
    return withOnboardingCookie(NextResponse.redirect(new URL(next, request.url)), userId)
  }

  return NextResponse.json({alreadySubmitted: false})
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

  const parsed = OnboardingBodySchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json({error: 'Invalid onboarding payload'}, {status: 400})
  }

  const already = await hasCompletedOnboarding(userId)
  if (already) {
    return withOnboardingCookie(
      NextResponse.json({alreadySubmitted: true}),
      userId,
    )
  }

  const writeClient = getWriteClient()
  if (!writeClient) {
    return NextResponse.json(
      {error: 'SANITY_API_WRITE_TOKEN is not configured'},
      {status: 503},
    )
  }

  const docId = onboardingDocumentId(userId)
  const submittedAt = new Date().toISOString()

  try {
    await writeClient.createIfNotExists({
      _id: docId,
      _type: 'onboarding',
      clerkUserId: userId,
      ...parsed.data,
      submittedAt,
    })
  } catch (error) {
    console.error('Failed to save onboarding', error)
    return NextResponse.json({error: 'Failed to save onboarding'}, {status: 500})
  }

  const origin = (await requestOrigin()) ?? new URL(request.url).origin
  await sendWelcomeEmail({
    to: parsed.data.email,
    fullName: parsed.data.fullName,
    origin,
    userId,
  })

  return withOnboardingCookie(
    NextResponse.json({alreadySubmitted: false}),
    userId,
  )
}
