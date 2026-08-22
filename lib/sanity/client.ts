import {createClient} from 'next-sanity'

import {apiVersion, dataset, projectId} from './env'

/**
 * Published-content client. No token on this object — private dataset reads
 * go through defineLive / sanityFetch with SANITY_API_READ_TOKEN on the server.
 */
export const client = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: true,
})
