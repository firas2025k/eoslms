import 'server-only'

import {createClient} from 'next-sanity'

import {apiVersion, dataset, projectId} from '../env'
import {token} from './token'

/**
 * Server-only Sanity client for the private dataset.
 * Token never reaches the browser — this module is guarded by `server-only`.
 */
export const client = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: false,
  token,
})
