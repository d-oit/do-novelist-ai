/**
 * AI Writing Assistant API Endpoint
 * Provides intelligent content analysis and writing suggestions
 * Uses OpenRouter for AI-powered writing analysis
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

import { apiLogger } from './_logger';
import { rateLimitMiddleware } from './_middleware';
import {
  getOpenRouterClient,
  handleAPIError,
  validateRequest,
  sanitizeInput,
  extractUsageMetrics,
  estimateCost,
  costTracker,
} from './_utils';

export const config = {
  runtime: 'edge',
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // Apply rate limiting
    rateLimitMiddleware(req, res, () => {});

    // Validate request
    validateRequest(req, ['content', 'config']);

    const { content, config: analysisConfig } = req.body as {
      content: string;
      config: {
        targetAudience?: string;
        preferredStyle?: string;
        genre?: string;
        enablePlotHoleDetection?: boolean;
        enableCharacterTracking?: boolean;
        enableDialogueAnalysis?: boolean;
        enableStyleAnalysis?: boolean;
        minimumConfidence?: number;
      };
    };

    // Sanitize input
    const sanitizedContent = sanitizeInput(content, 50000);

    // Get AI client
    const ai = getOpenRouterClient();

    // Build prompt based on configuration
    const prompt = `
Analyze the following text and provide writing suggestions. Focus on:
- Style improvements (clarity, flow, engagement)
- Tone consistency
- Pacing issues
- Character voice consistency
- Dialogue enhancement
- Show vs. tell opportunities
- Grammar and readability

Target audience: ${analysisConfig.targetAudience ?? 'general'}
Preferred style: ${analysisConfig.preferredStyle ?? 'neutral'}
${analysisConfig.genre ? `Genre: ${analysisConfig.genre}` : ''}

Please provide suggestions in JSON format with:
- type: category of suggestion
- severity: info/suggestion/warning/error
- message: clear description
- originalText: problematic text (if applicable)
- suggestedText: improved version (if applicable)
- position: {start, end} character positions
- confidence: 0-1 score
- reasoning: explanation
- category: specific category from readability/engagement/consistency/flow/dialogue/description/character_voice/plot_structure/show_vs_tell

Text to analyze:
"${sanitizedContent.substring(0, 2000)}${sanitizedContent.length > 2000 ? '...' : ''}"
    `;

    // Call OpenRouter API
    const result = await ai.chat.send({
      model: 'google/gemini-pro',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      stream: false,
    });

    const responseText =
      typeof result.choices[0]?.message.content === 'string'
        ? result.choices[0].message.content
        : '';

    // Extract usage metrics
    const usage = extractUsageMetrics(result);
    const cost = usage ? estimateCost('google/gemini-pro', usage) : undefined;

    // Track cost
    if (usage && cost) {
      const userId = (req.headers['x-user-id'] as string) ?? 'anonymous';
      costTracker.track({
        userId,
        endpoint: 'writing-assistant',
        provider: 'google',
        model: 'google/gemini-pro',
        tokensUsed: usage.totalTokens,
        estimatedCost: cost,
      });
    }

    // Return response
    res.status(200).json({
      suggestions: parseAISuggestions(responseText, analysisConfig),
      usage,
      cost,
    });
  } catch (error) {
    handleAPIError(error, res);
  }
}

function parseAISuggestions(aiResponse: string, config: Record<string, unknown>): unknown[] {
  try {
    const jsonMatch = /\[[\s\S]*\]/.exec(aiResponse);
    if (!jsonMatch) {
      return extractSuggestionsFromText(aiResponse);
    }

    const suggestions = JSON.parse(jsonMatch[0]) as {
      type?: string;
      severity?: string;
      message: string;
      originalText?: string;
      suggestedText?: string;
      position?: {
        start?: number;
        end?: number;
        line?: number;
        column?: number;
      };
      confidence?: number;
      reasoning?: string;
      category?: string;
    }[];

    const minimumConfidence = (config.minimumConfidence as number | undefined) ?? 0.7;

    return suggestions
      .filter(s => (s.confidence ?? 0.7) >= minimumConfidence)
      .map((s, index) => ({
        id: `ai-suggestion-${Date.now()}-${index}`,
        type: s.type ?? 'style',
        severity: s.severity ?? 'suggestion',
        message: s.message,
        originalText: s.originalText ?? '',
        suggestedText: s.suggestedText,
        position: s.position ?? { start: 0, end: 0 },
        confidence: s.confidence ?? 0.7,
        reasoning: s.reasoning ?? '',
        category: s.category ?? 'readability',
      }));
  } catch (error) {
    apiLogger.error(
      'Failed to parse AI suggestions',
      { context: 'writing-assistant' },
      error as Error,
    );
    return extractSuggestionsFromText(aiResponse);
  }
}

function extractSuggestionsFromText(text: string): unknown[] {
  const suggestions: unknown[] = [];
  const lines = text.split('\n').filter(line => line.trim());

  lines.forEach((line, index) => {
    if (line.includes('suggestion') || line.includes('improve') || line.includes('consider')) {
      suggestions.push({
        id: `parsed-suggestion-${index}`,
        type: 'style',
        severity: 'suggestion',
        message: line.trim(),
        originalText: '',
        position: { start: 0, end: 0 },
        confidence: 0.6,
        reasoning: 'Extracted from AI response',
        category: 'readability',
      });
    }
  });

  return suggestions.slice(0, 5);
}
