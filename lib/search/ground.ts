import "server-only";

import { firstNotesParagraph, formatDuration } from "@/lib/format";
import type { LessonResult, SearchResult, VideoResult } from "@/lib/search/schema";
import { urlFor } from "@/sanity/lib/image";

type SanityImage = {
  asset?: {_id?: string; url?: string} | null;
  hotspot?: unknown;
  crop?: unknown;
  alt?: string | null;
} | null;

export type SearchLessonRow = {
  _id: string;
  title?: string | null;
  slug?: string | null;
  duration?: number | null;
  thumbnail?: SanityImage;
  keyPoints?: string[] | null;
  notes?: Array<{
    _type: string;
    style?: string;
    children?: Array<{text?: string | null}> | null;
  }> | null;
  videoUrl?: string | null;
  titleTermHits?: number;
  notesTermHits?: number;
  keyPointTermHits?: number;
  course?: {
    title?: string | null;
    slug?: string | null;
    coverImage?: SanityImage;
    modules?: Array<{
      title?: string | null;
      lessons?: Array<{_id: string}> | null;
    }> | null;
  } | null;
};

export type VideoHitRow = {
  url?: string | null;
  chapterHits?: Array<{
    startSeconds?: number;
    label?: string | null;
  }> | null;
  chunkHits?: Array<{
    startSeconds?: number;
    text?: string | null;
  }> | null;
};

export type ScoredHit =
  | {
      kind: "lesson";
      lessonId: string;
      score: number;
    }
  | {
      kind: "video";
      lessonId: string;
      score: number;
      startSeconds: number;
      description: string;
    };

function imageUrl(image: SanityImage | undefined, width: number, height: number): string | null {
  const assetId = image?.asset?._id;
  if (!assetId) return null;
  return urlFor({
    _type: "image",
    asset: {_ref: assetId},
    hotspot: image?.hotspot ?? undefined,
    crop: image?.crop ?? undefined,
  })
    .width(width)
    .height(height)
    .fit("crop")
    .url();
}

export function lessonPosition(
  course: SearchLessonRow["course"],
  lessonId: string,
): {moduleIndex: number; lessonIndex: number; moduleTitle: string} {
  const modules = course?.modules ?? [];
  for (let moduleIndex = 0; moduleIndex < modules.length; moduleIndex++) {
    const lessons = modules[moduleIndex]?.lessons ?? [];
    for (let lessonIndex = 0; lessonIndex < lessons.length; lessonIndex++) {
      if (lessons[lessonIndex]?._id === lessonId) {
        return {
          moduleIndex: moduleIndex + 1,
          lessonIndex: lessonIndex + 1,
          moduleTitle: modules[moduleIndex]?.title ?? "",
        };
      }
    }
  }
  return {moduleIndex: 1, lessonIndex: 1, moduleTitle: ""};
}

export function scoreLessonRow(row: SearchLessonRow): number {
  const titleHits = row.titleTermHits ?? 0;
  const notesHits = row.notesTermHits ?? 0;
  const keyPointHits = row.keyPointTermHits ?? 0;

  if (titleHits > 0) return 100 + titleHits * 10 + notesHits + keyPointHits;
  if (keyPointHits > 0) return 60 + keyPointHits * 8 + notesHits;
  if (notesHits > 0) return 40 + notesHits * 5;
  return 0;
}

function termStem(term: string): string {
  return term.endsWith("*") ? term.slice(0, -1) : term;
}

export function countTermMatches(text: string, terms: string[]): number {
  const lower = text.toLowerCase();
  return terms.filter((term) => lower.includes(termStem(term))).length;
}

export function scoreVideoHit(
  text: string,
  kind: "chapter" | "chunk",
  terms: string[],
): number {
  const termHits = Math.max(1, countTermMatches(text, terms));
  return kind === "chapter" ? 75 + termHits * 8 : 35 + termHits * 5;
}

export function lessonHitsFromRows(rows: SearchLessonRow[]): ScoredHit[] {
  return rows
    .map((row) => ({
      kind: "lesson" as const,
      lessonId: row._id,
      score: scoreLessonRow(row),
    }))
    .filter((hit) => hit.score > 0);
}

