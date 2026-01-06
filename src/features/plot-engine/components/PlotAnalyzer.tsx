/**
 * Plot Analyzer Component
 *
 * Main UI for analyzing story structure, pacing, and plot holes
 */

import React, { useEffect } from 'react';

import type { AnalysisResult, PlotHole } from '@/features/plot-engine';
import { usePlotAnalysis } from '@/features/plot-engine/hooks';
import { plotStorageService } from '@/features/plot-engine/services';
import { cn } from '@/lib/utils';
import { Button } from '@/shared/components/ui/Button';
import { Card } from '@/shared/components/ui/Card';
import { Progress } from '@/shared/components/ui/Progress';

interface PlotAnalyzerProps {
  projectId: string;
  onAnalyze?: (result: AnalysisResult) => void;
}

export const PlotAnalyzer: React.FC<PlotAnalyzerProps> = React.memo(({ projectId, onAnalyze }) => {
  // Use the plot analysis hook for state management
  const { analysisResult, isAnalyzing, error, analyze, clearAnalysis } = usePlotAnalysis();

  // Load cached analysis result on mount
  useEffect(() => {
    const loadCachedAnalysis = async (): Promise<void> => {
      try {
        const cached = await plotStorageService.getAnalysisResult(projectId, 'plot-analysis');
        if (cached && !analysisResult) {
          // Note: cached is the raw analysis result data
          // We could restore it to the state, but for now we'll just trigger fresh analysis
        }
      } catch (err) {
        // Silently fail - cached data is optional
        console.warn('Failed to load cached analysis:', err);
      }
    };

    void loadCachedAnalysis();
  }, [projectId, analysisResult]);

  const handleAnalyze = async (): Promise<void> => {
    try {
      // For now, use mock chapters - in real implementation, fetch from project
      const chapters: never[] = []; // TODO: Fetch chapters from project

      // Call the analyze function from the hook
      const result = await analyze(projectId, chapters, {
        includeStoryArc: true,
        includePlotHoles: true,
        includeCharacterGraph: true,
        includePacing: true,
      });

      // Save result to storage for caching (5 minute TTL)
      if (result) {
        await plotStorageService.saveAnalysisResult(projectId, 'plot-analysis', result, 5);
        onAnalyze?.(result);
      }
    } catch (err) {
      // Error is already handled by the hook
      console.error('Analysis failed:', err);
    }
  };

  return (
    <div className='space-y-6'>
      <Card className='p-6'>
        <div className='mb-4 flex items-center justify-between'>
          <div>
            <h2 className='text-2xl font-bold'>Plot Analyzer</h2>
            <p className='mt-1 text-muted-foreground'>
              Analyze story structure, pacing, and narrative coherence
            </p>
          </div>
          <Button
            onClick={() => void handleAnalyze()}
            disabled={isAnalyzing}
            data-testid='analyze-button'
            aria-label='Analyze plot'
          >
            {isAnalyzing ? 'Analyzing...' : 'Analyze Plot'}
          </Button>
        </div>

        {error && (
          <div
            className='mb-4 rounded-md bg-destructive/10 px-4 py-3 text-destructive'
            role='alert'
            data-testid='error-message'
          >
            <p className='font-medium'>Analysis Error</p>
            <p className='mt-1 text-sm'>{error}</p>
            <Button
              onClick={clearAnalysis}
              variant='ghost'
              size='sm'
              className='mt-2'
              aria-label='Dismiss error'
            >
              Dismiss
            </Button>
          </div>
        )}

        {isAnalyzing && (
          <div className='space-y-2' data-testid='analyzing-state'>
            <p className='text-sm text-muted-foreground'>Analyzing your story...</p>
            <Progress value={undefined} className='w-full' />
          </div>
        )}

        {analysisResult && !isAnalyzing && (
          <div className='space-y-6' data-testid='analysis-results'>
            {/* Story Structure */}
            {analysisResult.storyArc && (
              <div className='space-y-4'>
                <h3 className='text-lg font-semibold'>Story Structure</h3>
                <div className='grid grid-cols-2 gap-4'>
                  <Card className='p-4'>
                    <p className='text-sm text-muted-foreground'>Structure Type</p>
                    <p className='mt-1 text-2xl font-bold capitalize'>
                      {analysisResult.storyArc.structure.replace('-', ' ')}
                    </p>
                  </Card>
                  <Card className='p-4'>
                    <p className='text-sm text-muted-foreground'>Coherence Score</p>
                    <p className='mt-1 text-2xl font-bold'>
                      {Math.round(analysisResult.storyArc.coherence * 100)}%
                    </p>
                  </Card>
                </div>
              </div>
            )}

            {/* Pacing Analysis */}
            {analysisResult.storyArc?.pacing && (
              <div className='space-y-4'>
                <h3 className='text-lg font-semibold'>Pacing Analysis</h3>
                <Card className='p-4'>
                  <div className='mb-2 flex items-center justify-between'>
                    <p className='text-sm text-muted-foreground'>Overall Pace</p>
                    <p className='text-lg font-semibold capitalize'>
                      {analysisResult.storyArc.pacing.overall}
                    </p>
                  </div>
                  <Progress value={analysisResult.storyArc.pacing.score} className='w-full' />
                  <p className='mt-2 text-xs text-muted-foreground'>
                    Score: {analysisResult.storyArc.pacing.score}/100
                  </p>
                </Card>
              </div>
            )}

            {/* Recommendations */}
            {analysisResult.storyArc && analysisResult.storyArc.recommendations.length > 0 && (
              <div className='space-y-4'>
                <h3 className='text-lg font-semibold'>Recommendations</h3>
                <ul className='space-y-2'>
                  {analysisResult.storyArc.recommendations.map((rec: string, index: number) => (
                    <li key={index} className='flex items-start gap-2 rounded-md bg-muted p-3'>
                      <span className='mt-0.5 text-primary'>•</span>
                      <span className='text-sm'>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Plot Holes */}
            {analysisResult.plotHoleAnalysis && (
              <div className='space-y-4'>
                <h3 className='text-lg font-semibold'>Plot Hole Analysis</h3>
                <Card className='p-4'>
                  <div className='mb-4 flex items-center justify-between'>
                    <p className='text-sm text-muted-foreground'>Quality Score</p>
                    <p className='text-2xl font-bold'>
                      {analysisResult.plotHoleAnalysis.overallScore}/100
                    </p>
                  </div>
                  <p className='text-sm text-muted-foreground'>
                    {analysisResult.plotHoleAnalysis.summary}
                  </p>

                  {analysisResult.plotHoleAnalysis.plotHoles.length > 0 && (
                    <div className='mt-4 space-y-2'>
                      <p className='text-sm font-medium'>Issues Found:</p>
                      {analysisResult.plotHoleAnalysis.plotHoles
                        .slice(0, 5)
                        .map((hole: PlotHole) => (
                          <PlotHoleItem key={hole.id} plotHole={hole} />
                        ))}
                    </div>
                  )}
                </Card>
              </div>
            )}

            {/* Character Graph */}
            {analysisResult.characterGraph && (
              <div className='space-y-4'>
                <h3 className='text-lg font-semibold'>Character Relationships</h3>
                <Card className='p-4'>
                  <p className='text-sm text-muted-foreground'>
                    Found {analysisResult.characterGraph.relationships.length} relationships between{' '}
                    {analysisResult.characterGraph.nodes.length} characters
                  </p>
                  {/* TODO: Add character graph visualization */}
                </Card>
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
});

interface PlotHoleItemProps {
  plotHole: PlotHole;
}

const PlotHoleItem: React.FC<PlotHoleItemProps> = ({ plotHole }) => {
  const getSeverityColor = (severity: PlotHole['severity']): string => {
    const colors = {
      critical: 'text-red-600 bg-red-50 dark:bg-red-900/20',
      major: 'text-orange-600 bg-orange-50 dark:bg-orange-900/20',
      moderate: 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20',
      minor: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20',
    };
    return colors[severity];
  };

  return (
    <div className='space-y-2 rounded-md border p-3' data-testid='plot-hole-item'>
      <div className='flex items-start justify-between gap-2'>
        <div className='flex-1'>
          <h4 className='text-sm font-medium'>{plotHole.title}</h4>
          <p className='mt-1 text-xs text-muted-foreground'>{plotHole.description}</p>
        </div>
        <span
          className={cn(
            'rounded-full px-2 py-1 text-xs font-medium',
            getSeverityColor(plotHole.severity),
          )}
        >
          {plotHole.severity}
        </span>
      </div>
      {plotHole.suggestedFix && (
        <div className='rounded bg-muted/50 p-2 text-xs'>
          <p className='font-medium text-muted-foreground'>Suggested Fix:</p>
          <p className='mt-1'>{plotHole.suggestedFix}</p>
        </div>
      )}
    </div>
  );
};
