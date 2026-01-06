/**
 * Lazy-loaded Plot Engine Components
 *
 * Code-split and lazy-load heavy plot engine visualizations
 * to improve initial bundle size and page load performance
 */

import React, { lazy, Suspense } from 'react';

import type {
  AnalysisResult,
  PlotGenerationRequest,
  PlotGenerationResult,
} from '@/features/plot-engine/types';

// Lazy load skeleton components
import {
  PlotAnalyzerSkeleton,
  StoryArcVisualizerSkeleton,
  CharacterGraphViewSkeleton,
  PlotHoleDetectorViewSkeleton,
  PlotGeneratorSkeleton,
} from './LoadingStates';

// Dashboard skeleton fallback
const PlotEngineDashboardSkeleton: React.FC = () => (
  <div className='space-y-6'>
    <div className='h-32 animate-pulse rounded-lg bg-muted' />
    <div className='h-16 animate-pulse rounded-lg bg-muted' />
    <div className='h-96 animate-pulse rounded-lg bg-muted' />
  </div>
);

// Lazy load heavy components
const PlotAnalyzer = lazy(() =>
  import('./PlotAnalyzer').then(module => ({ default: module.PlotAnalyzer })),
);

const StoryArcVisualizer = lazy(() =>
  import('./StoryArcVisualizer').then(module => ({ default: module.StoryArcVisualizer })),
);

const CharacterGraphView = lazy(() =>
  import('./CharacterGraphView').then(module => ({ default: module.CharacterGraphView })),
);

const PlotHoleDetectorView = lazy(() =>
  import('./PlotHoleDetectorView').then(module => ({ default: module.PlotHoleDetectorView })),
);

const PlotGenerator = lazy(() =>
  import('./PlotGenerator').then(module => ({ default: module.PlotGenerator })),
);

const PlotEngineDashboard = lazy(() =>
  import('./PlotEngineDashboard').then(module => ({ default: module.PlotEngineDashboard })),
);

// Lazy component wrappers with proper props and skeletons

interface LazyPlotAnalyzerProps {
  projectId: string;
  onAnalyze?: (result: AnalysisResult) => void;
}

export const LazyPlotAnalyzer: React.FC<LazyPlotAnalyzerProps> = props => (
  <Suspense fallback={<PlotAnalyzerSkeleton />}>
    <PlotAnalyzer {...props} />
  </Suspense>
);

interface LazyStoryArcVisualizerProps {
  storyArc: NonNullable<AnalysisResult['storyArc']>;
}

export const LazyStoryArcVisualizer: React.FC<LazyStoryArcVisualizerProps> = props => (
  <Suspense fallback={<StoryArcVisualizerSkeleton />}>
    <StoryArcVisualizer {...props} />
  </Suspense>
);

interface LazyCharacterGraphViewProps {
  characterGraph: NonNullable<AnalysisResult['characterGraph']>;
}

export const LazyCharacterGraphView: React.FC<LazyCharacterGraphViewProps> = props => (
  <Suspense fallback={<CharacterGraphViewSkeleton />}>
    <CharacterGraphView {...props} />
  </Suspense>
);

interface LazyPlotHoleDetectorViewProps {
  analysis: NonNullable<AnalysisResult['plotHoleAnalysis']>;
}

export const LazyPlotHoleDetectorView: React.FC<LazyPlotHoleDetectorViewProps> = props => (
  <Suspense fallback={<PlotHoleDetectorViewSkeleton />}>
    <PlotHoleDetectorView {...props} />
  </Suspense>
);

interface LazyPlotGeneratorProps {
  projectId: string;
  onPlotGenerated?: (plot: PlotGenerationResult['plotStructure']) => void;
}

export const LazyPlotGenerator: React.FC<LazyPlotGeneratorProps> = props => (
  <Suspense fallback={<PlotGeneratorSkeleton />}>
    <PlotGenerator {...props} />
  </Suspense>
);

interface LazyPlotEngineDashboardProps {
  projectId: string;
  onGeneratePlot?: (request: PlotGenerationRequest) => Promise<PlotGenerationResult>;
}

export const LazyPlotEngineDashboard: React.FC<LazyPlotEngineDashboardProps> = props => (
  <Suspense fallback={<PlotEngineDashboardSkeleton />}>
    <PlotEngineDashboard {...props} />
  </Suspense>
);
