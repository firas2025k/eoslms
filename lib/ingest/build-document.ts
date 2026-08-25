import type {Chunk} from '@/lib/ingest/chunk'
import type {ParsedVideo} from '@/lib/ingest/types'

export type RawChapter = {startSeconds: number; label: string}
export type VideoSanityDocument = {
  _id: string
  _type: 'video'
  videoId: string
  url: string
  provider: ParsedVideo['provider']
  chapters: Array<{
    _type: 'videoChapter'
    _key: string
    startSeconds: number
    label: string
  }>
  chunks: Array<{
    _type: 'videoChunk'
    _key: string
    startSeconds: number
    text: string
  }>
  ingestedAt: string
}

const isNonNegativeInteger = (value: number) => Number.isInteger(value) && value >= 0

export function buildVideoDocument(input: {
  documentId: string
  parsed: ParsedVideo
  url: string
  chapters: RawChapter[]
  chunks: Chunk[]
  ingestedAt?: string
}): VideoSanityDocument {
  const problems: string[] = []
  const check = (condition: boolean, message: string) => {
    if (!condition) problems.push(message)
  }

  check(
    /^video\.[A-Za-z0-9._-]+$/.test(input.documentId),
    'invalid document id',
  )
  check(input.parsed.id.length > 0, 'missing videoId')
  check(input.url.startsWith('https://'), 'url must be https')
  check(['youtube', 'vimeo', 'bunny'].includes(input.parsed.provider), 'unknown provider')
  check(input.chunks.length > 0, 'no transcript chunks')

  let previousChapter = -1
  input.chapters.forEach((chapter, index) => {
    check(isNonNegativeInteger(chapter.startSeconds), `chapter ${index} bad startSeconds`)
    check(chapter.label.trim().length > 0, `chapter ${index} empty label`)
    check(chapter.startSeconds > previousChapter, 'chapters not strictly ascending')
    previousChapter = chapter.startSeconds
  })

  let previousChunk = -1
  input.chunks.forEach((chunk, index) => {
    check(isNonNegativeInteger(chunk.startSeconds), `chunk ${index} bad startSeconds`)
    check(chunk.text.trim().length > 0, `chunk ${index} empty text`)
    check(chunk.startSeconds > previousChunk, 'chunks not strictly ascending')
    previousChunk = chunk.startSeconds
  })

  if (problems.length) {
    throw new Error(problems.join('; '))
  }

  return {
    _id: input.documentId,
    _type: 'video',
    videoId: input.parsed.id,
    url: input.url,
    provider: input.parsed.provider,
    chapters: input.chapters.map((chapter) => ({
      _type: 'videoChapter',
      _key: `chapter-${chapter.startSeconds}`,
      startSeconds: chapter.startSeconds,
      label: chapter.label.trim(),
    })),
    chunks: input.chunks.map((chunk, index) => ({
      _type: 'videoChunk',
      _key: `chunk-${index}`,
      startSeconds: chunk.startSeconds,
      text: chunk.text.trim(),
    })),
    ingestedAt: input.ingestedAt ?? new Date().toISOString(),
  }
}
