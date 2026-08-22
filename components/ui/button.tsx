import { cn } from "@/lib/cn";

const variants = {
  primary:
    "bg-primary-500 text-white hover:bg-[#ea580c] disabled:bg-primary-200 disabled:text-white/80",
  secondary:
    "bg-white text-primary-500 border border-primary-500 hover:bg-primary-100 disabled:border-primary-200 disabled:text-primary-200 disabled:bg-white",
  tertiary:
    "bg-white text-neutral-900 border border-neutral-200 hover:bg-neutral-50 disabled:text-neutral-300 disabled:border-neutral-200",
  text: "bg-transparent text-primary-500 hover:text-[#ea580c] disabled:text-primary-200 px-0",
} as const;

const sizes = {
  lg: "px-4",
  md: "px-3",
} as const;

type ButtonProps = React.ComponentProps<"button"> & {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
};

export function Button({
  className,
  variant = "primary",
  size = "lg",
  type = "button",
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex h-11 items-center justify-center gap-2 rounded-md text-body font-medium transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2",
        "disabled:pointer-events-none disabled:cursor-not-allowed",
        variants[variant],
        variant !== "text" && sizes[size],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
