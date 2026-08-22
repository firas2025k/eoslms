import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";

type Crumb = {
  label: string;
  href?: string;
};

type BreadcrumbsProps = {
  items: Crumb[];
  className?: string;
};

export function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumb" className={cn(className)}>
      <ol className="flex flex-wrap items-center gap-1.5 text-body text-neutral-500">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={`${item.label}-${index}`} className="inline-flex items-center gap-1.5">
              {index > 0 ? (
                <ChevronRight
                  className="size-4 shrink-0 text-neutral-300"
                  strokeWidth={2}
                  aria-hidden="true"
                />
              ) : null}
              {isLast || !item.href ? (
                <span
                  className={cn(isLast && "font-medium text-neutral-900")}
                  aria-current={isLast ? "page" : undefined}
                >
                  {item.label}
                </span>
              ) : (
                <Link
                  href={item.href}
                  className="hover:text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 rounded-xs"
                >
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
