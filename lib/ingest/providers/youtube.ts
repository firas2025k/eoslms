/**
 * YouTube ingestion: chapters from the watch page, transcript from InnerTube iOS captions.
 * Port of `studio/scripts/ingest/providers/youtube.mjs`.
 */

import {type Cue, chunkCues} from '@/lib/ingest/chunk'

const WATCH_USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

const INNERTUBE_KEY = 'AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8'

const IOS_CLIENT = {
  userAgent: 'com.google.ios.youtube/20.10.4 (iPhone16,2; U; CPU iOS 18_3_2 like Mac OS X)',
  context: {
    client: {
      clientName: 'IOS',
      clientVersion: '20.10.4',
      deviceModel: 'iPhone16,2',
      hl: 'en',
      gl: 'US',
    },
  },
}

async function fetchText(url: string, userAgent: string, init?: RequestInit): Promise<string> {
  const response = await fetch(url, {
    ...init,
    headers: {
      'user-agent': userAgent,
      'accept-language': 'en-US,en',
      ...init?.headers,
    },
  })
  if (!response.ok) throw new Error(`${response.status} from ${new URL(url).host}`)
  return response.text()
}

async function playerResponse(videoId: string) {
  const body = await fetchText(
    `https://www.youtube.com/youtubei/v1/player?key=${INNERTUBE_KEY}`,
    IOS_CLIENT.userAgent,
    {
      method: 'POST',
      headers: {'content-type': 'application/json'},
      body: JSON.stringify({videoId, context: IOS_CLIENT.context}),
    },
  )

  const data = JSON.parse(body) as {
    playabilityStatus?: {status?: string; reason?: string}
    captions?: {playerCaptionsTracklistRenderer?: {captionTracks?: Array<{baseUrl?: string; languageCode?: string; kind?: string}>}}
    videoDetails?: {lengthSeconds?: string}
  }

  const status = data?.playabilityStatus?.status
  if (status && status !== 'OK') {
    throw new Error(
      `not playable (${status}${data.playabilityStatus?.reason ? `: ${data.playabilityStatus.reason}` : ''})`,
    )
  }
  return data
}

function pickTrack(
  tracks: Array<{baseUrl?: string; languageCode?: string; kind?: string}>,
) {
  const score = (track: {languageCode?: string; kind?: string}) =>
    (track.languageCode?.startsWith('en') ? 2 : 0) + (track.kind === 'asr' ? 0 : 1)
  return [...tracks].sort((a, b) => score(b) - score(a))[0]
}

function parseJson3(body: string): Cue[] {
  const data = JSON.parse(body) as {
    events?: Array<{tStartMs?: number; segs?: Array<{utf8?: string}>}>
  }
  return (data.events ?? [])
    .filter((event) => Array.isArray(event.segs))
    .map((event) => ({
      start: (event.tStartMs ?? 0) / 1000,
      text: (event.segs ?? []).map((seg) => seg.utf8 ?? '').join(''),
    }))
}

function parseTimedTextXml(body: string): Cue[] {
  const cues: Cue[] = []
  const pattern = /<text[^>]*\bstart="([\d.]+)"[^>]*>([\s\S]*?)<\/text>/g
  let match: RegExpExecArray | null
  while ((match = pattern.exec(body))) {
    cues.push({start: Number(match[1]), text: match[2]})
  }
  return cues
}

export async function fetchTranscript(videoId: string) {
  const player = await playerResponse(videoId)
  const tracks = player?.captions?.playerCaptionsTracklistRenderer?.captionTracks ?? []
  if (!tracks.length) throw new Error('no caption track')

  const track = pickTrack(tracks)
  if (!track?.baseUrl) throw new Error('no caption track url')

  const durationSeconds = Number(player?.videoDetails?.lengthSeconds)
  const body = await fetchText(`${track.baseUrl}&fmt=json3`, IOS_CLIENT.userAgent)
  const cues = body.trimStart().startsWith('<') ? parseTimedTextXml(body) : parseJson3(body)
  if (!cues.length) throw new Error('caption track returned no cues')

  return {
    cues: cues.sort((a, b) => a.start - b.start),
    durationSeconds: Number.isFinite(durationSeconds) ? durationSeconds : null,
  }
}

function initialData(html: string) {
  const match = html.match(/var ytInitialData = (\{[\s\S]*?\});<\/script>/)
  if (!match) return null
  try {
    return JSON.parse(match[1]) as unknown
  } catch {
    return null
  }
}

function collectChapters(
  node: unknown,
  found: Array<{startSeconds: number; label: string}> = [],
): Array<{startSeconds: number; label: string}> {
  if (Array.isArray(node)) {
    node.forEach((item) => collectChapters(item, found))
    return found
  }
  if (!node || typeof node !== 'object') return found

  const record = node as Record<string, unknown>
  const renderer =
    (record.chapterRenderer as Record<string, unknown> | undefined) ??
    (record.macroMarkersListItemRenderer as Record<string, unknown> | undefined)

  if (renderer) {
    const title = renderer.title as {simpleText?: string; runs?: Array<{text?: string}>} | undefined
    const label = title?.simpleText ?? title?.runs?.[0]?.text
    const millis = renderer.timeRangeStartMillis
    if (typeof label === 'string' && typeof millis === 'number' && Number.isFinite(millis)) {
      found.push({startSeconds: Math.max(0, Math.floor(millis / 1000)), label: label.trim()})
    }
  }

  Object.values(record).forEach((value) => collectChapters(value, found))
  return found
}

export async function fetchChapters(videoId: string, durationSeconds: number | null) {
  const html = await fetchText(
    `https://www.youtube.com/watch?v=${videoId}&hl=en`,
    WATCH_USER_AGENT,
  )

  const data = initialData(html)
  if (!data) return []

  const bySecond = new Map<number, {startSeconds: number; label: string}>()
  for (const chapter of collectChapters(data)) {
    if (!chapter.label) continue
    if (durationSeconds && chapter.startSeconds > durationSeconds) continue
    if (!bySecond.has(chapter.startSeconds)) bySecond.set(chapter.startSeconds, chapter)
  }

  return [...bySecond.values()].sort((a, b) => a.startSeconds - b.startSeconds)
}

export async function fetchYouTubeVideoData(videoId: string) {
  const {cues, durationSeconds} = await fetchTranscript(videoId)
  const chunks = chunkCues(cues)
  if (!chunks.length) throw new Error('transcript produced no chunks')
  const chapters = await fetchChapters(videoId, durationSeconds)
  return {chapters, chunks}
}
