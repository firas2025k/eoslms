import Link from "next/link";
import { ArrowUpRight, FileText } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { LessonResult } from "@/lib/search/schema";
import { cn } from "@/lib/cn";

type Props = { result: LessonResult; className?: string };

export function LessonResultCard({ result, className }: Props) {
  const { courseSlug, courseTitle, lessonSlug, lessonTitle, moduleTitle, moduleIndex, description, keyPoints } =
    result;

  const lessonHref = `/courses/${courseSlug}/lessons/${lessonSlug}`;

  return (
    <article
      className={cn(
        "flex gap-4 rounded-md border border-neutral-200 bg-white p-5 shadow-sm",
        className,
      )}
    >
      {/* Key-points panel */}
      <div className="hidden shrink-0 overflow-hidden rounded-sm bg-neutral-50 border border-neutral-100 p-3 sm:flex sm:flex-col sm:gap-1.5" style={{ width: 140, minHeight: 90 }}>
        <FileText className="size-4 text-neutral-400 mb-0.5" strokeWidth={1.5} aria-hidden="true" />
        {keyPoints.slice(0, 3).map((point, i) => (
          <p key={i} className="text-small text-neutral-600 leading-tight truncate">
            {point}
          </p>
        ))}
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        {/* Course row + badge */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-small font-medium text-neutral-900">{courseTitle}</span>
          <Badge variant="lesson">LESSON</Badge>
        </div>

        {/* Title + description */}
        <h2 className="mt-1 text-heading-3 font-semibold text-neutral-900 leading-snug">
          {lessonTitle}
        </h2>
        <p className="mt-1 text-body text-neutral-500 line-clamp-2">{description}</p>

        {/* Meta row + action */}
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
