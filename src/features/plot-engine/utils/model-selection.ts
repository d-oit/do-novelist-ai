/**
 * Model Selection Utility
 *
 * Selects appropriate AI model based on task complexity
 */

import type { PlotGenerationRequest } from '@/features/plot-engine';
import type { AIProvider } from '@/lib/ai-config';
import { getAIConfig, getModelForTask } from '@/lib/ai-config';
import { logger } from '@/lib/logging/logger';

const config = getAIConfig();

export function selectModelForTask(
  request: PlotGenerationRequest,
  taskType: 'plot_structure' | 'suggestions' | 'alternatives',
  provider: AIProvider = 'anthropic',
): string {
  const complexity = calculateTaskComplexity(request, taskType);

  const modelName = getModelForTask(provider, complexity, config);

  logger.debug('Model selection', {
    provider,
    complexity,
    taskType,
    model: modelName,
    structure: request.structure,
    targetLength: request.targetLength,
  });

  return modelName;
}

export function calculateTaskComplexity(
  request: PlotGenerationRequest,
  taskType: 'plot_structure' | 'suggestions' | 'alternatives',
): 'fast' | 'standard' | 'advanced' {
  let complexityScore = 0;

  if (taskType === 'suggestions') {
    complexityScore = 0;
  } else if (taskType === 'alternatives') {
    complexityScore = 1;
  } else {
    complexityScore = 1;
    if (request.structure === 'hero-journey') {
      complexityScore += 3;
    } else if (request.structure === '5-act' || request.structure === 'kishotenketsu') {
      complexityScore += 1;
    } else if (request.structure === 'custom') {
      complexityScore += 3;
    }

    if (request.targetLength && request.targetLength >= 40) {
      complexityScore += 2;
    } else if (request.targetLength && request.targetLength >= 30) {
      complexityScore += 1;
    }

    const characterCount = request.characters?.length || 0;
    if (characterCount >= 3) {
      complexityScore += 1;
    } else if (characterCount >= 5) {
      complexityScore += 2;
    }

    const plotPointCount = request.plotPoints?.length || 0;
    if (plotPointCount >= 5) {
      complexityScore += 1;
    }

    if (request.themes && request.themes.length >= 2) {
      complexityScore += 1;
    }
  }

  if (complexityScore >= 3) {
    return 'advanced';
  } else if (complexityScore >= 1) {
    return 'standard';
  } else {
    return 'fast';
  }
}
