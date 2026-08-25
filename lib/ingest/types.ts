export type VideoProvider = 'youtube' | 'vimeo' | 'bunny'

export type ParsedVideo = {
  provider: VideoProvider
  id: string
}

export type IngestSkip = {
  url: string
  reason: string
}

export type IngestFailure = {
  url: string
  error: string
}

export type IngestSuccess = {
  url: string
  documentId: string
  chapterCount: number
  chunkCount: number
}

export type IngestBatchResult = {
  ingested: IngestSuccess[]
  skipped: IngestSkip[]
  failed: IngestFailure[]
}
