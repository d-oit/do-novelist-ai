/**
 * Token Estimation Utilities
 * Simple token estimation for context management
 */

/**
 * Estimate token count for text
 * Uses a simple heuristic: ~4 characters per token
 * More accurate than word count, faster than actual tokenization
 */
export function estimateTokens(text: string): number {
  if (!text) return 0;

  // Remove extra whitespace
  const normalized = text.trim().replace(/\s+/g, ' ');

  // Estimate: 1 token ≈ 4 characters (conservative for English)
  // This accounts for spaces, punctuation, and subword tokenization
  return Math.ceil(normalized.length / 4);
}

/**
 * Truncate text to fit within token limit
 */
export function truncateToTokens(text: string, maxTokens: number): string {
  const currentTokens = estimateTokens(text);

  if (currentTokens <= maxTokens) {
    return text;
  }

  // Calculate approximate character limit
  const maxChars = maxTokens * 4;

  // Truncate at word boundary
  const truncated = text.slice(0, maxChars);
  const lastSpace = truncated.lastIndexOf(' ');

  if (lastSpace > maxChars * 0.9) {
    return truncated.slice(0, lastSpace) + '...';
  }

  return truncated + '...';
}

/**
 * Calculate token budget allocation
 */
export function allocateTokenBudget(
  totalBudget: number,
  allocations: Record<string, number>,
): Record<string, number> {
  const totalWeight = Object.values(allocations).reduce((sum, weight) => sum + weight, 0);

  const result: Record<string, number> = {};

  for (const [key, weight] of Object.entries(allocations)) {
    result[key] = Math.floor((weight / totalWeight) * totalBudget);
  }

  return result;
}

/**
 * Estimate tokens for common AI prompt components
 */
export function estimatePromptTokens(components: {
  system?: string;
  user?: string;
  assistant?: string;
  context?: string;
}): number {
  let total = 0;

  if (components.system) total += estimateTokens(components.system);
  if (components.user) total += estimateTokens(components.user);
  if (components.assistant) total += estimateTokens(components.assistant);
  if (components.context) total += estimateTokens(components.context);

  // Add overhead for message formatting (~10 tokens per message)
  const messageCount = Object.keys(components).length;
  total += messageCount * 10;

  return total;
}
