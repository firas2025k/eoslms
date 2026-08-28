import {clerkMiddleware, createRouteMatcher} from '@clerk/nextjs/server'
import {NextResponse} from 'next/server'

import {ONBOARDING_COOKIE} from '@/lib/onboarding-cookie'

const isProtectedRoute = createRouteMatcher([
  '/my-learning(.*)',
  '/api/progress(.*)',
  '/onboarding(.*)',
  '/api/onboarding(.*)',
  '/courses/(.*)/feedback(.*)',
  '/api/feedback(.*)',
])

const isOnboardingExempt = createRouteMatcher([
  '/onboarding(.*)',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api(.*)',
  '/__clerk(.*)',
])

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) await auth.protect()

  const {userId} = await auth()
  if (!userId) return
  if (isOnboardingExempt(req)) return

  const cookie = req.cookies.get(ONBOARDING_COOKIE)?.value
  if (cookie === userId) return

  const url = req.nextUrl.clone()
  const next = `${req.nextUrl.pathname}${req.nextUrl.search}`
  url.pathname = '/onboarding'
  url.search = `?next=${encodeURIComponent(next)}`
  return NextResponse.redirect(url)
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
    '/__clerk/:path*',
  ],
}
