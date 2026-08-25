import {auth} from "@clerk/nextjs/server";
import {NextResponse} from "next/server";

import {getPostHogClient} from "@/lib/posthog-server";
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

  const {userId} = await auth();

  try {
    const searchResponse = SearchResponseSchema.parse(await runSearch(trimmedQuery));

    if (userId) {
      const posthog = getPostHogClient();
      if (posthog) {
        posthog.capture({
          distinctId: userId,
          event: "search_performed",
          properties: {
            query_length: trimmedQuery.length,
            result_count: searchResponse.resultCount,
            course_count: searchResponse.courseCount,
          },
        });
        await posthog.flush();
      }
    }

    return NextResponse.json(searchResponse);
  } catch (err) {
    console.error("[search] error:", err);
    return NextResponse.json({error: "Search failed. Please try again."}, {status: 500});
  }
}
