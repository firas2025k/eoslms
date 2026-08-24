import { google } from "@ai-sdk/google";
import { generateText, isStepCount, Output } from "ai";
import { NextResponse } from "next/server";

import { createSearchMCPClient, fetchInitialContext } from "@/lib/search/mcp-client";
import { RawSearchResponseSchema, SearchResponseSchema, normalizeResult } from "@/lib/search/schema";
import { SEARCH_SYSTEM_PROMPT } from "@/lib/search/system-prompt";

const MAX_QUERY_LENGTH = 300;

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { query } = (body ?? {}) as { query?: string };
  const trimmedQuery = typeof query === "string" ? query.trim() : "";

  if (!trimmedQuery) {
    return NextResponse.json({ error: "query is required" }, { status: 400 });
  }
  if (trimmedQuery.length > MAX_QUERY_LENGTH) {
    return NextResponse.json(
      { error: `query must be ${MAX_QUERY_LENGTH} characters or fewer` },
      { status: 400 },
    );
  }

  const geminiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!geminiKey) {
    return NextResponse.json(
      { error: "GOOGLE_GENERATIVE_AI_API_KEY is not configured" },
      { status: 503 },
    );
  }

  if (!process.env.SANITY_CONTEXT_MCP_URL) {
    return NextResponse.json(
      { error: "SANITY_CONTEXT_MCP_URL is not configured" },
      { status: 503 },
    );
  }

  let mcpClient: Awaited<ReturnType<typeof createSearchMCPClient>> | null = null;

  try {
    const [mcpClientResult, initialContext] = await Promise.all([
      createSearchMCPClient(),
      fetchInitialContext(),
    ]);

    mcpClient = mcpClientResult;
    const allMcpTools = await mcpClient.tools();

    // Exclude initial_context — its data is already injected into the system prompt.
    const { initial_context: _excluded, ...mcpTools } = allMcpTools as Record<string, unknown> & {
      initial_context?: unknown;
    };

    const systemPrompt = initialContext
      ? `${SEARCH_SYSTEM_PROMPT}\n\n# Schema and data reference\n\n${initialContext}`
      : SEARCH_SYSTEM_PROMPT;

    const result = await generateText({
      model: google("gemini-3.6-flash"),
      system: systemPrompt,
      prompt: trimmedQuery,
      tools: mcpTools as Parameters<typeof generateText>[0]["tools"],
      stopWhen: isStepCount(6),
      output: Output.object({ schema: RawSearchResponseSchema }),
    });

    // Normalise: infer `kind`, remap moduleNumber→moduleIndex, fill defaults.
    const raw = result.output ?? { query: trimmedQuery, resultCount: 0, courseCount: 0, results: [] };
    const normalizedResults = raw.results.map(normalizeResult);

    const courseCount = new Set(normalizedResults.map((r) => r.courseName)).size;

    const searchResponse = SearchResponseSchema.parse({
      query: raw.query || trimmedQuery,
      resultCount: normalizedResults.length,
      courseCount,
      results: normalizedResults,
    });

    return NextResponse.json(searchResponse);
  } catch (err) {
    console.error("[search] error:", err);
    return NextResponse.json({ error: "Search failed. Please try again." }, { status: 500 });
  } finally {
    await mcpClient?.close?.();
  }
}
