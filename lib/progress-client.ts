export type SaveProgressInput = {
  lessonId: string
  completed?: boolean
  positionSeconds?: number
}

/** Same-origin POST. Returns false on 401 / network / non-OK — callers no-op. */
export async function saveProgress(input: SaveProgressInput): Promise<boolean> {
  try {
    const response = await fetch('/api/progress', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(input),
    })
    if (response.status === 401) return false
    return response.ok
  } catch {
    return false
  }
}
