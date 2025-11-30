/**
 * Analytics Content Component - Extracted from AnalyticsDashboard
 * Handles main analytics display area
 */

import React from 'react';

import { cn } from '../../../lib/utils';
import { Project } from '../../../types';

import GoalsProgress from './GoalsProgress';
import ProductivityChart from './ProductivityChart';
import SessionTimeline from './SessionTimeline';
import WritingStatsCard from './WritingStatsCard';

interface AnalyticsContentProps {
  project: Project;
  activeView: string;
  className?: string;
}

const AnalyticsContent: React.FC<AnalyticsContentProps> = ({ project, activeView, className }) => {
  const stats = {
    totalWords:
      project.analytics?.totalWordCount ??
      project.chapters.reduce(
        (sum, chapter) => sum + chapter.content.split(/\s+/).filter(Boolean).length,
        0,
      ),
    chaptersCompleted: project.worldState.chaptersCompleted,
    totalChapters: project.worldState.chaptersCount,
    timeSpent: project.analytics?.estimatedReadingTime ?? 0,
    productivity:
      project.analytics?.averageChapterLength && project.analytics?.averageChapterLength > 0
        ? project.analytics.averageChapterLength
        : project.worldState.chaptersCount > 0
          ? (project.analytics?.totalWordCount ?? 0) / Math.max(project.worldState.chaptersCount, 1)
          : 0,
    weeklyWords: project.analytics?.totalWordCount ?? 0,
    currentStreak: project.analytics?.editingRounds ?? 0,
    aiAssistance: project.analytics?.generationCost ?? 0,
  };

  const wordCountSeries = Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - index));
    const averageWords =
      stats.totalWords > 0
        ? Math.round(stats.totalWords / Math.max(1, stats.totalChapters || 1))
        : 0;
    const dateStr = date.toISOString().split('T')[0];
    return {
      date: dateStr ?? date.toISOString().substring(0, 10),
      value: Math.max(0, averageWords + index * 5),
      label: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    };
  });

  const productivitySeries = wordCountSeries.map((point, index) => ({
    date: point.date,
    value: Math.max(10, Math.round(stats.productivity) + index * 2),
    label: point.label ?? '',
  }));

  const consistencyScore = Math.min(100, stats.currentStreak * 10);

  const timelineInsights = {
    productivity: stats.productivity,
    currentStreak: stats.currentStreak,
    aiAssistance: stats.aiAssistance,
    totalWords: stats.totalWords,
  };

  const renderContent = (): JSX.Element => {
    switch (activeView) {
      case 'overview':
        return (
          <div className='space-y-6'>
            <div className='grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3'>
              <WritingStatsCard {...stats} />
              <WritingStatsCard {...stats} />
              <WritingStatsCard {...stats} />
            </div>
            <ProductivityChart
              wordCountData={wordCountSeries}
              productivityData={productivitySeries}
            />
          </div>
        );

      case 'productivity':
        return (
          <div className='space-y-6'>
            <ProductivityChart
              wordCountData={wordCountSeries}
              productivityData={productivitySeries}
            />
            <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
              <WritingStatsCard {...stats} />
              <WritingStatsCard {...stats} />
            </div>
          </div>
        );

      case 'goals':
        return (
          <div className='space-y-6'>
            <GoalsProgress
              chaptersCompleted={stats.chaptersCompleted}
              totalChapters={Math.max(stats.totalChapters, 1)}
              weeklyWords={stats.weeklyWords}
              consistency={consistencyScore}
            />
          </div>
        );

      case 'timeline':
        return (
          <div className='space-y-6'>
            <SessionTimeline insights={timelineInsights} />
          </div>
        );

      default:
        return (
          <div className='py-12 text-center'>
            <h3 className='mb-2 text-lg font-medium text-foreground'>Analytics Overview</h3>
            <p className='text-muted-foreground'>
              Select a view from the sidebar to see detailed analytics.
            </p>
          </div>
        );
    }
  };

  return <div className={cn('', className)}>{renderContent()}</div>;
};

export default AnalyticsContent;
