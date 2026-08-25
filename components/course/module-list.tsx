"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, CheckCircle2 } from "lucide-react";
import { formatDuration, formatModuleCount } from "@/lib/format";
import { cn } from "@/lib/cn";
import type { COURSE_BY_SLUG_QUERY_RESULT } from "@/sanity.types";

type Course = NonNullable<COURSE_BY_SLUG_QUERY_RESULT>;
type Module = NonNullable<Course["modules"]>[number];

const COLLAPSED_COUNT = 6;

type ModuleListProps = {
  courseSlug: string;
  modules: Module[] | null | undefined;
  moduleCount: number | null | undefined;
  totalDuration: number | null | undefined;
  className?: string;
  completedLessonIds?: string[];
};

export function ModuleList({
  courseSlug,
  modules,
  moduleCount,
  totalDuration,
  className,
  completedLessonIds = [],
}: ModuleListProps) {
  const list = modules ?? [];
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(() => new Set());
  const [showAll, setShowAll] = useState(list.length <= COLLAPSED_COUNT);

  const visible = showAll ? list : list.slice(0, COLLAPSED_COUNT);
  const canShowMore = list.length > COLLAPSED_COUNT && !showAll;

  function toggleModule(key: string) {
    setExpandedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  return (
    <section className={cn(className)} aria-labelledby="course-content-heading">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2
          id="course-content-heading"
          className="font-display text-heading-1 font-bold text-neutral-900 sm:text-display-2"
        >
          Course Content
        </h2>
        <p className="text-body text-neutral-500">
          {formatModuleCount(moduleCount ?? list.length)}
          <span className="mx-1.5 text-neutral-300" aria-hidden="true">
            •
          </span>
          {formatDuration(totalDuration)}
        </p>
      </div>

      <ul className="mt-6 flex flex-col gap-3">
        {visible.map((mod, index) => {
          const number = index + 1;
          const open = expandedKeys.has(mod._key);
          const lessons = mod.lessons ?? [];
          const panelId = `module-panel-${mod._key}`;
          const buttonId = `module-button-${mod._key}`;

          return (
            <li
              key={mod._key}
              className="overflow-hidden rounded-md border border-neutral-200 bg-white shadow-sm"
            >
              <button
                type="button"
                id={buttonId}
                aria-expanded={open}
                aria-controls={panelId}
                onClick={() => toggleModule(mod._key)}
                className="flex w-full items-start gap-4 px-4 py-4 text-left transition-colors hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-inset sm:px-5"
              >
                <span
                  className="flex size-8 shrink-0 items-center justify-center rounded-full border border-neutral-200 text-body font-medium text-neutral-700"
                  aria-hidden="true"
                >
                  {number}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-display text-heading-3 font-bold text-neutral-900">
                    {mod.title}
                  </span>
                  {mod.summary ? (
                    <span className="mt-1 block text-body text-neutral-500">
                      {mod.summary}
                    </span>
                  ) : null}
                </span>
                <span className="flex shrink-0 items-center gap-3 pt-1 text-body text-neutral-500">
                  {formatDuration(mod.duration)}
                  <ChevronDown
                    className={cn(
                      "size-5 text-neutral-400 transition-transform",
                      open && "rotate-180",
                    )}
                    strokeWidth={2}
                    aria-hidden="true"
                  />
                </span>
              </button>

              <div
                id={panelId}
                role="region"
                aria-labelledby={buttonId}
                hidden={!open}
                className="border-t border-neutral-100"
              >
                <ul className="flex flex-col px-4 py-2 sm:px-5 sm:pl-[4.25rem]">
                  {lessons.map((lesson) => {
                    const href =
                      lesson.slug != null
                        ? `/courses/${courseSlug}/lessons/${lesson.slug}`
                        : null;
                    const completed = completedLessonIds.includes(lesson._id);
                    return (
                      <li
                        key={lesson._id}
                        className="flex items-center justify-between gap-3 border-b border-neutral-100 py-3 last:border-b-0"
                      >
                        <span className="flex min-w-0 items-center gap-2">
                          {completed ? (
                            <CheckCircle2
                              className="size-4 shrink-0 text-success"
                              strokeWidth={2}
                              aria-hidden="true"
                            />
                          ) : null}
                          {href && lesson.title ? (
                            <Link
                              href={href}
                              className="min-w-0 text-body font-medium text-neutral-900 hover:text-primary-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 rounded-xs"
                            >
                              {lesson.title}
                            </Link>
                          ) : (
                            <span className="min-w-0 text-body font-medium text-neutral-900">
                              {lesson.title}
                            </span>
                          )}
                        </span>
                        <span className="shrink-0 text-small text-neutral-500">
                          {formatDuration(lesson.duration)}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </li>
          );
        })}
      </ul>

      {canShowMore ? (
        <div className="mt-4 flex justify-center">
          <button
            type="button"
            onClick={() => setShowAll(true)}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-neutral-200 bg-white px-4 text-body font-medium text-neutral-900 transition-colors hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400"
          >
            Show all {list.length} modules
            <ChevronDown className="size-4" strokeWidth={2} aria-hidden="true" />
          </button>
        </div>
      ) : null}
    </section>
  );
}
