import {defineQuery} from 'next-sanity'

export const CATEGORIES_QUERY = defineQuery(`*[_type == "category"] | order(title asc) {
  _id,
  title,
  "slug": slug.current,
  description
}`)

export const CATEGORY_BY_SLUG_QUERY = defineQuery(`*[_type == "category" && slug.current == $slug][0] {
  _id,
  title,
  "slug": slug.current,
  description,
  "courses": *[_type == "course" && category._ref == ^._id] | order(title asc) {
    _id,
    title,
    "slug": slug.current,
    summary,
    level,
    price,
    popular,
    studentCount
  }
}`)

export const CATEGORY_SLUGS_QUERY = defineQuery(`*[_type == "category" && defined(slug.current)] {
  "slug": slug.current
}`)
