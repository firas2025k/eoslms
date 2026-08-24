import { z } from "zod";

// ── Strict output types (sent to the client / used by UI components) ──────────

export const VideoResultSchema = z.object({
  kind: z.literal("video"),
  courseTitle: z.string(),
  courseSlug: z.string(),
  courseIconUrl: z.string().nullable().optional(),
  lessonTitle: z.string(),
  lessonSlug: z.string(),
  moduleTitle: z.string(),
  moduleIndex: z.number().int().positive(),
  lessonIndex: z.number().int().positive(),
  description: z.string(),
  thumbnailUrl: z.string().nullable().optional(),
  clipDurationLabel: z.string().optional(),
  startSeconds: z.number().int().nonnegative(),
});

export const LessonResultSchema = z.object({
  kind: z.literal("lesson"),
  courseTitle: z.string(),
  courseSlug: z.string(),
  courseIconUrl: z.string().nullable().optional(),
  lessonTitle: z.string(),
  lessonSlug: z.string(),
  moduleTitle: z.string(),
  moduleIndex: z.number().int().positive(),
  description: z.string(),
  keyPoints: z.array(z.string()).max(3),
});

export const SearchResponseSchema = z.object({
  query: z.string(),
  resultCount: z.number().int().nonnegative(),
  courseCount: z.number().int().nonnegative(),
  results: z.array(z.discriminatedUnion("kind", [VideoResultSchema, LessonResultSchema])),
});

export type VideoResult = z.infer<typeof VideoResultSchema>;
export type LessonResult = z.infer<typeof LessonResultSchema>;
export type SearchResult = VideoResult | LessonResult;
export type SearchResponse = z.infer<typeof SearchResponseSchema>;

// ── Lenient schema for parsing Gemini's raw output ────────────────────────────
// Gemini omits `kind` and uses `moduleNumber`/`lessonNumber` instead of
// `moduleIndex`/`lessonIndex`. We accept either and normalise below.

export const RawResultSchema = z.object({
  kind: z.enum(["video", "lesson"]).optional(),
  courseTitle: z.string().default(""),
  courseSlug: z.string().default(""),
  courseIconUrl: z.string().nullable().optional(),
  lessonTitle: z.string().default(""),
  lessonSlug: z.string().default(""),
  moduleTitle: z.string().optional(),
  moduleIndex: z.number().optional(),
  moduleNumber: z.number().optional(), // Gemini uses this name
  lessonIndex: z.number().optional(),
  lessonNumber: z.number().optional(), // Gemini uses this name
  description: z.string().optional(),
  thumbnailUrl: z.string().nullable().optional(),
  clipDurationLabel: z.string().optional(),
  startSeconds: z.number().optional(),
  keyPoints: z.array(z.string()).optional(),
});

export const RawSearchResponseSchema = z.object({
  query: z.string().default(""),
  resultCount: z.number().default(0),
  courseCount: z.number().default(0),
  results: z.array(RawResultSchema).default([]),
});

export type RawResult = z.infer<typeof RawResultSchema>;

/** Normalise a raw Gemini result into the strict SearchResult shape. */
export function normalizeResult(raw: RawResult): SearchResult {
  const moduleIdx = raw.moduleIndex ?? raw.moduleNumber ?? 1;
  const lessonIdx = raw.lessonIndex ?? raw.lessonNumber ?? 1;
  const hasTimestamp = typeof raw.startSeconds === "number" && raw.startSeconds >= 0;
  const kind = raw.kind ?? (hasTimestamp ? "video" : "lesson");

  if (kind === "video") {
    return {
      kind: "video",
      courseTitle: raw.courseTitle,
      courseSlug: raw.courseSlug,
      courseIconUrl: raw.courseIconUrl,
      lessonTitle: raw.lessonTitle,
      lessonSlug: raw.lessonSlug,
      moduleTitle: raw.moduleTitle ?? "",
      moduleIndex: moduleIdx,
      lessonIndex: lessonIdx,
      description: raw.description ?? "",
      thumbnailUrl: raw.thumbnailUrl,
      clipDurationLabel: raw.clipDurationLabel,
      startSeconds: raw.startSeconds ?? 0,
    };
  }

  return {
    kind: "lesson",
    courseTitle: raw.courseTitle,
    courseSlug: raw.courseSlug,
    courseIconUrl: raw.courseIconUrl,
    lessonTitle: raw.lessonTitle,
    lessonSlug: raw.lessonSlug,
    moduleTitle: raw.moduleTitle ?? "",
    moduleIndex: moduleIdx,
    description: raw.description ?? "",
    keyPoints: (raw.keyPoints ?? []).slice(0, 3),
  };
}

