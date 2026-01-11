/**
 * Response Parser
 *
 * Parses and validates AI-generated plot responses
 */

import type {
  PlotGenerationRequest,
  PlotAct,
  PlotPoint,
  PlotPointType,
} from '@/features/plot-engine';
import { logger } from '@/lib/logging/logger';

export function identifyClimax(acts: PlotAct[]): PlotPoint | undefined {
  for (const act of acts) {
    const climax = act.plotPoints.find(pp => pp.type === 'climax');
    if (climax) return climax;
  }
  return undefined;
}

export function identifyResolution(acts: PlotAct[]): PlotPoint | undefined {
  for (const act of acts) {
    const resolution = act.plotPoints.find(pp => pp.type === 'resolution');
    if (resolution) return resolution;
  }
  return undefined;
}

export function parsePlotResponse(
  response: string,
  request: PlotGenerationRequest,
): { acts: PlotAct[] } {
  try {
    let jsonText = response.trim();

    const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonText = jsonMatch[0];
    }

    const parsed = JSON.parse(jsonText) as { acts?: unknown[] };

    if (!parsed.acts || !Array.isArray(parsed.acts)) {
      throw new Error('Invalid response format: missing acts array');
    }

    const targetLength = request.targetLength || 20;
    const actCount = parsed.acts?.length || 3;

    const acts: PlotAct[] = parsed.acts.map((act: unknown, index: number) => {
      const actData = act as Record<string, unknown>;
      const plotPointsData = actData.plotPoints as unknown[];
      const actNum = ((actData.actNumber as number) || index + 1) as 1 | 2 | 3 | 4 | 5;
      const baseDuration = Math.floor(targetLength / actCount);

      return {
        id: `act-${index + 1}`,
        actNumber: actNum,
        name: String(actData.name || `Act ${index + 1}`),
        description: actData.description as string | undefined,
        plotPoints: (Array.isArray(plotPointsData) ? plotPointsData : []).map(
          (pp: unknown, ppIndex: number) => {
            const point = pp as Record<string, unknown>;
            return {
              id: `pp-${index + 1}-${ppIndex + 1}`,
              type: (point.type as PlotPointType) || 'rising_action',
              title: String(point.title || 'Plot Point'),
              description: String(point.description || ''),
              characterIds: request.characters || [],
              importance: (point.importance as 'major' | 'minor') || 'major',
              position: (point.position as number) || (index + 1) * 25,
            };
          },
        ),
        chapters: [],
        duration: baseDuration,
      };
    });

    const totalBaseDuration = acts.reduce((sum, act) => sum + (act.duration || 0), 0);
    if (totalBaseDuration < targetLength && acts.length > 0) {
      acts[acts.length - 1]!.duration! += targetLength - totalBaseDuration;
    }

    if (acts.length === 0) {
      throw new Error('No acts generated');
    }

    logger.info('Successfully parsed plot response', {
      projectId: request.projectId,
      actCount: acts.length,
      totalPlotPoints: acts.reduce((sum, act) => sum + act.plotPoints.length, 0),
    });

    return { acts };
  } catch (error) {
    logger.error('Failed to parse AI response', {
      projectId: request.projectId,
      error: error instanceof Error ? error.message : String(error),
      responsePreview: response.substring(0, 500),
    });
    throw new Error(
      `Failed to parse plot structure: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}
