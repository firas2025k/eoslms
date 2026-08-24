import type { Metadata } from "next";

import { SearchPageClient } from "@/components/search/search-page-client";

type SearchPageProps = {
  searchParams: Promise<{ q?: string | string[] }>;
};

export async function generateMetadata({ searchParams }: SearchPageProps): Promise<Metadata> {
  const params = await searchParams;
  const q = Array.isArray(params.q) ? params.q[0] : (params.q ?? "");
  return {
    title: q ? `Results for "${q}" – Eos Academy` : "Search – Eos Academy",
  };
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const rawQ = Array.isArray(params.q) ? params.q[0] : (params.q ?? "");
  const initialQuery = rawQ.trim().slice(0, 300);

  return <SearchPageClient initialQuery={initialQuery} />;
}
