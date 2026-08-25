search] error: Error [AI_NoOutputGeneratedError]: No output generated.
    at POST (app/api/search/route.ts:77:24)
  75 |
  76 |     // Normalise: infer `kind`, remap moduleNumber→moduleIndex, fill defaults.
> 77 |     const raw = result.output ?? { query: trimmedQuery, resultCount: 0, courseCount: 0, res...
     |                        ^
  78 |     const normalizedResults = raw.results.map(normalizeResult);
  79 |
  80 |     const courseCount = new Set(normalizedResults.map((r) => r.courseTitle)).size; {
  cause: undefined
}
 POST /api/search 500 in 2.1min (next.js: 1021ms, proxy.ts: 59ms, application-code: 2.1min)

