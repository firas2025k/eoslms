import { BarChart3, Clock, Download, FileText, Layers } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/cn";

const cardShell =
  "rounded-md border border-neutral-200 bg-white p-5 shadow-md";

type CourseCardProps = {
  title: string;
  description: string;
  level: string;
  duration: string;
  moduleCount: string;
  thumbnailLabel?: string;
  className?: string;
};

export function CourseCard({
  title,
  description,
  level,
  duration,
  moduleCount,
  thumbnailLabel = "N",
  className,
}: CourseCardProps) {
  return (
    <article className={cn(cardShell, "flex flex-col gap-4", className)}>
      <div className="flex size-14 items-center justify-center rounded-sm bg-neutral-900 text-heading-2 font-semibold text-white">
        {thumbnailLabel}
      </div>
      <div className="flex flex-col gap-2">
        <h3 className="text-heading-1 font-semibold text-neutral-900">{title}</h3>
        <p className="text-body text-neutral-500">{description}</p>
      </div>
      <div className="mt-auto flex flex-wrap items-center gap-4 border-t border-neutral-100 pt-4 text-small text-neutral-500">
        <span className="inline-flex items-center gap-1.5">
          <BarChart3 className="size-4" strokeWidth={2} aria-hidden="true" />
          {level}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Clock className="size-4" strokeWidth={2} aria-hidden="true" />
          {duration}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Layers className="size-4" strokeWidth={2} aria-hidden="true" />
          {moduleCount}
        </span>
      </div>
    </article>
  );
}

type LessonCardProps = {
  variant: "video" | "lesson";
  title: string;
  description: string;
  lessonLabel: string;
  duration: string;
  actionLabel: string;
  className?: string;
};

export function LessonCard({
  variant,
  title,
  description,
  lessonLabel,
  duration,
  actionLabel,
  className,
}: LessonCardProps) {
  return (
    <article className={cn(cardShell, "flex flex-col gap-3", className)}>
      <Badge variant={variant}>{variant === "video" ? "VIDEO" : "LESSON"}</Badge>
      <div className="flex flex-col gap-1.5">
        <h3 className="text-heading-3 font-medium text-neutral-900">{title}</h3>
        <p className="text-body text-neutral-500">{description}</p>
      </div>
      <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-2">
        <p className="text-small text-neutral-500">
          {lessonLabel}
          <span className="mx-1.5 text-neutral-300">·</span>
          {duration}
        </p>
        <a
          href="#"
          className="text-body font-medium text-primary-500 hover:text-[#ea580c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 rounded-xs"
        >
          {actionLabel}
        </a>
      </div>
    </article>
  );
}

type ResourceCardProps = {
  title: string;
  description: string;
  fileMeta: string;
  className?: string;
};

export function ResourceCard({
  title,
  description,
  fileMeta,
  className,
}: ResourceCardProps) {
  return (
    <article
      className={cn(
        cardShell,
        "flex items-start gap-4",
        className,
      )}
    >
      <div className="flex size-11 shrink-0 items-center justify-center rounded-sm bg-neutral-100 text-neutral-700">
        <FileText className="size-5" strokeWidth={2} aria-hidden="true" />
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="text-heading-3 font-medium text-neutral-900">{title}</h3>
        <p className="mt-1 text-body text-neutral-500">{description}</p>
        <p className="mt-2 text-small text-neutral-500">{fileMeta}</p>
      </div>
      <a
        href="#"
        aria-label={`Download ${title}`}
        className="inline-flex size-9 shrink-0 items-center justify-center rounded-sm text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400"
      >
        <Download className="size-5" strokeWidth={2} aria-hidden="true" />
      </a>
    </article>
  );
}
