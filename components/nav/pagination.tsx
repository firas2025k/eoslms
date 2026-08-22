import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";

type PaginationProps = {
  page: number;
  totalPages: number;
  className?: string;
};

function pageItems(page: number, totalPages: number): (number | "ellipsis")[] {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const items: (number | "ellipsis")[] = [1];
  if (page > 3) items.push("ellipsis");

  const start = Math.max(2, page - 1);
  const end = Math.min(totalPages - 1, page + 1);
  for (let i = start; i <= end; i += 1) {
    items.push(i);
  }

  if (page < totalPages - 2) items.push("ellipsis");
  items.push(totalPages);
  return items;
}

export function Pagination({ page, totalPages, className }: PaginationProps) {
  const items = pageItems(page, totalPages);
  const atStart = page <= 1;
  const atEnd = page >= totalPages;

  return (
    <nav aria-label="Pagination" className={cn("inline-flex items-center gap-1", className)}>
      <button
        type="button"
        disabled={atStart}
        aria-label="Previous page"
        className="inline-flex size-9 items-center justify-center rounded-sm text-neutral-500 hover:bg-neutral-50 disabled:pointer-events-none disabled:text-neutral-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400"
      >
        <ChevronLeft className="size-5" strokeWidth={2} aria-hidden="true" />
      </button>
      {items.map((item, index) =>
        item === "ellipsis" ? (
          <span
            key={`ellipsis-${index}`}
            className="inline-flex size-9 items-center justify-center text-body text-neutral-500"
            aria-hidden="true"
          >
            …
          </span>
        ) : (
          <button
            key={item}
            type="button"
            aria-label={`Page ${item}`}
            aria-current={item === page ? "page" : undefined}
            className={cn(
              "inline-flex size-9 items-center justify-center rounded-sm text-body font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400",
              item === page
                ? "bg-primary-500 text-white"
                : "text-neutral-700 hover:bg-neutral-50",
            )}
          >
            {item}
          </button>
        ),
      )}
      <button
        type="button"
        disabled={atEnd}
        aria-label="Next page"
        className="inline-flex size-9 items-center justify-center rounded-sm text-neutral-500 hover:bg-neutral-50 disabled:pointer-events-none disabled:text-neutral-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400"
      >
        <ChevronRight className="size-5" strokeWidth={2} aria-hidden="true" />
      </button>
    </nav>
  );
}
