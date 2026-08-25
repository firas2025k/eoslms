import {NextResponse} from "next/server";

import {runSearch} from "@/lib/search/run-search";
import {SearchResponseSchema} from "@/lib/search/schema";

export const dynamic = "force-dynamic";

const MAX_QUERY_LENGTH = 300;

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({error: "Invalid JSON body"}, {status: 400});
  }

  const {query} = (body ?? {}) as {query?: string};
  const trimmedQuery = typeof query === "string" ? query.trim() : "";

  if (!trimmedQuery) {
    return NextResponse.json({error: "query is required"}, {status: 400});
  }
  if (trimmedQuery.length > MAX_QUERY_LENGTH) {
    return NextResponse.json(
      {error: `query must be ${MAX_QUERY_LENGTH} characters or fewer`},
      {status: 400},
    );
  }

  try {
    const searchResponse = SearchResponseSchema.parse(await runSearch(trimmedQuery));
    return NextResponse.json(searchResponse);
  } catch (err) {
    console.error("[search] error:", err);
    return NextResponse.json({error: "Search failed. Please try again."}, {status: 500});
  }
}
