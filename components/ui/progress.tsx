import { cn } from "@/lib/cn";

type ProgressProps = {
  value: number;
  showLabel?: boolean;
  className?: string;
};

export function Progress({ value, showLabel = true, className }: ProgressProps) {
  const clamped = Math.min(100, Math.max(0, value));

  return (
    <div className={cn("w-full", className)}>
      <div
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        className="h-2 w-full overflow-hidden rounded-full bg-neutral-200"
      >
        <div
          className="h-full rounded-full bg-primary-500 transition-[width]"
          style={{ width: `${clamped}%` }}
        />
      </div>
      {showLabel ? (
        <p className="mt-2 text-small text-neutral-500">{clamped}% complete</p>
      ) : null}
    </div>
  );
}
