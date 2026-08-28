import { ContinueLearningCta } from "@/components/course/continue-learning-cta";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/cn";

type CourseProgressBarProps = {
  continueHref: string | null;
  isSignedIn?: boolean;
  value: number;
  className?: string;
};

export function CourseProgressBar({
  continueHref,
  isSignedIn = false,
  value,
  className,
}: CourseProgressBarProps) {
  return (
    <div
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 border-t border-neutral-200 bg-white/95 backdrop-blur-sm",
        className,
      )}
    >
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-[radial-gradient(ellipse_at_bottom_left,rgba(249,115,22,0.18),transparent_55%),radial-gradient(ellipse_at_bottom_right,rgba(251,146,60,0.14),transparent_50%)]"
        aria-hidden="true"
      />
      <div className="relative mx-auto flex w-full max-w-5xl flex-col gap-4 px-6 py-4 sm:flex-row sm:items-center sm:gap-8">
        <div className="min-w-0 flex-1">
          <p className="text-small font-medium text-neutral-500">Your Progress</p>
          <p className="mt-0.5 text-body font-medium text-neutral-900">
            {Math.min(100, Math.max(0, value))}% complete
          </p>
          <Progress value={value} showLabel={false} className="mt-2 max-w-md" />
        </div>
        {continueHref ? (
          <ContinueLearningCta
            href={continueHref}
            isSignedIn={isSignedIn}
            className="w-full shrink-0 sm:w-auto"
          />
        ) : null}
      </div>
    </div>
  );
}
