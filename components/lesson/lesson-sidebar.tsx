"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ChevronDown, CheckCircle2, Circle, Play } from "lucide-react";
import { CourseCoverThumb } from "@/components/lesson/course-cover-thumb";
import { Progress } from "@/components/ui/progress";
import { formatDuration } from "@/lib/format";
import { cn } from "@/lib/cn";
import type { LESSON_BY_SLUG_QUERY_RESULT } from "@/sanity.types";

type Course = NonNullable<NonNullable<LESSON_BY_SLUG_QUERY_RESULT>["course"]>;
type Module = NonNullable<Course["modules"]>[number];

type LessonSidebarProps = {
  course: Course;
  courseSlug: string;
  currentLessonSlug: string;
  currentModuleKey: string;
  className?: string;
  progressPercent?: number;
  completedLessonIds?: string[];
};

export function LessonSidebar({
  course,
  courseSlug,
  currentLessonSlug,
  currentModuleKey,
  className,
  progressPercent = 0,
  completedLessonIds = [],
}: LessonSidebarProps) {
  const modules = course.modules ?? [];
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(
    () => new Set([currentModuleKey]),
  );

  function toggleModule(key: string) {
    setExpandedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  return (
    <aside className={cn("flex flex-col gap-5", className)}>
      <Link
        href={`/courses/${courseSlug}`}
        className="inline-flex items-center gap-1.5 text-body font-medium text-neutral-500 transition-colors hover:text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 rounded-xs"
      >
        <ArrowLeft className="size-4" strokeWidth={2} aria-hidden="true" />
        Back to course
      </Link>

      <div className="rounded-md border border-neutral-200 bg-white p-4 shadow-sm">
        <div className="flex items-start gap-3">
          <CourseCoverThumb coverImage={course.coverImage} title={course.title} />
          <div className="min-w-0 flex-1">
            <p className="font-display text-heading-3 font-bold text-neutral-900 leading-snug">
              {course.title ?? "Course"}
            </p>
            <Progress value={progressPercent} className="mt-3" />
          </div>
        </div>
      </div>

      <nav aria-label="Course curriculum" className="flex flex-col gap-1">
        {modules.map((mod, moduleIndex) => (
          <ModuleRow
            key={mod._key}
            mod={mod}
            moduleNumber={moduleIndex + 1}
            courseSlug={courseSlug}
            currentLessonSlug={currentLessonSlug}
            open={expandedKeys.has(mod._key)}
            onToggle={() => toggleModule(mod._key)}
            completedLessonIds={completedLessonIds}
          />
        ))}
      </nav>
    </aside>
  );
}

function ModuleRow({
  mod,
  moduleNumber,
  courseSlug,
  currentLessonSlug,
  open,
  onToggle,
  completedLessonIds,
}: {
  mod: Module;
  moduleNumber: number;
  courseSlug: string;
  currentLessonSlug: string;
  open: boolean;
  onToggle: () => void;
  completedLessonIds: string[];
}) {
  const lessons = mod.lessons ?? [];
  const hasCurrent = lessons.some((l) => l.slug === currentLessonSlug);
  const panelId = `lesson-module-panel-${mod._key}`;
  const buttonId = `lesson-module-button-${mod._key}`;

  return (
    <div
      className={cn(
        "overflow-hidden rounded-md",
        hasCurrent && "bg-primary-100/60",
      )}
    >
      <button
        type="button"
        id={buttonId}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={onToggle}
        className={cn(
          "flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors",
          "hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-inset",
          hasCurrent && "hover:bg-primary-100/80",
        )}
      >
        <span
          className={cn(
            "flex size-7 shrink-0 items-center justify-center rounded-full text-small font-semibold",
            hasCurrent
              ? "bg-primary-500 text-white"
              : "bg-neutral-100 text-neutral-700",
          )}
        >
          {moduleNumber}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-body font-medium text-neutral-900">
            {mod.title ?? `Module ${moduleNumber}`}
          </span>
        </span>
        <span className="shrink-0 text-small text-neutral-500">
          {formatDuration(mod.duration)}
        </span>
        <ChevronDown
          className={cn(
            "size-4 shrink-0 text-neutral-400 transition-transform",
            open && "rotate-180",
          )}
          strokeWidth={2}
          aria-hidden="true"
        />
      </button>

      {open ? (
        <ul id={panelId} role="region" aria-labelledby={buttonId} className="pb-2 pl-4 pr-2">
          {lessons.map((lesson) => {
            const isCurrent = lesson.slug === currentLessonSlug;
            const isCompleted = completedLessonIds.includes(lesson._id);
            const href =
              lesson.slug != null
                ? `/courses/${courseSlug}/lessons/${lesson.slug}`
                : null;

            const content = (
              <>
                <span className="mt-0.5 shrink-0">
                  {isCurrent ? (
                    <Play
                      className="size-4 fill-primary-500 text-primary-500"
                      strokeWidth={0}
                      aria-hidden="true"
                    />
                  ) : isCompleted ? (
                    <CheckCircle2
                      className="size-4 text-success"
                      strokeWidth={2}
                      aria-hidden="true"
                    />
                  ) : (
                    <Circle
                      className="size-4 text-neutral-300"
                      strokeWidth={2}
                      aria-hidden="true"
                    />
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span
                    className={cn(
                      "block text-body",
                      isCurrent
                        ? "font-medium text-primary-500"
                        : "text-neutral-700",
                    )}
                  >
                    {lesson.title ?? "Lesson"}
                  </span>
                  {isCurrent ? (
                    <span className="mt-0.5 block text-small font-medium text-video">
                      Now playing
                    </span>
                  ) : null}
                </span>
              </>
            );

            return (
              <li key={lesson._id}>
                {isCurrent || !href ? (
                  <div
                    className="flex items-start gap-2.5 rounded-sm px-2 py-2"
                    aria-current={isCurrent ? "page" : undefined}
                  >
                    {content}
                  </div>
                ) : (
                  <Link
                    href={href}
                    className="flex items-start gap-2.5 rounded-sm px-2 py-2 transition-colors hover:bg-white/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400"
                  >
                    {content}
                  </Link>
                )}
              </li>
            );
          })}
          {lessons.length === 0 ? (
            <li className="px-2 py-2 text-small text-neutral-500">No lessons yet</li>
          ) : null}
        </ul>
      ) : null}
    </div>
  );
}
