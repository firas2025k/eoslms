const STOP_WORDS = new Set([
  "a",
  "an",
  "the",
  "and",
  "or",
  "but",
  "in",
  "on",
  "at",
  "to",
  "for",
  "of",
  "is",
  "are",
  "was",
  "were",
  "be",
  "how",
  "do",
  "does",
  "did",
  "i",
  "we",
  "you",
  "what",
  "when",
  "where",
  "why",
  "can",
  "should",
  "would",
  "could",
  "my",
  "me",
  "with",
  "from",
  "that",
  "this",
  "it",
  "as",
]);

const MAX_TERMS = 10;
const MIN_TERM_LENGTH = 3;

/** Turn a plain-language query into GROQ wildcard terms (`react*` → matches react, reactive, …). */
export function queryToSearchTerms(query: string): string[] {
  const tokens = query
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .map((token) => token.trim())
    .filter(Boolean);

  const terms: string[] = [];
  const seen = new Set<string>();

  for (const token of tokens) {
    if (token.length < MIN_TERM_LENGTH || STOP_WORDS.has(token)) continue;
    const pattern = token.endsWith("*") ? token : `${token}*`;
    if (seen.has(pattern)) continue;
    seen.add(pattern);
    terms.push(pattern);
    if (terms.length >= MAX_TERMS) break;
  }

  return terms;
}
