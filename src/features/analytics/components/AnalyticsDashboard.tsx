import { motion } from 'framer-motion';
import { BarChart3, Eye, EyeOff, Download, RefreshCw } from 'lucide-react';
import React, { useState, useEffect, useMemo, useCallback } from 'react';

import type { Project } from '@/types';

import { Button } from '../../../components/ui/Button';
import { cn } from '../../../lib/utils';
import { useAnalytics } from '../hooks/useAnalytics';

import GoalsProgress from './GoalsProgress';
import ProductivityChart from './ProductivityChart';
import SessionTimeline from './SessionTimeline';
import WritingStatsCard from './WritingStatsCard';

interface AnalyticsDashboardProps {
  project: Project;
  onClose: () => void;
  className?: string;
}

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = React.memo(
  ({ project, onClose, className }) => {
    const analytics = useAnalytics();
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [showAllStats, setShowAllStats] = useState(true);

    const loadData = useCallback(async (): Promise<void> => {
      await Promise.all([
        analytics.loadProjectAnalytics(project),
        analytics.loadWeeklyStats(),
        analytics.loadInsights(),
        analytics.loadWordCountChart(project.id),
      ]);
      analytics.loadProductivityChart();
    }, [project, analytics]);

    useEffect(() => {
      void loadData();
    }, [loadData]);

    const refreshData = async (): Promise<void> => {
      setIsRefreshing(true);
      try {
        await Promise.all([
          analytics.loadProjectAnalytics(project),
          analytics.loadWeeklyStats(),
          analytics.loadInsights(),
          analytics.loadWordCountChart(project.id),
        ]);
        analytics.loadProductivityChart();
      } catch (error) {
        console.error('Failed to refresh analytics:', error);
      } finally {
        setIsRefreshing(false);
      }
    };

    const exportData = async (): Promise<void> => {
      try {
        const data = await analytics.exportAnalytics('json');
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${project.title}_analytics_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
      } catch (error) {
        console.error('Failed to export analytics:', error);
      }
    };

    const stats = useMemo(() => {
      if (!analytics.projectAnalytics || !analytics.weeklyStats || !analytics.insights) {
        return null;
      }

      return {
        totalWords: analytics.projectAnalytics.totalWords,
        chaptersCompleted: analytics.projectAnalytics.completedChapters,
        totalChapters: analytics.projectAnalytics.totalChapters,
        timeSpent: analytics.projectAnalytics.timeSpent,
        weeklyWords: analytics.weeklyStats.totalWords,
        weeklyTime: analytics.weeklyStats.totalTime,
        currentStreak: analytics.insights.streaks.currentStreak,
        productivity: analytics.insights.productivity.averageWordsPerHour,
        aiAssistance: analytics.insights.aiUsage.assistancePercentage,
        consistency: analytics.insights.productivity.consistencyScore,
      };
    }, [analytics.projectAnalytics, analytics.weeklyStats, analytics.insights]);

    if (analytics.isLoading && !stats) {
      return (
        <div className='flex items-center justify-center p-8'>
          <div className='flex items-center gap-2 text-muted-foreground'>
            <BarChart3 className='h-4 w-4 animate-pulse' />
            Loading analytics dashboard...
          </div>
        </div>
      );
    }

    return (
      <motion.div
        className={cn(
          'flex h-full flex-col overflow-hidden rounded-lg border border-border/40 bg-card/50 backdrop-blur-sm',
          className,
        )}
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.98 }}
        transition={{ duration: 0.3 }}
      >
        {/* Header */}
        <div className='flex items-center justify-between border-b border-border/40 bg-gradient-to-r from-primary/5 via-transparent to-secondary/5 p-6'>
          <div className='flex items-center gap-3'>
            <BarChart3 className='h-6 w-6 text-primary' />
            <div>
              <h2 className='font-serif text-xl font-semibold'>Analytics Dashboard</h2>
              <p className='text-sm text-muted-foreground'>Insights for "{project.title}"</p>
            </div>
          </div>

          <div className='flex items-center gap-2'>
            <Button
              variant='outline'
              size='sm'
              onClick={() => setShowAllStats(!showAllStats)}
              className='text-xs'
            >
              {showAllStats ? (
                <EyeOff className='mr-1 h-3 w-3' />
              ) : (
                <Eye className='mr-1 h-3 w-3' />
              )}
              {showAllStats ? 'Compact' : 'Detailed'}
            </Button>

            <Button
              variant='outline'
              size='sm'
              onClick={() => void refreshData()}
              disabled={isRefreshing}
              className='text-xs'
            >
              <RefreshCw className={cn('mr-1 h-3 w-3', isRefreshing && 'animate-spin')} />
              Refresh
            </Button>

            <Button
              variant='outline'
              size='sm'
              onClick={() => void exportData()}
              className='text-xs'
            >
              <Download className='mr-1 h-3 w-3' />
              Export
            </Button>

            <Button variant='outline' size='sm' onClick={onClose} className='text-xs'>
              Close
            </Button>
          </div>
        </div>

        <div className='flex-1 space-y-6 overflow-y-auto p-6'>
          {stats && (
            <>
              <WritingStatsCard
                totalWords={stats.totalWords}
                chaptersCompleted={stats.chaptersCompleted}
                totalChapters={stats.totalChapters}
                timeSpent={stats.timeSpent}
                productivity={stats.productivity}
                weeklyWords={stats.weeklyWords}
                currentStreak={stats.currentStreak}
                aiAssistance={stats.aiAssistance}
              />

              {showAllStats && (
                <>
                  <ProductivityChart
                    wordCountData={analytics.wordCountChart}
                    productivityData={analytics.productivityChart}
                  />

                  <GoalsProgress
                    chaptersCompleted={stats.chaptersCompleted}
                    totalChapters={stats.totalChapters}
                    weeklyWords={stats.weeklyWords}
                    weeklyGoal={10000}
                    consistency={stats.consistency}
                  />

                  <SessionTimeline
                    insights={{
                      productivity: stats.productivity,
                      currentStreak: stats.currentStreak,
                      aiAssistance: stats.aiAssistance,
                      totalWords: stats.totalWords,
                    }}
                  />
                </>
              )}
            </>
          )}
        </div>
      </motion.div>
    );
  },
);

AnalyticsDashboard.displayName = 'AnalyticsDashboard';

export default AnalyticsDashboard;
