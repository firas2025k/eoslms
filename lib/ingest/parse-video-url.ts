/**
 * Provider + id from a lesson's `videoUrl`.
 * Keep in sync with `studio/scripts/ingest/parse-video-url.mjs`.
 */

import type {ParsedVideo, VideoProvider} from '@/lib/ingest/types'

const ID_PATTERN = /^[\w-]+$/

export function parseVideoUrl(url: string | null | undefined): ParsedVideo | null {
  if (!url) return null

  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return null
  }

  if (parsed.protocol !== 'https:') return null

  const host = parsed.hostname.replace(/^www\./, '')
  const segments = parsed.pathname.split('/').filter(Boolean)

  if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
    const id = parsed.searchParams.get('v') ?? (segments[0] === 'embed' ? segments[1] : null)
    return id && ID_PATTERN.test(id) ? {provider: 'youtube', id} : null
  }

  if (host === 'youtu.be') {
    const [id] = segments
    return id && ID_PATTERN.test(id) ? {provider: 'youtube', id} : null
  }

  if (host === 'vimeo.com' || host === 'player.vimeo.com') {
    const id = segments[0] === 'video' ? segments[1] : segments[0]
    return id && /^\d+$/.test(id) ? {provider: 'vimeo', id} : null
  }

  if (host === 'iframe.mediadelivery.net' || host === 'video.bunnycdn.com') {
    const [library, id] =
      segments[0] === 'embed' || segments[0] === 'play' ? segments.slice(1) : segments
    return library && id && ID_PATTERN.test(library) && ID_PATTERN.test(id)
      ? {provider: 'bunny', id: `${library}/${id}`}
      : null
  }

  return null
}

export function videoDocumentId(parsed: ParsedVideo): string {
  return `video.${parsed.provider}-${parsed.id.replace(/[^A-Za-z0-9_-]+/g, '-')}`
}

export function isIngestSupported(provider: VideoProvider): boolean {
  return provider === 'youtube'
}
