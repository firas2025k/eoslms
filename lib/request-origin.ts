import 'server-only'

import {headers} from 'next/headers'

/** Request origin for YouTube IFrame API `origin` param. */
export async function requestOrigin(): Promise<string | null> {
  const h = await headers()
  const host = h.get('x-forwarded-host') ?? h.get('host')
  if (!host) return null
  const proto = h.get('x-forwarded-proto') ?? 'http'
  return `${proto}://${host}`
}
