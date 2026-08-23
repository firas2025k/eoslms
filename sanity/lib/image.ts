import {createImageUrlBuilder, type SanityImageSource} from '@sanity/image-url'

import {dataset, projectId} from '../env'

const builder = createImageUrlBuilder({projectId, dataset})

/** Safe for client components — uses only public project id and dataset. */
export function urlFor(source: SanityImageSource) {
  return builder.image(source)
}
