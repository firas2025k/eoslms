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
