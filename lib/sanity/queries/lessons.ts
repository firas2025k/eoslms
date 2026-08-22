import {defineQuery} from 'next-sanity'

const imageFields = /* groq */ `
  asset->{
    _id,
    url,
    metadata { lqip, dimensions }
  },
  hotspot,
  crop
`

export const LESSON_BY_SLUG_QUERY = defineQuery(`*[_type == "lesson" && slug.current == $slug][0] {
  _id,
  title,
  "slug": slug.current,
  videoUrl,
  poster { ${imageFields} },
  durationMinutes,
  freePreview,
  studentCount,
  notes,
  keyPoints,
  proTip,
  resources[] {
    _key,
    type,
    title,
    description,
    url
  },
  "course": *[_type == "course" && references(^._id)][0] {
    _id,
    title,
    "slug": slug.current,
    coverImage { ${imageFields} },
    instructor->{
      _id,
      name,
      "slug": slug.current,
      photo { ${imageFields} }
    },
    "module": modules[count(lessons[@._ref == ^.^._id]) > 0][0] {
      _key,
      title
    }
  }
}`)

export const LESSON_SLUGS_QUERY = defineQuery(`*[_type == "lesson" && defined(slug.current)] {
  "slug": slug.current
}`)
