import Link from "next/link";
import { ArrowRight, BarChart3, Bookmark, Clock, FileText, Users } from "lucide-react";
import { ContinueLearningCta } from "@/components/course/continue-learning-cta";
import { SanityImage } from "@/components/sanity-image";
import { Badge } from "@/components/ui/badge";
import { Button, buttonClassName } from "@/components/ui/button";
import {
  formatDuration,
  formatLevel,
  formatModuleCount,
  formatStudentCount,
} from "@/lib/format";
import { cn } from "@/lib/cn";
import { urlFor } from "@/sanity/lib/image";
import type { COURSE_BY_SLUG_QUERY_RESULT } from "@/sanity.types";

type Course = NonNullable<COURSE_BY_SLUG_QUERY_RESULT>;

type CourseHeroProps = {
  course: Course;
  continueHref: string | null;
  isSignedIn?: boolean;
  feedbackHref?: string | null;
  className?: string;
};

export function CourseHero({
  course,
  continueHref,
  isSignedIn = false,
  feedbackHref,
  className,
}: CourseHeroProps) {
  const assetId = course.coverImage?.asset?._id;
  const coverUrl = assetId
    ? urlFor({
        _type: "image",
        asset: { _ref: assetId },
        hotspot: course.coverImage?.hotspot ?? undefined,
        crop: course.coverImage?.crop ?? undefined,
      })
        .width(800)
        .height(800)
        .fit("crop")
        .url()
    : null;
  const coverAlt = course.coverImage?.alt ?? course.title ?? "Course cover";
  const lqip = course.coverImage?.asset?.metadata?.lqip ?? undefined;

  return (
    <section
      className={cn(
        "grid grid-cols-1 items-start gap-8 md:grid-cols-[minmax(0,280px)_1fr] lg:grid-cols-[minmax(0,320px)_1fr] lg:gap-10",
        className,
      )}
    >
      <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-neutral-900 shadow-md">
        {coverUrl ? (
          <SanityImage
            src={coverUrl}
            alt={coverAlt}
            fill
            sizes="(max-width: 768px) 100vw, 320px"
            className="object-cover"
            placeholder={lqip ? "blur" : "empty"}
            blurDataURL={lqip}
            priority
          />
        ) : (
          <div className="flex size-full items-center justify-center text-heading-1 font-semibold text-white">
            {(course.title ?? "C").charAt(0)}
          </div>
        )}
      </div>

      <div className="flex min-w-0 flex-col">
        {course.popular ? (
          <Badge variant="popular" className="w-fit rounded-full">
            Popular
          </Badge>
        ) : null}

        <h1 className="mt-3 font-display text-display-2 font-bold text-neutral-900 sm:text-display-1">
          {course.title}
        </h1>

        {course.summary ? (
          <p className="mt-3 max-w-xl text-body-lg text-neutral-500">{course.summary}</p>
        ) : null}

        <ul className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3 text-body text-neutral-500">
          <li className="inline-flex items-center gap-1.5">
            <BarChart3
              className="size-4 text-primary-500"
              strokeWidth={2}
              aria-hidden="true"
            />
            {formatLevel(course.level)}
          </li>
          <li className="inline-flex items-center gap-1.5">
            <Clock
              className="size-4 text-primary-500"
              strokeWidth={2}
              aria-hidden="true"
            />
            {formatDuration(course.duration)}
          </li>
          <li className="inline-flex items-center gap-1.5">
            <FileText
              className="size-4 text-primary-500"
              strokeWidth={2}
              aria-hidden="true"
            />
            {formatModuleCount(course.moduleCount)}
          </li>
          <li className="inline-flex items-center gap-1.5">
            <Users
              className="size-4 text-primary-500"
              strokeWidth={2}
              aria-hidden="true"
            />
            {formatStudentCount(course.studentCount)} students
          </li>
        </ul>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          {continueHref ? (
            <ContinueLearningCta
              href={continueHref}
              isSignedIn={isSignedIn}
              className="min-w-[12rem]"
            />
          ) : (
            <Button disabled className="min-w-[12rem]">
              Continue Learning
              <ArrowRight className="size-4" strokeWidth={2} aria-hidden="true" />
            </Button>
          )}
          {feedbackHref ? (
            <Link
              href={feedbackHref}
              className={buttonClassName({variant: "secondary"})}
            >
              Share feedback
            </Link>
          ) : null}
          <Button type="button" variant="tertiary" aria-label="Bookmark course">
            <Bookmark className="size-4" strokeWidth={2} aria-hidden="true" />
            Bookmark
          </Button>
        </div>
      </div>
    </section>
  );
}
