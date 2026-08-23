import {
  formatDuration,
  formatLevel,
  formatModuleCount,
} from "@/lib/format";
import { urlFor } from "@/sanity/lib/image";
import type { COURSES_LIST_QUERY_RESULT } from "@/sanity.types";

type CourseListItem = COURSES_LIST_QUERY_RESULT[number];

export function courseCoverUrl(course: CourseListItem, size = 112) {
  const assetId = course.coverImage?.asset?._id;
  if (!assetId) return null;
  return urlFor({
    _type: "image",
    asset: { _ref: assetId },
    hotspot: course.coverImage?.hotspot ?? undefined,
    crop: course.coverImage?.crop ?? undefined,
  })
    .width(size)
    .height(size)
    .fit("crop")
    .url();
}

/** Props for `CourseCard` from a COURSES_LIST_QUERY row. */
export function toCourseCardProps(course: CourseListItem) {
  return {
    href: course.slug ? `/courses/${course.slug}` : undefined,
    title: course.title ?? "Untitled course",
    description: course.summary ?? "",
    level: formatLevel(course.level),
    duration: formatDuration(course.duration),
    moduleCount: formatModuleCount(course.moduleCount),
    coverSrc: courseCoverUrl(course),
    coverAlt: course.coverImage?.alt ?? course.title ?? undefined,
    coverBlurDataURL: course.coverImage?.asset?.metadata?.lqip,
    thumbnailLabel: (course.title ?? "C").charAt(0),
  };
}
