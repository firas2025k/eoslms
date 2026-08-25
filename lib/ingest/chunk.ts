/**
 * Caption cues → transcript chunks. Port of `studio/scripts/ingest/chunk.mjs`.
 */

const MAX_CHUNK_SECONDS = 45
const MAX_CHUNK_CHARS = 350

const ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  '#39': "'",
  nbsp: ' ',
}

export function decodeEntities(value: string): string {
  let text = String(value ?? '')
  for (let pass = 0; pass < 3; pass += 1) {
    const next = text.replace(/&(#?\w+);/g, (match, name: string) => {
      if (ENTITIES[name] !== undefined) return ENTITIES[name]
      if (/^#\d+$/.test(name)) return String.fromCodePoint(Number(name.slice(1)))
      return match
    })
    if (next === text) break
    text = next
  }
  return text
}

export function cleanCueText(value: string): string {
  return decodeEntities(value)
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export type Cue = {start: number; text: string}
export type Chunk = {startSeconds: number; text: string}

export function chunkCues(cues: Cue[]): Chunk[] {
  const chunks: Chunk[] = []
  let current: Chunk | null = null

  for (const cue of cues) {
    const text = cleanCueText(cue.text)
    if (!text) continue

    const start = Math.max(0, Math.floor(cue.start))

    if (!current) {
      current = {startSeconds: start, text}
      continue
    }

    const wouldBeTooLong = current.text.length + 1 + text.length > MAX_CHUNK_CHARS
    const wouldBeTooOld = start - current.startSeconds >= MAX_CHUNK_SECONDS

    if (wouldBeTooLong || wouldBeTooOld) {
      chunks.push(current)
      current = {startSeconds: start, text}
      continue
    }

    current.text = `${current.text} ${text}`
  }

  if (current) chunks.push(current)

  return chunks.reduce<Chunk[]>((kept, chunk) => {
    const previous = kept[kept.length - 1]
    if (previous && previous.startSeconds === chunk.startSeconds) {
      previous.text = `${previous.text} ${chunk.text}`
      return kept
    }
    kept.push(chunk)
    return kept
  }, [])
}
