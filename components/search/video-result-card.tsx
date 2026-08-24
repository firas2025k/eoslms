import Link from "next/link";
import { Play } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { formatSeconds } from "@/lib/format";
import type { VideoResult } from "@/lib/search/schema";
import { cn } from "@/lib/cn";

type Props = { result: VideoResult; className?: string };

export function VideoResultCard({ result, className }: Props) {
  const {
    courseSlug,
    courseTitle,
    lessonSlug,
    lessonTitle,
    moduleTitle,
    moduleIndex,
    lessonIndex,
    description,
    thumbnailUrl,
    clipDurationLabel,
    startSeconds,
  } = result;

  const lessonHref = `/courses/${courseSlug}/lessons/${lessonSlug}?t=${startSeconds}`;
  const watchLabel = `Watch from ${formatSeconds(startSeconds)}`;

  return (
    <article
      className={cn(
        "flex gap-4 rounded-md border border-neutral-200 bg-white p-5 shadow-sm",
        className,
      )}
    >
      {/* Thumbnail / video preview */}
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
          <div className="flex h-full w-full items-center justify-center bg-neutral-900" />
        )}
        {/* Play overlay */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex size-9 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
            <Play className="size-5 fill-white text-white" strokeWidth={0} aria-hidden="true" />
          </div>
        </div>
        {/* Duration chip */}
        {clipDurationLabel && (
          <span className="absolute right-1.5 bottom-1.5 rounded-xs bg-black/70 px-1.5 py-0.5 text-small font-medium text-white">
            {clipDurationLabel}
          </span>
        )}
      </Link>

      {/* Content */}
      <div className="min-w-0 flex-1">
        {/* Course row + badge */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-small font-medium text-neutral-900">{courseTitle}</span>
          <Badge variant="video">VIDEO</Badge>
        </div>

        {/* Title + description */}
        <h2 className="mt-1 text-heading-3 font-semibold text-neutral-900 leading-snug">
          {lessonTitle}
        </h2>
        <p className="mt-1 text-body text-neutral-500 line-clamp-2">{description}</p>

        {/* Meta row + action */}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <p className="text-small text-neutral-400">
            Lesson {moduleIndex}.{lessonIndex}
            <span className="mx-1.5 text-neutral-300">·</span>
            {moduleTitle}
          </p>
          <Link
            href={lessonHref}
            className="inline-flex items-center gap-1 text-small font-medium text-primary-500 hover:text-[#ea580c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 rounded-xs"
          >
            <Play className="size-3.5 fill-current" strokeWidth={0} aria-hidden="true" />
            {watchLabel}
          </Link>
        </div>
      </div>
    </article>
  );
}
