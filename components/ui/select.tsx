import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";

type SelectProps = React.ComponentProps<"select">;

export function Select({ className, children, ...props }: SelectProps) {
  return (
    <div className="relative w-full">
      <select
        className={cn(
          "h-11 w-full appearance-none rounded-md border border-neutral-200 bg-white px-4 pr-10 text-body-lg text-neutral-900 transition-colors",
          "focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-400/30",
          "disabled:cursor-not-allowed disabled:bg-neutral-50 disabled:text-neutral-300",
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        className="pointer-events-none absolute top-1/2 right-3 size-5 -translate-y-1/2 text-neutral-500"
        strokeWidth={2}
        aria-hidden="true"
      />
    </div>
  );
}
