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

export const INSTRUCTORS_QUERY = defineQuery(`*[_type == "instructor"] | order(name asc) {
  _id,
  name,
  "slug": slug.current,
  photo { ${imageFields} },
  expertise,
  bio
}`)

export const INSTRUCTOR_BY_SLUG_QUERY = defineQuery(`*[_type == "instructor" && slug.current == $slug][0] {
  _id,
  name,
  "slug": slug.current,
  photo { ${imageFields} },
  expertise,
  bio,
  "courses": *[_type == "course" && instructor._ref == ^._id] | order(title asc) {
    _id,
    title,
    "slug": slug.current,
    summary,
    coverImage { ${imageFields} },
    level,
    price,
    popular,
    studentCount
  }
}`)

export const INSTRUCTOR_SLUGS_QUERY = defineQuery(`*[_type == "instructor" && defined(slug.current)] {
  "slug": slug.current
}`)
