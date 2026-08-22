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
        width="20"
        height="18"
        viewBox="0 0 20 18"
        fill="none"
        aria-hidden="true"
        className="shrink-0 text-primary-500"
      >
        <path
          d="M10 18L0.5 1.5H19.5L10 18Z"
          fill="currentColor"
        />
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
    <Link href={href} className="inline-flex focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2 rounded-sm">
      {mark}
    </Link>
  );
}
