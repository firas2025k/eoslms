import 'server-only'

import {buildVideoDocument} from '@/lib/ingest/build-document'
import {
  isIngestSupported,
  parseVideoUrl,
  videoDocumentId,
} from '@/lib/ingest/parse-video-url'
import {fetchYouTubeVideoData} from '@/lib/ingest/providers/youtube'
import type {IngestBatchResult, IngestSuccess} from '@/lib/ingest/types'
import {getWriteClient} from '@/sanity/lib/write-client'

export async function ingestVideoByUrl(url: string): Promise<IngestSuccess> {
  const parsed = parseVideoUrl(url)
  if (!parsed) {
    throw new Error('not a supported provider URL')
  }
  if (!isIngestSupported(parsed.provider)) {
    throw new Error(`no ${parsed.provider} ingestion adapter`)
  }

  const documentId = videoDocumentId(parsed)
  const {chapters, chunks} = await fetchYouTubeVideoData(parsed.id)
  const document = buildVideoDocument({
    documentId,
    parsed,
    url,
    chapters,
    chunks,
  })

  const writeClient = getWriteClient()
  if (!writeClient) {
    throw new Error('SANITY_API_WRITE_TOKEN is not configured')
  }

  await writeClient.createOrReplace(document)

  return {
    url,
    documentId,
    chapterCount: document.chapters.length,
    chunkCount: document.chunks.length,
  }
}

export async function ingestVideoUrls(urls: string[]): Promise<IngestBatchResult> {
  const uniqueUrls = [...new Set(urls.filter(Boolean))]
  const result: IngestBatchResult = {ingested: [], skipped: [], failed: []}

  for (const url of uniqueUrls) {
    const parsed = parseVideoUrl(url)
    if (!parsed) {
      result.skipped.push({url, reason: 'not a supported provider URL'})
      continue
    }
    if (!isIngestSupported(parsed.provider)) {
      result.skipped.push({url, reason: `no ${parsed.provider} ingestion adapter`})
      continue
    }

    try {
      result.ingested.push(await ingestVideoByUrl(url))
    } catch (error) {
      result.failed.push({
        url,
        error: error instanceof Error ? error.message : 'ingest failed',
      })
    }
  }

  return result
}
