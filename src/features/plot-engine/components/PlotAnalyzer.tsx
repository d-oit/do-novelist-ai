/**
 * Plot Analyzer Component
 *
 * Main UI for analyzing story structure, pacing, and plot holes
 */

import React, { useState } from 'react';

import type { AnalysisResult, PlotHole } from '@/features/plot-engine';
import { cn } from '@/lib/utils';
import { Button } from '@/shared/components/ui/Button';
import { Card } from '@/shared/components/ui/Card';
import { Progress } from '@/shared/components/ui/Progress';

interface PlotAnalyzerProps {
  projectId: string;
  onAnalyze?: (result: AnalysisResult) => void;
}

export const PlotAnalyzer: React.FC<PlotAnalyzerProps> = ({ projectId, onAnalyze }) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async (): Promise<void> => {
    setIsAnalyzing(true);
    setError(null);

    try {
      // TODO: Call plot analysis service
      // const analysis = await plotAnalysisService.analyzeProject(projectId, chapters, {
      //   includeStoryArc: true,
      //   includePlotHoles: true,
      //   includeCharacterGraph: true,
      //   includePacing: true,
      // });

      // Mock result for now
      const mockResult: AnalysisResult = {
        projectId,
        analyzedAt: new Date(),
        storyArc: {
          structure: '3-act',
          pacing: {
            overall: 'moderate',
            score: 75,
            byChapter: [],
            recommendations: [
              'Consider increasing pace in middle chapters',
              'Add more tension before climax',
            ],
          },
          tension: [],
          coherence: 0.85,
          recommendations: [
            'Overall story structure is solid',
            'Consider adding more character development in Act 2',
          ],
        },
      };

      setResult(mockResult);
      onAnalyze?.(mockResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setIsAnalyzing(false);
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
          </div>
        )}

        {isAnalyzing && (
          <div className='space-y-2' data-testid='analyzing-state'>
            <p className='text-sm text-muted-foreground'>Analyzing your story...</p>
            <Progress value={undefined} className='w-full' />
          </div>
        )}

        {result && !isAnalyzing && (
          <div className='space-y-6' data-testid='analysis-results'>
            {/* Story Structure */}
            {result.storyArc && (
              <div className='space-y-4'>
                <h3 className='text-lg font-semibold'>Story Structure</h3>
                <div className='grid grid-cols-2 gap-4'>
                  <Card className='p-4'>
                    <p className='text-sm text-muted-foreground'>Structure Type</p>
                    <p className='mt-1 text-2xl font-bold capitalize'>
                      {result.storyArc.structure.replace('-', ' ')}
                    </p>
                  </Card>
                  <Card className='p-4'>
                    <p className='text-sm text-muted-foreground'>Coherence Score</p>
                    <p className='mt-1 text-2xl font-bold'>
                      {Math.round(result.storyArc.coherence * 100)}%
                    </p>
                  </Card>
                </div>
              </div>
            )}

            {/* Pacing Analysis */}
            {result.storyArc?.pacing && (
              <div className='space-y-4'>
                <h3 className='text-lg font-semibold'>Pacing Analysis</h3>
                <Card className='p-4'>
                  <div className='mb-2 flex items-center justify-between'>
                    <p className='text-sm text-muted-foreground'>Overall Pace</p>
                    <p className='text-lg font-semibold capitalize'>
                      {result.storyArc.pacing.overall}
                    </p>
                  </div>
                  <Progress value={result.storyArc.pacing.score} className='w-full' />
                  <p className='mt-2 text-xs text-muted-foreground'>
                    Score: {result.storyArc.pacing.score}/100
                  </p>
                </Card>
              </div>
            )}

            {/* Recommendations */}
            {result.storyArc && result.storyArc.recommendations.length > 0 && (
              <div className='space-y-4'>
                <h3 className='text-lg font-semibold'>Recommendations</h3>
                <ul className='space-y-2'>
                  {result.storyArc.recommendations.map((rec, index) => (
                    <li key={index} className='flex items-start gap-2 rounded-md bg-muted p-3'>
                      <span className='mt-0.5 text-primary'>•</span>
                      <span className='text-sm'>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Plot Holes */}
            {result.plotHoleAnalysis && (
              <div className='space-y-4'>
                <h3 className='text-lg font-semibold'>Plot Hole Analysis</h3>
                <Card className='p-4'>
                  <div className='mb-4 flex items-center justify-between'>
                    <p className='text-sm text-muted-foreground'>Quality Score</p>
                    <p className='text-2xl font-bold'>{result.plotHoleAnalysis.overallScore}/100</p>
                  </div>
                  <p className='text-sm text-muted-foreground'>{result.plotHoleAnalysis.summary}</p>

                  {result.plotHoleAnalysis.plotHoles.length > 0 && (
                    <div className='mt-4 space-y-2'>
                      <p className='text-sm font-medium'>Issues Found:</p>
                      {result.plotHoleAnalysis.plotHoles.slice(0, 5).map(hole => (
                        <PlotHoleItem key={hole.id} plotHole={hole} />
                      ))}
                    </div>
                  )}
                </Card>
              </div>
            )}

            {/* Character Graph */}
            {result.characterGraph && (
              <div className='space-y-4'>
                <h3 className='text-lg font-semibold'>Character Relationships</h3>
                <Card className='p-4'>
                  <p className='text-sm text-muted-foreground'>
                    Found {result.characterGraph.relationships.length} relationships between{' '}
                    {result.characterGraph.nodes.length} characters
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
};

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
