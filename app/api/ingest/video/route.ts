import {NextRequest, NextResponse} from 'next/server'
import {parseBody} from 'next-sanity/webhook'

import {ingestVideoUrls} from '@/lib/ingest/ingest-video'
import {client} from '@/sanity/lib/client'
import {LESSON_VIDEO_URLS_BY_IDS_QUERY} from '@/sanity/lib/queries'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 60

type WebhookIds = {
  created?: string[]
  updated?: string[]
  deleted?: string[]
}

type SanityWebhookBody = {
  ids?: string[] | WebhookIds
  videoUrl?: string
  result?: Array<{videoUrl?: string | null}>
}

function bearerAuthorized(request: NextRequest, secret: string | undefined): boolean {
  if (!secret) return false
  const header = request.headers.get('authorization')
  if (!header?.startsWith('Bearer ')) return false
  return header.slice('Bearer '.length).trim() === secret.trim()
}

function normalizeDocumentIds(body: SanityWebhookBody): string[] {
  if (!body.ids) return []

  if (Array.isArray(body.ids)) {
    return body.ids
  }

  return [...(body.ids.created ?? []), ...(body.ids.updated ?? [])]
}

function publishedId(id: string): string | null {
  const normalized = id.replace(/^drafts\./, '')
  if (!normalized || normalized.startsWith('drafts.')) return null
  return normalized
}

async function videoUrlsFromWebhookBody(body: SanityWebhookBody): Promise<string[]> {
  if (typeof body.videoUrl === 'string' && body.videoUrl.trim()) {
    return [body.videoUrl.trim()]
  }

  if (Array.isArray(body.result)) {
    return body.result
      .map((row) => row.videoUrl)
      .filter((url): url is string => typeof url === 'string' && url.length > 0)
  }

  const ids = normalizeDocumentIds(body)
    .map(publishedId)
    .filter((id): id is string => Boolean(id))

  if (!ids.length) return []

  const urls = await client.fetch<string[]>(
    LESSON_VIDEO_URLS_BY_IDS_QUERY,
    {ids},
    {cache: 'no-store'},
  )

  return [...new Set(urls.filter(Boolean))]
}

export async function POST(request: NextRequest) {
  const secret = process.env.INGEST_WEBHOOK_SECRET
  const allowBearer = bearerAuthorized(request, secret)

  let body: SanityWebhookBody | null = null

  if (allowBearer) {
    try {
      body = (await request.json()) as SanityWebhookBody
    } catch {
      return NextResponse.json({error: 'Invalid JSON body'}, {status: 400})
    }
  } else {
    if (!secret) {
      return NextResponse.json({error: 'INGEST_WEBHOOK_SECRET is not configured'}, {status: 503})
    }

    const parsed = await parseBody<SanityWebhookBody>(request, secret, true)
    if (parsed.isValidSignature !== true) {
      return NextResponse.json({error: 'Invalid webhook signature'}, {status: 401})
    }
    body = parsed.body
  }

  if (!body) {
    return NextResponse.json({error: 'Empty webhook body'}, {status: 400})
  }

  const urls = await videoUrlsFromWebhookBody(body)
  if (!urls.length) {
    return NextResponse.json({error: 'No ingestible videoUrl in payload'}, {status: 400})
  }

  try {
    const result = await ingestVideoUrls(urls)
    return NextResponse.json(result)
  } catch (error) {
    console.error('[ingest/video] error:', error)
    return NextResponse.json({error: 'Video ingest failed'}, {status: 500})
  }
}
