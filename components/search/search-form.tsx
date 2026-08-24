"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { SearchInput } from "@/components/ui/input";

type Props = {
  placeholder?: string;
  className?: string;
};

/**
 * Search form that navigates to /search?q=… on submit.
 * Used in the home hero and anywhere a full-page search needs to be triggered.
 */
export function SearchForm({ placeholder, className }: Props) {
  const router = useRouter();
  const [value, setValue] = useState("");

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) return;
    router.push(`/search?q=${encodeURIComponent(trimmed)}`);
  }

  return (
    <form onSubmit={handleSubmit} role="search" className={className} action="/search" method="GET">
      <SearchInput
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder ?? "Ask anything about your learning…"}
        aria-label="Search courses and lessons"
        name="q"
      />
    </form>
  );
}
