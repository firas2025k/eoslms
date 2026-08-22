import {sanityFetch} from './live'
import {
  CATEGORIES_QUERY,
  CATEGORY_BY_SLUG_QUERY,
  COURSE_BY_SLUG_QUERY,
  COURSE_SLUGS_QUERY,
  COURSES_QUERY,
  INSTRUCTOR_BY_SLUG_QUERY,
  INSTRUCTOR_SLUGS_QUERY,
  INSTRUCTORS_QUERY,
  LESSON_BY_SLUG_QUERY,
  LESSON_SLUGS_QUERY,
} from './queries'

async function fetchPublished<const QueryString extends string>(options: {
  query: QueryString
  params?: Record<string, unknown>
  tags?: string[]
}) {
  const {data} = await sanityFetch({
    ...options,
    perspective: 'published',
    stega: false,
  })
  return data
}

export async function getCourses() {
  return fetchPublished({
    query: COURSES_QUERY,
    tags: ['course', 'instructor', 'category'],
  })
}

export async function getCourseBySlug(slug: string) {
  return fetchPublished({
    query: COURSE_BY_SLUG_QUERY,
    params: {slug},
    tags: [`course:${slug}`, 'lesson', 'instructor', 'category'],
  })
}

export async function getCourseSlugs() {
  return fetchPublished({
    query: COURSE_SLUGS_QUERY,
    tags: ['course'],
  })
}

export async function getLessonBySlug(slug: string) {
  return fetchPublished({
    query: LESSON_BY_SLUG_QUERY,
    params: {slug},
    tags: [`lesson:${slug}`, 'course', 'instructor'],
  })
}

export async function getLessonSlugs() {
  return fetchPublished({
    query: LESSON_SLUGS_QUERY,
    tags: ['lesson'],
  })
}

export async function getInstructors() {
  return fetchPublished({
    query: INSTRUCTORS_QUERY,
    tags: ['instructor'],
  })
}

export async function getInstructorBySlug(slug: string) {
  return fetchPublished({
    query: INSTRUCTOR_BY_SLUG_QUERY,
    params: {slug},
    tags: [`instructor:${slug}`, 'course'],
  })
}

export async function getInstructorSlugs() {
  return fetchPublished({
    query: INSTRUCTOR_SLUGS_QUERY,
    tags: ['instructor'],
  })
}

export async function getCategories() {
  return fetchPublished({
    query: CATEGORIES_QUERY,
    tags: ['category'],
  })
}

export async function getCategoryBySlug(slug: string) {
  return fetchPublished({
    query: CATEGORY_BY_SLUG_QUERY,
    params: {slug},
    tags: [`category:${slug}`, 'course'],
  })
}
