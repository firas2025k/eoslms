"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Header } from "@/components/nav/header";
import { SearchInput } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { VideoResultCard } from "@/components/search/video-result-card";
import { LessonResultCard } from "@/components/search/lesson-result-card";
import { SearchEmpty } from "@/components/search/search-empty";
import type { SearchResponse, SearchResult } from "@/lib/search/schema";

type SortKey = "relevant" | "course";

function sortResults(results: SearchResult[], sortKey: SortKey): SearchResult[] {
  if (sortKey === "course") {
    return [...results].sort((a, b) => a.courseTitle.localeCompare(b.courseTitle));
  }
  return results; // original LLM-ranked order
}

type Props = { initialQuery: string };

export function SearchPageClient({ initialQuery }: Props) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [sort, setSort] = useState<SortKey>("relevant");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [response, setResponse] = useState<SearchResponse | null>(null);

  // Run search when initialQuery changes (URL navigation) or on mount if non-empty.
  const prevQuery = useRef<string | null>(null);
  useEffect(() => {
    if (!initialQuery || initialQuery === prevQuery.current) return;
    prevQuery.current = initialQuery;
    setQuery(initialQuery);
    runSearch(initialQuery);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQuery]);

  async function runSearch(q: string) {
    const trimmed = q.trim();
    if (!trimmed) return;

    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: trimmed }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError((data as { error?: string }).error ?? "Search failed. Please try again.");
      } else {
        setResponse(data as SearchResponse);
      }
    } catch {
      setError("Search failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;
    router.push(`/search?q=${encodeURIComponent(trimmed)}`);
    // The URL change triggers the initialQuery prop update in the RSC,
    // which re-renders this client component and fires the effect.
  }

  const sorted = response ? sortResults(response.results, sort) : [];
  const hasResults = sorted.length > 0;
  const isIdle = !loading && !response && !error;

  return (
    <div
      className="flex min-h-screen flex-col"
      style={{ backgroundColor: "var(--color-neutral-50)" }}
    >
      <Header activeHref="/courses" showSearch={false} className="relative z-10 bg-white" />

      <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-10">
        {/* Page header */}
        <div className="mb-8">
          <span className="text-small font-semibold tracking-widest text-primary-500 uppercase">
            Search Results
          </span>
          <h1 className="mt-1 font-display text-display-2 font-bold text-neutral-900">
            {initialQuery ? (
              <>
                Results for{" "}
                <span className="text-primary-500">&ldquo;{initialQuery}&rdquo;</span>
              </>
            ) : (
              "Search"
            )}
          </h1>
          {response && (
            <p className="mt-1 text-body text-neutral-500">
              Found {response.resultCount} result
              {response.resultCount !== 1 ? "s" : ""} across {response.courseCount} course
              {response.courseCount !== 1 ? "s" : ""}
            </p>
          )}
        </div>

        {/* Search form */}
        <form onSubmit={handleSubmit} className="mb-8" role="search" action="/search" method="GET">
          <SearchInput
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search courses, lessons, concepts…"
            aria-label="Search"
            name="q"
          />
        </form>

        {/* Sort + count row */}
        {hasResults && (
          <div className="mb-4 flex items-center justify-between gap-4">
            <p className="text-small font-medium text-neutral-500">
              {response!.resultCount} result{response!.resultCount !== 1 ? "s" : ""}
            </p>
            <div className="w-44">
              <Select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortKey)}
                aria-label="Sort results"
              >
                <option value="relevant">Most Relevant</option>
                <option value="course">Course Title</option>
              </Select>
            </div>
          </div>
        )}

        {/* States */}
        {loading && (
          <div className="flex flex-col gap-4" aria-busy="true" aria-label="Searching…">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-36 animate-pulse rounded-md bg-neutral-200"
                aria-hidden="true"
              />
            ))}
          </div>
        )}

        {error && !loading && (
          <p role="alert" className="text-body text-red-600">
            {error}
          </p>
        )}

        {!loading && !error && isIdle && (
          <p className="text-body text-neutral-500">
            Type a question or topic above to search across all courses and lessons.
          </p>
        )}

        {!loading && !error && response && !hasResults && <SearchEmpty />}

        {!loading && hasResults && (
          <ul className="flex flex-col gap-4" role="list">
            {sorted.map((result, idx) =>
              result.kind === "video" ? (
                <li key={`${result.lessonSlug}-${result.startSeconds}-${idx}`}>
                  <VideoResultCard result={result} />
                </li>
              ) : (
                <li key={`${result.lessonSlug}-lesson-${idx}`}>
                  <LessonResultCard result={result} />
                </li>
              ),
            )}
          </ul>
        )}
      </main>

      {/* Footer CTA banner */}
      <div className="bg-primary-50 border-t border-primary-100">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-6 py-6">
          <p className="text-body text-neutral-700">
            Can&apos;t find what you&apos;re looking for? Try different keywords or browse our full
            course catalog.
          </p>
          <Link
            href="/courses"
            className="inline-flex shrink-0 items-center gap-2 rounded-md bg-primary-500 px-4 py-2.5 text-body font-medium text-white transition-colors hover:bg-[#ea580c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400"
          >
            Browse all courses
            <ArrowRight className="size-4" strokeWidth={2} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </div>
  );
}
