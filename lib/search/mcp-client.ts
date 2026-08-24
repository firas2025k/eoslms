import "server-only";

import { createMCPClient } from "@ai-sdk/mcp";

/** Cached initial context string; refreshed every TTL_MS. */
let cachedInitialContext: string | null = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 5 * 60 * 1000;

/**
 * Build the /initial-context endpoint URL from the MCP base URL.
 * Handles any trailing slashes and preserves query params on a separate line.
 */
function initialContextUrl(mcpUrl: string): string {
  const url = new URL(mcpUrl);
  url.pathname = url.pathname.replace(/\/$/, "") + "/initial-context";
  return url.toString();
}

/**
 * Fetch and cache the Sanity Context schema overview.
 *
 * Injecting it into the system prompt avoids a round-trip tool call on the
 * first step and improves prompt caching (stable prefix across requests).
 */
export async function fetchInitialContext(): Promise<string | null> {
  const mcpUrl = process.env.SANITY_CONTEXT_MCP_URL;
  if (!mcpUrl) return null;

  const isStale = Date.now() - cacheTimestamp > CACHE_TTL_MS;
  if (isStale) {
    try {
      const res = await fetch(initialContextUrl(mcpUrl), {
        headers: { Authorization: `Bearer ${process.env.SANITY_API_READ_TOKEN}` },
      });
      if (res.ok) {
        cachedInitialContext = await res.text();
        cacheTimestamp = Date.now();
      }
    } catch {
      // Non-fatal: agent will rely on tool calls instead.
    }
  }

  return cachedInitialContext;
}

/**
 * Create a Sanity Context MCP client authenticated with the read token.
 * The caller is responsible for calling `.close()` when done (use try/finally).
 */
export function createSearchMCPClient() {
  const mcpUrl = process.env.SANITY_CONTEXT_MCP_URL;
  const token = process.env.SANITY_API_READ_TOKEN;

  if (!mcpUrl) throw new Error("SANITY_CONTEXT_MCP_URL is not set");
  if (!token) throw new Error("SANITY_API_READ_TOKEN is not set");

  return createMCPClient({
    transport: {
      type: "http",
      url: mcpUrl,
      headers: { Authorization: `Bearer ${token}` },
    },
  });
}
