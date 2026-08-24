import { BarChart3, Bookmark, Clock, Users } from "lucide-react";
import {
  formatDuration,
  formatLessonLabel,
  formatLevel,
  formatStudentCount,
} from "@/lib/format";
import { cn } from "@/lib/cn";

type LessonHeaderProps = {
  title: string;
  overview: string | null;
  moduleIndex: number;
  lessonIndex: number;
  duration: number | null | undefined;
  level: "beginner" | "intermediate" | "advanced" | null | undefined;
  studentCount: number | null | undefined;
  className?: string;
};

export function LessonHeader({
  title,
  overview,
  moduleIndex,
  lessonIndex,
  duration,
  level,
  studentCount,
  className,
}: LessonHeaderProps) {
  return (
    <header className={cn("relative", className)}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <span className="inline-flex items-center rounded-full bg-primary-100 px-2.5 py-0.5 text-small font-semibold tracking-wide text-primary-500 uppercase">
            {formatLessonLabel(moduleIndex, lessonIndex)}
          </span>
          <h1 className="mt-3 font-display text-display-2 font-bold text-neutral-900 sm:text-display-1">
            {title}
          </h1>
          {overview ? (
            <p className="mt-3 max-w-2xl text-body-lg text-neutral-500">{overview}</p>
          ) : null}
          <div className="mt-4 flex flex-wrap items-center gap-4 text-body text-neutral-500">
            <span className="inline-flex items-center gap-1.5">
              <Clock className="size-4 text-primary-500" strokeWidth={2} aria-hidden="true" />
              {formatDuration(duration)}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <BarChart3 className="size-4 text-primary-500" strokeWidth={2} aria-hidden="true" />
              {formatLevel(level)}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Users className="size-4 text-primary-500" strokeWidth={2} aria-hidden="true" />
              {formatStudentCount(studentCount)} students
            </span>
          </div>
        </div>
        <button
          type="button"
          aria-label="Bookmark lesson"
          className="inline-flex size-10 shrink-0 items-center justify-center rounded-sm text-neutral-500 transition-colors hover:bg-neutral-50 hover:text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400"
        >
          <Bookmark className="size-5" strokeWidth={2} aria-hidden="true" />
        </button>
      </div>
    </header>
  );
}
