import Link from "next/link";
import { cn } from "@/lib/cn";

type LogoProps = {
  className?: string;
  href?: string;
};

export function Logo({ className, href = "/" }: LogoProps) {
  const mark = (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <svg
        width="22"
        height="20"
        viewBox="0 0 22 20"
        fill="none"
        aria-hidden="true"
        className="shrink-0 text-primary-500"
      >
        {/* Three-segment downward triangle mark */}
        <path d="M11 20L4 8H11L11 20Z" fill="currentColor" opacity="0.55" />
        <path d="M11 20L18 8H11L11 20Z" fill="currentColor" opacity="0.85" />
        <path d="M4 8L11 0L18 8H4Z" fill="currentColor" />
      </svg>
      <span className="text-body-lg font-semibold tracking-tight text-neutral-900">
        Vertex
      </span>
    </span>
  );

  if (!href) {
    return mark;
  }

  return (
    <Link
      href={href}
      className="inline-flex rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2"
    >
      {mark}
    </Link>
  );
}
