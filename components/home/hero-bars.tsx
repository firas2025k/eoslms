import { cn } from "@/lib/cn";

const barHeights = [
  28, 44, 36, 58, 72, 48, 88, 64, 96, 70, 110, 82, 124, 90, 108, 76, 98, 68, 86,
  54, 74, 46, 62, 38, 52, 34, 42, 30,
];

type HeroBarsProps = {
  className?: string;
};

export function HeroBars({ className }: HeroBarsProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none flex h-40 w-full items-end justify-center gap-1.5 overflow-hidden opacity-70 blur-[1px] sm:h-48 sm:gap-2",
        className,
      )}
    >
      {barHeights.map((height, index) => (
        <span
          key={index}
          className="w-2 shrink-0 rounded-t-sm bg-linear-to-t from-primary-500 via-primary-300 to-transparent sm:w-2.5"
          style={{ height: `${height}%` }}
        />
      ))}
    </div>
  );
}
