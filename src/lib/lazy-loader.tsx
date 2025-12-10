import React, { lazy, Suspense } from 'react';

import type { Project, AgentAction, RefineOptions } from '@/shared/types';

import {
  AnalyticsLoading,
  BookViewerLoading,
  WorldBuildingLoading,
  PublishingLoading,
} from '../lib/lazy-components';

// Import types for proper typing

// Lazy load heavy analytics components
const AnalyticsDashboard = lazy(
  () => import('../features/analytics/components/AnalyticsDashboard'),
);

// Lazy load editor components
const BookViewer = lazy(() => import('../features/editor/components/BookViewer'));

// Lazy load world building components
const WorldBuildingDashboard = lazy(
  () => import('../features/world-building/components/WorldBuildingDashboard'),
);

// Lazy load publishing components
const PublishingDashboard = lazy(
  () => import('../features/publishing/components/PublishingDashboard'),
);
const PublishingSetup = lazy(() => import('../features/publishing/components/PublishingSetup'));

// Lazy load heavy individual components
const GoapVisualizer = lazy(() => import('../components/GoapVisualizer'));

/**
 * Props for lazy-loaded analytics dashboard component
 */
interface LazyAnalyticsDashboardProps {
  project: Project;
  onClose: () => void;
  className?: string;
}

/**
 * Props for lazy-loaded book viewer component
 */
interface LazyBookViewerProps {
  project: Project;
  selectedChapterId: string | null;
  onSelectChapter: (id: string) => void;
  onRefineChapter: (chapterId: string, options: RefineOptions) => void;
  onUpdateChapter: (chapterId: string, updates: Partial<Project['chapters'][0]>) => void;
  onUpdateProject: (updates: Partial<Project>) => void;
  onAddChapter: () => void;
  onContinueChapter: (chapterId: string) => void;
}

/**
 * Props for lazy-loaded world building dashboard component
 */
interface LazyWorldBuildingDashboardProps {
  projectId: string;
}

/**
 * Props for lazy-loaded publishing setup component
 */
interface LazyPublishingSetupProps {
  project: Project;
  onPublishingComplete: (publication: unknown) => void;
  onClose: () => void;
  className?: string;
}

/**
 * Props for lazy-loaded publishing dashboard component
 */
interface LazyPublishingDashboardProps {
  project: Project;
  onClose: () => void;
  className?: string;
}

/**
 * Props for lazy-loaded publishing setup component
 */
interface LazyPublishingSetupProps {
  project: Project;
  onComplete: () => void;
  className?: string;
}

/**
 * Props for lazy-loaded GOAP visualizer component
 */
interface LazyGoapVisualizerProps {
  project: Project;
  currentAction: AgentAction;
}

// Export lazy components with proper Suspense wrappers
export const LazyAnalyticsDashboard: React.FC<LazyAnalyticsDashboardProps> = ({
  project,
  onClose,
  className,
}) => (
  <Suspense fallback={<AnalyticsLoading />}>
    <AnalyticsDashboard project={project} onClose={onClose} className={className} />
  </Suspense>
);

export const LazyBookViewer: React.FC<LazyBookViewerProps> = props => (
  <Suspense fallback={<BookViewerLoading />}>
    <BookViewer {...props} />
  </Suspense>
);

export const LazyWorldBuildingDashboard: React.FC<LazyWorldBuildingDashboardProps> = ({
  projectId,
}) => (
  <Suspense fallback={<WorldBuildingLoading />}>
    <WorldBuildingDashboard projectId={projectId} />
  </Suspense>
);

export const LazyPublishingDashboard: React.FC<LazyPublishingDashboardProps> = ({
  project,
  onClose,
  className,
}) => (
  <Suspense fallback={<PublishingLoading />}>
    <PublishingDashboard project={project} onClose={onClose} className={className} />
  </Suspense>
);

export const LazyPublishingSetup: React.FC<LazyPublishingSetupProps> = ({
  project,
  onPublishingComplete,
  onClose,
  className,
}) => (
  <Suspense fallback={<PublishingLoading />}>
    <PublishingSetup
      project={project}
      onPublishingComplete={onPublishingComplete}
      onClose={onClose}
      className={className}
    />
  </Suspense>
);

export const LazyGoapVisualizer: React.FC<LazyGoapVisualizerProps> = ({
  project,
  currentAction,
}) => (
  <Suspense
    fallback={
      <div className='mb-4 rounded-lg border border-border bg-card p-4 shadow-sm'>
        <div className='flex animate-pulse items-center justify-between'>
          <div className='h-4 w-20 rounded bg-muted' />
          <div className='h-4 w-4 rounded bg-muted' />
        </div>
      </div>
    }
  >
    <GoapVisualizer project={project} currentAction={currentAction} />
  </Suspense>
);