export function videoHitsFromRows(
  videoRows: VideoHitRow[],
  lessonsByUrl: Map<string, SearchLessonRow>,
  terms: string[],
): ScoredHit[] {
  const hits: ScoredHit[] = [];

  for (const video of videoRows) {
    const url = video.url ?? "";
    const lesson = lessonsByUrl.get(url);
    if (!lesson?._id) continue;

    const chapterHit = [...(video.chapterHits ?? [])].sort((a, b) => {
      const scoreA = scoreVideoHit(a.label ?? "", "chapter", terms);
      const scoreB = scoreVideoHit(b.label ?? "", "chapter", terms);
      return scoreB - scoreA;
    })[0];
    if (chapterHit && typeof chapterHit.startSeconds === "number") {
      hits.push({
        kind: "video",
        lessonId: lesson._id,
        score: scoreVideoHit(chapterHit.label ?? "", "chapter", terms),
        startSeconds: chapterHit.startSeconds,
        description: chapterHit.label?.trim() || "Matched chapter",
      });
      continue;
    }

    const chunkHit = [...(video.chunkHits ?? [])].sort((a, b) => {
      const scoreA = scoreVideoHit(a.text ?? "", "chunk", terms);
      const scoreB = scoreVideoHit(b.text ?? "", "chunk", terms);
      return scoreB - scoreA;
    })[0];
    if (chunkHit && typeof chunkHit.startSeconds === "number") {
      const snippet = chunkHit.text?.trim().replace(/\s+/g, " ") ?? "";
      hits.push({
        kind: "video",
        lessonId: lesson._id,
        score: scoreVideoHit(snippet, "chunk", terms),
        startSeconds: chunkHit.startSeconds,
        description: snippet.slice(0, 160) || "Matched transcript moment",
      });
    }
  }

  return hits;
}

export function mergeHits(hits: ScoredHit[]): ScoredHit[] {
  const byLesson = new Map<string, ScoredHit>();

  for (const hit of hits.sort((a, b) => b.score - a.score)) {
    const existing = byLesson.get(hit.lessonId);
    if (!existing) {
      byLesson.set(hit.lessonId, hit);
      continue;
    }

    if (hit.kind === "video" && existing.kind === "lesson" && hit.score >= existing.score) {
      byLesson.set(hit.lessonId, hit);
    }
  }

  return [...byLesson.values()].sort((a, b) => b.score - a.score);
}

export function buildSearchResult(
  hit: ScoredHit,
  lesson: SearchLessonRow,
): SearchResult | null {
  const courseSlug = lesson.course?.slug;
  const lessonSlug = lesson.slug;
  const courseTitle = lesson.course?.title;
  if (!courseSlug || !lessonSlug || !courseTitle || !lesson.title) return null;

  const {moduleIndex, lessonIndex, moduleTitle} = lessonPosition(lesson.course, lesson._id);
  const courseIconUrl = imageUrl(lesson.course?.coverImage, 112, 112);
  const thumbnailUrl = imageUrl(lesson.thumbnail, 280, 180);

  if (hit.kind === "video") {
    const video: VideoResult = {
      kind: "video",
      courseTitle,
      courseSlug,
      courseIconUrl,
      lessonTitle: lesson.title,
      lessonSlug,
      moduleTitle,
      moduleIndex,
      lessonIndex,
      description: hit.description,
      thumbnailUrl,
      clipDurationLabel: formatDuration(lesson.duration),
      startSeconds: hit.startSeconds,
    };
    return video;
  }

  const description =
    firstNotesParagraph(
      lesson.notes as Parameters<typeof firstNotesParagraph>[0],
    ) ??
    (lesson.keyPoints ?? []).slice(0, 1).join(" ") ??
    "";

  const lessonResult: LessonResult = {
    kind: "lesson",
    courseTitle,
    courseSlug,
    courseIconUrl,
    lessonTitle: lesson.title,
    lessonSlug,
    moduleTitle,
    moduleIndex,
    description,
    thumbnailUrl,
    keyPoints: (lesson.keyPoints ?? []).slice(0, 3),
  };
  return lessonResult;
}
