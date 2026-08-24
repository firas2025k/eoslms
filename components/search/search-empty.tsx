import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function SearchEmpty() {
  return (
    <div className="flex flex-col items-center gap-4 py-16 text-center">
      <p className="text-display-2 font-display font-bold text-neutral-900">No results found</p>
      <p className="max-w-sm text-body text-neutral-500">
        Try different keywords, or browse the full course catalog to find what you&apos;re looking
        for.
      </p>
      <Link
        href="/courses"
        className="mt-2 inline-flex items-center gap-2 rounded-md bg-primary-500 px-4 py-2.5 text-body font-medium text-white transition-colors hover:bg-[#ea580c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400"
      >
        Browse all courses
        <ArrowRight className="size-4" strokeWidth={2} aria-hidden="true" />
      </Link>
    </div>
  );
}
