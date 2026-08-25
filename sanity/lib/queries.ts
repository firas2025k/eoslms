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
  "lessonIds": modules[].lessons[]._ref,
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

export const LESSON_ID_EXISTS_QUERY = defineQuery(
  `*[_type == "lesson" && _id == $id && !(_id in path("drafts.**"))][0]._id`,
)

export const PROGRESS_BY_USER_QUERY = defineQuery(
  `*[_type == "progress" && clerkUserId == $userId][0] {
    "completedLessonIds": completedLessons[]._ref,
    "lastLessonId": lastLesson._ref,
    lastPositionSeconds
  }`,
)

const searchLessonProjection = /* groq */ `
  _id,
  title,
  "slug": slug.current,
  duration,
  thumbnail { ${imageFields} },
  keyPoints,
  notes,
  videoUrl,
  "titleTermHits": count($terms[^.title match @]),
  "notesTermHits": count($terms[pt::text(^.notes) match @]),
  "keyPointTermHits": count($terms[^.keyPoints[] match @]),
  "course": *[_type == "course" && references(^._id)][0] {
    title,
    "slug": slug.current,
    coverImage { ${imageFields} },
    modules[] {
      title,
      lessons[]->{ _id }
    }
  }
`

export const SEARCH_LESSONS_QUERY = defineQuery(`*[
  _type == "lesson"
  && !(_id in path("drafts.**"))
  && count($terms[^.title match @ || pt::text(^.notes) match @ || ^.keyPoints[] match @]) > 0
]{
  ${searchLessonProjection}
}`)

export const SEARCH_VIDEO_HITS_QUERY = defineQuery(`*[
  _type == "video"
  && (
    count(chapters[label match $terms]) > 0
    || count(chunks[text match $terms]) > 0
  )
]{
  url,
  "chapterHits": chapters[label match $terms][0...3]{
    startSeconds,
    label
  },
  "chunkHits": chunks[text match $terms][0...3]{
    startSeconds,
    text
  }
}`)

export const SEARCH_LESSONS_BY_URLS_QUERY = defineQuery(`*[
  _type == "lesson"
  && !(_id in path("drafts.**"))
  && videoUrl in $urls
]{
  _id,
  title,
  "slug": slug.current,
  duration,
  thumbnail { ${imageFields} },
  keyPoints,
  notes,
  videoUrl,
  "course": *[_type == "course" && references(^._id)][0] {
    title,
    "slug": slug.current,
    coverImage { ${imageFields} },
    modules[] {
      title,
      lessons[]->{ _id }
    }
  }
}`)
