import "server-only";

import {
  buildSearchResult,
  lessonHitsFromRows,
  mergeHits,
  type SearchLessonRow,
  videoHitsFromRows,
  type VideoHitRow,
} from "@/lib/search/ground";
import type {SearchResponse} from "@/lib/search/schema";
import {queryToSearchTerms} from "@/lib/search/terms";
import {client} from "@/sanity/lib/client";
import {
  SEARCH_LESSONS_BY_URLS_QUERY,
  SEARCH_LESSONS_QUERY,
  SEARCH_VIDEO_HITS_QUERY,
} from "@/sanity/lib/queries";

const MAX_RESULTS = 100;

function emptyResponse(query: string): SearchResponse {
  return {
    query,
    resultCount: 0,
    courseCount: 0,
    results: [],
  };
}

export async function runSearch(query: string): Promise<SearchResponse> {
  const terms = queryToSearchTerms(query);
  if (terms.length === 0) return emptyResponse(query);

  const [lessonRows, videoRows] = await Promise.all([
    client.fetch<SearchLessonRow[]>(SEARCH_LESSONS_QUERY, {terms}, {cache: "no-store"}),
    client.fetch<VideoHitRow[]>(SEARCH_VIDEO_HITS_QUERY, {terms}, {cache: "no-store"}),
  ]);

  const videoUrls = [
    ...new Set(videoRows.map((row) => row.url).filter((url): url is string => Boolean(url))),
  ];

  const videoLessons =
    videoUrls.length > 0
      ? await client.fetch<SearchLessonRow[]>(
          SEARCH_LESSONS_BY_URLS_QUERY,
          {urls: videoUrls},
          {cache: "no-store"},
        )
      : [];

  const lessonsById = new Map<string, SearchLessonRow>();
  for (const row of lessonRows) lessonsById.set(row._id, row);

  const lessonsByUrl = new Map<string, SearchLessonRow>();
  for (const row of videoLessons) {
    if (row.videoUrl) lessonsByUrl.set(row.videoUrl, row);
    lessonsById.set(row._id, row);
  }

  const mergedHits = mergeHits([
    ...lessonHitsFromRows(lessonRows),
    ...videoHitsFromRows(videoRows, lessonsByUrl, terms),
  ]).slice(0, MAX_RESULTS);

  const results = mergedHits
    .map((hit) => {
      const lesson = lessonsById.get(hit.lessonId);
      if (!lesson) return null;
      return buildSearchResult(hit, lesson);
    })
    .filter((result): result is NonNullable<typeof result> => result !== null);

  const courseCount = new Set(results.map((result) => result.courseSlug)).size;

  return {
    query,
    resultCount: results.length,
    courseCount,
    results,
  };
}
