/**
 * Plot Engine Dashboard Component
 *
 * Main dashboard for plot analysis, generation, and management
 */

import React, { useState } from 'react';

import { SectionErrorBoundary } from '@/components/error-boundary';
import type {
  AnalysisResult,
  PlotGenerationResult,
  PlotGenerationRequest,
} from '@/features/plot-engine';
import { cn } from '@/lib/utils';
import { Button } from '@/shared/components/ui/Button';
import { Card } from '@/shared/components/ui/Card';

import { FeedbackCollector } from './FeedbackCollector';
import {
  LazyPlotAnalyzer,
  LazyStoryArcVisualizer,
  LazyCharacterGraphView,
  LazyPlotHoleDetectorView,
  LazyPlotGenerator,
} from './lazy-plot-engine';

interface PlotEngineDashboardProps {
  projectId: string;
  onGeneratePlot?: (request: PlotGenerationRequest) => Promise<PlotGenerationResult>;
}

type TabType = 'overview' | 'structure' | 'characters' | 'plot-holes' | 'generator';

export const PlotEngineDashboard: React.FC<PlotEngineDashboardProps> = React.memo(
  ({ projectId, onGeneratePlot }) => {
    const [activeTab, setActiveTab] = useState<TabType>('overview');
    const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);

    const handleAnalysisComplete = (result: AnalysisResult): void => {
      setAnalysisResult(result);
    };

    const handleGeneratePlot = async (): Promise<void> => {
      if (!onGeneratePlot) return;

      setIsGenerating(true);
      try {
        const request: PlotGenerationRequest = {
          projectId,
          premise: 'Generate plot based on existing content',
          genre: 'fantasy',
          targetLength: 20,
        };

        await onGeneratePlot(request);
      } finally {
        setIsGenerating(false);
      }
    };

    const tabs = [
      { id: 'overview' as const, label: 'Overview', icon: '📊' },
      { id: 'structure' as const, label: 'Story Arc', icon: '📈' },
      { id: 'characters' as const, label: 'Characters', icon: '👥' },
      { id: 'plot-holes' as const, label: 'Plot Holes', icon: '🔍' },
      { id: 'generator' as const, label: 'Generator', icon: '✨' },
    ];

    return (
      <div className='space-y-6'>
        {/* Header */}
        <Card className='p-6'>
          <div className='flex items-center justify-between'>
            <div>
              <h1 className='text-3xl font-bold'>Plot Engine</h1>
              <p className='mt-1 text-muted-foreground'>
                AI-powered plot analysis, generation, and management
              </p>
              <p className='mt-2 text-sm text-muted-foreground'>
                💡 <strong>Tip:</strong> Run analysis first to see story structure, plot holes, and
                character relationships
              </p>
            </div>
            <Button
              onClick={() => void handleGeneratePlot()}
              disabled={isGenerating}
              data-testid='generate-plot-button'
              title='Generate AI-powered plot suggestions based on your story'
            >
              {isGenerating ? 'Generating...' : '✨ Generate Plot'}
            </Button>
          </div>
        </Card>

        {/* Tabs */}
        <Card className='p-2'>
          <div className='flex items-center gap-2'>
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center gap-2 rounded-lg px-4 py-2 transition-colors',
                  activeTab === tab.id ? 'bg-primary text-primary-foreground' : 'hover:bg-muted',
                )}
                data-testid={`tab-${tab.id}`}
              >
                <span>{tab.icon}</span>
                <span className='font-medium'>{tab.label}</span>
              </button>
            ))}
          </div>
        </Card>

        {/* Tab Content */}
        <div>
          {activeTab === 'overview' && (
            <SectionErrorBoundary componentName='PlotAnalyzer'>
              <LazyPlotAnalyzer projectId={projectId} onAnalyze={handleAnalysisComplete} />
            </SectionErrorBoundary>
          )}

          {activeTab === 'structure' && analysisResult?.storyArc && (
            <SectionErrorBoundary componentName='StoryArcVisualizer'>
              <LazyStoryArcVisualizer storyArc={analysisResult.storyArc} />
            </SectionErrorBoundary>
          )}

          {activeTab === 'characters' && analysisResult?.characterGraph && (
            <SectionErrorBoundary componentName='CharacterGraphView'>
              <LazyCharacterGraphView characterGraph={analysisResult.characterGraph} />
            </SectionErrorBoundary>
          )}

          {activeTab === 'plot-holes' && analysisResult?.plotHoleAnalysis && (
            <SectionErrorBoundary componentName='PlotHoleDetectorView'>
              <LazyPlotHoleDetectorView analysis={analysisResult.plotHoleAnalysis} />
            </SectionErrorBoundary>
          )}

          {activeTab === 'generator' && (
            <SectionErrorBoundary componentName='PlotGenerator'>
              <LazyPlotGenerator projectId={projectId} />
            </SectionErrorBoundary>
          )}

          {/* Empty State */}
          {activeTab !== 'overview' && activeTab !== 'generator' && !analysisResult && (
            <Card className='p-12 text-center'>
              <div className='mx-auto max-w-md space-y-4'>
                <div className='text-4xl'>📊</div>
                <h3 className='text-lg font-semibold'>No Analysis Data</h3>
                <p className='text-muted-foreground'>
                  Run a plot analysis first to view{' '}
                  {activeTab === 'structure' && 'story arc visualizations'}
                  {activeTab === 'characters' && 'character relationship networks'}
                  {activeTab === 'plot-holes' && 'detected plot holes'}
                </p>
                <Button onClick={() => setActiveTab('overview')} variant='outline' className='mt-4'>
                  Go to Overview to Analyze
                </Button>
              </div>
            </Card>
          )}
        </div>

        {/* Feedback Collector */}
        <div className='mt-8 flex justify-center'>
          <FeedbackCollector component='PlotEngineDashboard' className='max-w-2xl' />
        </div>
      </div>
    );
  },
);
