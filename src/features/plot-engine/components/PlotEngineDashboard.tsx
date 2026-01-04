/**
 * Plot Engine Dashboard Component
 * 
 * Main dashboard for plot analysis, generation, and management
 */

import React, { useState } from 'react';

import { Button } from '@/shared/components/ui/Button';
import { Card } from '@/shared/components/ui/Card';

import type { AnalysisResult, PlotGenerationResult, PlotGenerationRequest } from '@/features/plot-engine';
import { PlotAnalyzer } from './PlotAnalyzer';
import { StoryArcVisualizer } from './StoryArcVisualizer';
import { CharacterGraphView } from './CharacterGraphView';
import { PlotHoleDetectorView } from './PlotHoleDetectorView';

interface PlotEngineDashboardProps {
  projectId: string;
  onGeneratePlot?: (request: PlotGenerationRequest) => Promise<PlotGenerationResult>;
}

type TabType = 'overview' | 'structure' | 'characters' | 'plot-holes' | 'generator';

export const PlotEngineDashboard: React.FC<PlotEngineDashboardProps> = ({
  projectId,
  onGeneratePlot,
}) => {
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
    <div className="space-y-6">
      {/* Header */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Plot Engine</h1>
            <p className="text-muted-foreground mt-1">
              AI-powered plot analysis, generation, and management
            </p>
          </div>
          <Button
            onClick={() => void handleGeneratePlot()}
            disabled={isGenerating}
            data-testid="generate-plot-button"
          >
            {isGenerating ? 'Generating...' : '✨ Generate Plot'}
          </Button>
        </div>
      </Card>

      {/* Tabs */}
      <Card className="p-2">
        <div className="flex items-center gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                activeTab === tab.id
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-muted'
              }`}
              data-testid={`tab-${tab.id}`}
            >
              <span>{tab.icon}</span>
              <span className="font-medium">{tab.label}</span>
            </button>
          ))}
        </div>
      </Card>

      {/* Tab Content */}
      <div>
        {activeTab === 'overview' && (
          <PlotAnalyzer
            projectId={projectId}
            onAnalyze={handleAnalysisComplete}
          />
        )}

        {activeTab === 'structure' && analysisResult?.storyArc && (
          <StoryArcVisualizer storyArc={analysisResult.storyArc} />
        )}

        {activeTab === 'characters' && analysisResult?.characterGraph && (
          <CharacterGraphView characterGraph={analysisResult.characterGraph} />
        )}

        {activeTab === 'plot-holes' && analysisResult?.plotHoleAnalysis && (
          <PlotHoleDetectorView analysis={analysisResult.plotHoleAnalysis} />
        )}

        {activeTab === 'generator' && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Plot Generator</h3>
            <p className="text-muted-foreground mb-4">
              Generate plot structures and suggestions based on your story premise.
            </p>
            <Button onClick={() => void handleGeneratePlot()} disabled={isGenerating}>
              {isGenerating ? 'Generating...' : 'Generate New Plot Structure'}
            </Button>
          </Card>
        )}

        {/* Empty State */}
        {activeTab !== 'overview' &&
          activeTab !== 'generator' &&
          !analysisResult && (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground">
              Run analysis first to view this section
            </p>
            <Button
              onClick={() => setActiveTab('overview')}
              variant="outline"
              className="mt-4"
            >
              Go to Overview
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
};
