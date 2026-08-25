import 'server-only'

import {createClient} from 'next-sanity'

import {apiVersion, dataset, projectId} from '../env'

/**
 * Server-only Sanity client with a write token. Used by `/api/progress` and video ingest.
 * The token never reaches the browser — this module is guarded by `server-only`.
 */
export function getWriteClient() {
  const token = process.env.SANITY_API_WRITE_TOKEN
  if (!token) return null

  return createClient({
    projectId,
    dataset,
    apiVersion,
    useCdn: false,
    token,
  })
}
