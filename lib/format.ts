/** Format lesson/module duration stored in seconds for UI display. */
export function formatDuration(seconds: number | null | undefined): string {
  if (seconds == null || seconds <= 0 || !Number.isFinite(seconds)) {
    return "—";
  }

  const totalMinutes = Math.round(seconds / 60);
  if (totalMinutes < 60) {
    return `${totalMinutes}m`;
  }

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (minutes === 0) {
    return `${hours}h`;
  }
  return `${hours}h ${minutes}m`;
}

/** Compact student counts (e.g. 2100 → 2.1k). */
export function formatStudentCount(count: number | null | undefined): string {
  if (count == null || count < 0 || !Number.isFinite(count)) {
    return "—";
  }
  if (count < 1000) {
    return String(count);
  }

  const thousands = count / 1000;
  const rounded =
    thousands >= 10 ? Math.round(thousands).toString() : thousands.toFixed(1).replace(/\.0$/, "");
  return `${rounded}k`;
}

export function formatLevel(
  level: "beginner" | "intermediate" | "advanced" | null | undefined,
): string {
  if (!level) return "—";
  return level.charAt(0).toUpperCase() + level.slice(1);
}

export function formatModuleCount(count: number | null | undefined): string {
  if (count == null || count < 0) return "—";
  return `${count} module${count === 1 ? "" : "s"}`;
}

/** Format seconds as `mm:ss` (or `h:mm:ss` past one hour) for "Watch from …" labels. */
export function formatSeconds(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const mm = String(m).padStart(h > 0 ? 2 : 1, "0");
  const ss = String(s).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

/** 1-based module and lesson indices → `LESSON 5.1`. */
export function formatLessonLabel(
  moduleIndex: number,
  lessonIndex: number,
): string {
  return `LESSON ${moduleIndex}.${lessonIndex}`;
}

/**
 * First normal paragraph from Portable Text notes (seed stores the lesson summary there).
 */
export function firstNotesParagraph(
  notes:
    | Array<{
        _type: string;
        style?: string;
        children?: Array<{ _type?: string; text?: string }> | null;
      }>
    | null
    | undefined,
): string | null {
  if (!notes?.length) return null;
  for (const block of notes) {
    if (block._type !== "block") continue;
    if (block.style && block.style !== "normal") continue;
    const text = (block.children ?? [])
      .map((child) => child.text ?? "")
      .join("")
      .trim();
    if (text) return text;
  }
  return null;
}
