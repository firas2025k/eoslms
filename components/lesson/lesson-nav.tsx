"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { buttonClassName } from "@/components/ui/button";
import { formatDuration } from "@/lib/format";
import { saveProgress } from "@/lib/progress-client";
import { cn } from "@/lib/cn";

export type LessonNavItem = {
  slug: string;
  title: string;
  duration: number | null;
  href: string;
};

type LessonNavProps = {
  previous: LessonNavItem | null;
  next: LessonNavItem | null;
  className?: string;
  /** When set, Next (or completing the last lesson) POSTs completed: true first. */
  completeLessonId?: string | null;
};

export function LessonNav({
  previous,
  next,
  className,
  completeLessonId,
}: LessonNavProps) {
  const router = useRouter();

  async function goNext(href: string) {
    if (completeLessonId) {
      await saveProgress({ lessonId: completeLessonId, completed: true });
    }
    router.push(href);
    router.refresh();
  }

  return (
    <nav
      aria-label="Lesson navigation"
      className={cn(
        "fixed inset-x-0 bottom-0 z-20 border-t border-neutral-200 bg-white/95 backdrop-blur-sm",
        className,
      )}
    >
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-6 py-4">
        <div className="min-w-0 flex-1">
          {previous ? (
            <div className="flex min-w-0 items-center gap-3">
              <Link
                href={previous.href}
                className={buttonClassName({
                  variant: "tertiary",
                  size: "md",
                  className: "shrink-0",
                })}
              >
                <ArrowLeft className="size-4" strokeWidth={2} aria-hidden="true" />
                <span className="hidden sm:inline">Previous Lesson</span>
                <span className="sm:hidden">Prev</span>
              </Link>
              <div className="hidden min-w-0 md:block">
                <p className="truncate text-body font-medium text-neutral-900">
                  {previous.title}
                </p>
                <p className="text-small text-neutral-500">
                  {formatDuration(previous.duration)}
                </p>
              </div>
            </div>
          ) : (
            <span className="sr-only">No previous lesson</span>
          )}
        </div>

        <div className="flex min-w-0 flex-1 items-center justify-end gap-3">
          {next ? (
            <>
              <div className="hidden min-w-0 text-right md:block">
                <p className="truncate text-body font-medium text-neutral-900">
                  {next.title}
                </p>
                <p className="text-small text-neutral-500">
                  {formatDuration(next.duration)}
                </p>
              </div>
              {completeLessonId ? (
                <button
                  type="button"
                  onClick={() => void goNext(next.href)}
                  className={buttonClassName({
                    variant: "primary",
                    size: "md",
                    className: "shrink-0",
                  })}
                >
                  <span className="hidden sm:inline">Next Lesson</span>
                  <span className="sm:hidden">Next</span>
                  <ArrowRight className="size-4" strokeWidth={2} aria-hidden="true" />
                </button>
              ) : (
                <Link
                  href={next.href}
                  className={buttonClassName({
                    variant: "primary",
                    size: "md",
                    className: "shrink-0",
                  })}
                >
                  <span className="hidden sm:inline">Next Lesson</span>
                  <span className="sm:hidden">Next</span>
                  <ArrowRight className="size-4" strokeWidth={2} aria-hidden="true" />
                </Link>
              )}
            </>
          ) : (
            <span className="sr-only">No next lesson</span>
          )}
        </div>
      </div>
    </nav>
  );
}
