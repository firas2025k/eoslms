import { cn } from "@/lib/cn";

const variants = {
  video: "bg-video-bg text-video",
  lesson: "bg-lesson-bg text-lesson",
  popular: "bg-popular-bg text-popular",
} as const;

type BadgeProps = React.ComponentProps<"span"> & {
  variant: keyof typeof variants;
};

export function Badge({ className, variant, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-xs px-2 py-0.5 text-small font-semibold tracking-wide uppercase",
        variants[variant],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}
