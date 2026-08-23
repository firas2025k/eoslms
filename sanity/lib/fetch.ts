import 'server-only'

import type {QueryParams} from 'next-sanity'

import {client} from './client'

type SanityFetchOptions<QueryString extends string> = {
  query: QueryString
  params?: QueryParams
  tags?: string[]
  /** Seconds. Ignored when tags are provided (tag-driven invalidation). */
  revalidate?: number | false
}

/**
 * Typed server fetch with Next cache tags / revalidate.
 * Defaults: tag-driven when `tags` are set; otherwise 1 hour.
 */
export async function sanityFetch<const QueryString extends string>({
  query,
  params = {},
  tags = [],
  revalidate = 3600,
}: SanityFetchOptions<QueryString>) {
  return client.fetch(query, params, {
    next: {
      revalidate: tags.length ? false : revalidate,
      tags,
    },
  })
}
