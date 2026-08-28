import { Search } from "lucide-react";
import { cn } from "@/lib/cn";

const fieldClass =
  "h-11 w-full rounded-md border border-neutral-200 bg-white px-4 text-body-lg text-neutral-900 placeholder:text-neutral-500 transition-colors focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-400/30 disabled:cursor-not-allowed disabled:bg-neutral-50 disabled:text-neutral-300";

export { fieldClass };

type InputProps = React.ComponentProps<"input">;

export function Input({ className, ...props }: InputProps) {
  return <input className={cn(fieldClass, className)} {...props} />;
}

type SearchInputProps = Omit<InputProps, "type">;

export function SearchInput({
  className,
  placeholder = "Search courses, lessons…",
  ...props
}: SearchInputProps) {
  return (
    <div className={cn("relative w-full", className)}>
      <Search
        className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-neutral-500"
        strokeWidth={2}
        aria-hidden="true"
      />
      <input
        type="search"
        placeholder={placeholder}
        aria-keyshortcuts="Meta+K"
        className={cn(fieldClass, "pr-14 pl-10")}
        {...props}
      />
      <kbd className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 rounded-xs border border-neutral-200 bg-neutral-50 px-1.5 py-0.5 text-small text-neutral-500">
        ⌘ K
      </kbd>
    </div>
  );
}
