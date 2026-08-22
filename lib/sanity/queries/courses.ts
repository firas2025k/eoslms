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

const instructorCardFields = /* groq */ `
  _id,
  name,
  "slug": slug.current,
  photo { ${imageFields} },
  expertise
`

const categoryCardFields = /* groq */ `
  _id,
  title,
  "slug": slug.current,
  description
`

const lessonCardFields = /* groq */ `
  _id,
  title,
  "slug": slug.current,
  poster { ${imageFields} },
  durationMinutes,
  freePreview,
  studentCount,
  keyPoints
`

export const COURSES_QUERY = defineQuery(`*[_type == "course"] | order(title asc) {
  _id,
  title,
  "slug": slug.current,
  summary,
  coverImage { ${imageFields} },
  level,
  price,
  popular,
  studentCount,
  "moduleCount": count(modules),
  "lessonCount": count(modules[].lessons[]),
  instructor->{ ${instructorCardFields} },
  category->{ ${categoryCardFields} }
}`)

export const COURSE_BY_SLUG_QUERY = defineQuery(`*[_type == "course" && slug.current == $slug][0] {
  _id,
  title,
  "slug": slug.current,
  summary,
  coverImage { ${imageFields} },
  level,
  price,
  popular,
  studentCount,
  learningOutcomes[] {
    _key,
    icon,
    title,
    description
  },
  instructor->{
    ${instructorCardFields},
    bio
  },
  category->{ ${categoryCardFields} },
  modules[] {
    _key,
    title,
    summary,
    lessons[]->{ ${lessonCardFields} }
  }
}`)

export const COURSE_SLUGS_QUERY = defineQuery(`*[_type == "course" && defined(slug.current)] {
  "slug": slug.current
}`)
