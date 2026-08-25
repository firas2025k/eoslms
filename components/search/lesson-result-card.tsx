"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import posthog from "posthog-js";

import { Badge } from "@/components/ui/badge";
import type { LessonResult } from "@/lib/search/schema";
import { cn } from "@/lib/cn";

type Props = { result: LessonResult; className?: string };

export function LessonResultCard({ result, className }: Props) {
  const {
    courseSlug,
    courseTitle,
    lessonSlug,
    lessonTitle,
    moduleTitle,
    moduleIndex,
    description,
    thumbnailUrl,
  } = result;

  const lessonHref = `/courses/${courseSlug}/lessons/${lessonSlug}`;

  function handleClick() {
    posthog.capture("search_result_clicked", {
      result_kind: "lesson",
      course_slug: courseSlug,
      lesson_slug: lessonSlug,
      module_index: moduleIndex,
    });
  }

  return (
    <article
      className={cn(
        "flex gap-4 rounded-md border border-neutral-200 bg-white p-5 shadow-sm",
        className,
      )}
      onClick={handleClick}
    >
      <Link
        href={lessonHref}
        tabIndex={-1}
        aria-hidden="true"
        className="relative hidden shrink-0 overflow-hidden rounded-sm sm:block"
        style={{ width: 140, height: 90 }}
      >
        {thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={thumbnailUrl}
            alt=""
            className="h-full w-full object-cover"
            style={{ background: "#1e293b" }}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-neutral-200" />
        )}
      </Link>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-small font-medium text-neutral-900">{courseTitle}</span>
          <Badge variant="lesson">LESSON</Badge>
        </div>

        <h2 className="mt-1 text-heading-3 font-semibold text-neutral-900 leading-snug">
          {lessonTitle}
        </h2>
        <p className="mt-1 text-body text-neutral-500 line-clamp-2">{description}</p>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <p className="text-small text-neutral-400">
            Module {moduleIndex}
            <span className="mx-1.5 text-neutral-300">·</span>
            {moduleTitle}
          </p>
          <Link
            href={lessonHref}
            className="inline-flex items-center gap-1 text-small font-medium text-primary-500 hover:text-[#ea580c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 rounded-xs"
          >
            View lesson
            <ArrowUpRight className="size-3.5" strokeWidth={2} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </article>
  );
}
