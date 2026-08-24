import {defineQuery} from 'next-sanity'

const imageFields = /* groq */ `
  asset->{
    _id,
    url,
    metadata { lqip, dimensions }
  },
  hotspot,
  crop,
  alt
`

export const COURSES_LIST_QUERY = defineQuery(`*[_type == "course"] | order(title asc) {
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
  "duration": math::sum(modules[].lessons[]->duration),
  "instructorName": instructor->name,
  "categoryTitle": category->title
}`)

export const COURSE_SLUGS_QUERY = defineQuery(`*[_type == "course" && defined(slug.current)] {
  "slug": slug.current
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
  "moduleCount": count(modules),
  "duration": math::sum(modules[].lessons[]->duration),
  learningOutcomes[] {
    _key,
    icon,
    title,
    description
  },
  instructor->{
    _id,
    name,
    "slug": slug.current,
    photo { ${imageFields} },
    expertise,
    bio
  },
  category->{
    _id,
    title,
    "slug": slug.current,
    description
  },
  modules[] {
    _key,
    title,
    summary,
    "duration": math::sum(lessons[]->duration),
    lessons[]->{
      _id,
      title,
      "slug": slug.current,
      duration,
      freePreview,
      thumbnail { ${imageFields} }
    }
  }
}`)

export const LESSON_SLUGS_QUERY = defineQuery(`*[_type == "lesson" && defined(slug.current)] {
  "slug": slug.current
}`)

/** Course slug + lesson slug pairs for generateStaticParams on the nested lesson route. */
export const LESSON_STATIC_PARAMS_QUERY = defineQuery(`*[_type == "course" && defined(slug.current)] {
  "slug": slug.current,
  "lessonSlugs": modules[].lessons[]->slug.current
}`)

export const LESSON_BY_SLUG_QUERY = defineQuery(`*[_type == "lesson" && slug.current == $slug][0] {
  _id,
  title,
  "slug": slug.current,
  videoUrl,
  thumbnail { ${imageFields} },
  duration,
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
    level,
    coverImage { ${imageFields} },
    instructor->{
      _id,
      name,
      "slug": slug.current,
      photo { ${imageFields} }
    },
    modules[] {
      _key,
      title,
      "duration": math::sum(lessons[]->duration),
      lessons[]->{
        _id,
        title,
        "slug": slug.current,
        duration,
        freePreview
      }
    }
  }
}`)

export const INSTRUCTORS_LIST_QUERY = defineQuery(`*[_type == "instructor"] | order(name asc) {
  _id,
  name,
  "slug": slug.current,
  photo { ${imageFields} },
  expertise
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
    studentCount,
    "moduleCount": count(modules),
    "duration": math::sum(modules[].lessons[]->duration)
  }
}`)

export const CATEGORIES_LIST_QUERY = defineQuery(`*[_type == "category"] | order(title asc) {
  _id,
  title,
  "slug": slug.current,
  description
}`)
