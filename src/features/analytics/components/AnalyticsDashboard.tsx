/**
 * Analytics Dashboard
 * Main container for analytics views - Refactored for better maintainability
 */

import { motion } from 'framer-motion';
import React, { useState, useCallback, useMemo, useEffect } from 'react';

import AnalyticsContent from '@/features/analytics/components/AnalyticsContent';
import AnalyticsHeader from '@/features/analytics/components/AnalyticsHeader';
import AnalyticsSidebar from '@/features/analytics/components/AnalyticsSidebar';
import { cn } from '@/lib/utils';
import type { Project } from '@/types';
import { ChapterStatus } from '@/types';

// Type for active views
type AnalyticsView = 'overview' | 'productivity' | 'goals' | 'timeline';

interface AnalyticsDashboardProps {
  project: Project;
  onClose: () => void;
  className?: string;
}

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = React.memo(
  ({ project, onClose, className }) => {
    const [activeView, setActiveView] = useState<AnalyticsView>('overview');
    const [isCompact, setIsCompact] = useState(false);

    // Memoized export data to optimize performance
    const exportData = useMemo(
      () => ({
        project: project.title,
        exportDate: new Date().toISOString(),
        chapters: project.chapters.length,
        totalWords: project.chapters.reduce((sum, ch) => sum + (ch.wordCount || 0), 0),
        completed: project.chapters.filter(ch => ch.status === ChapterStatus.COMPLETE).length,
      }),
      [project.title, project.chapters],
    );

    const handleExport = useCallback((): void => {
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${project.title}-analytics.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, [exportData, project.title]);

    const handleToggleCompact = useCallback((): void => {
      setIsCompact(prev => !prev);
    }, []);

    const handleRefresh = useCallback((): void => {
      // Handle refresh logic - could trigger data reload
    }, []);

    // Enhanced keyboard navigation
    useEffect(() => {
      const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          onClose();
        } else if (event.ctrlKey || event.metaKey) {
          switch (event.key) {
            case 'e':
              event.preventDefault();
              handleExport();
              break;
            case 'r':
              event.preventDefault();
              handleRefresh();
              break;
            case 'd':
              event.preventDefault();
              handleToggleCompact();
              break;
          }
        }
      };

      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }, [onClose, handleExport, handleRefresh, handleToggleCompact]);

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        role='dialog'
        aria-modal='true'
        aria-labelledby='analytics-dashboard-title'
        className={cn(
          'fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm',
          className,
        )}
      >
        <div
          className={cn(
            'rounded-lg border border-border bg-background shadow-2xl',
            'flex h-[90vh] w-full max-w-7xl flex-col overflow-hidden',
          )}
        >
          {/* Header */}
          <AnalyticsHeader
            project={project}
            isCompact={isCompact}
            onToggleCompact={handleToggleCompact}
            onExport={handleExport}
            onRefresh={handleRefresh}
            onClose={onClose}
          />

          {/* Content */}
          <div className='flex flex-1 overflow-hidden'>
            {/* Sidebar */}
            <div className='w-64 overflow-y-auto border-r border-border/50 bg-card/20 p-4'>
              <AnalyticsSidebar
                project={project}
                activeView={activeView}
                onViewChange={(view: string) => setActiveView(view as AnalyticsView)}
              />
            </div>

            {/* Main Content */}
            <div className='flex-1 overflow-y-auto p-6'>
              <AnalyticsContent project={project} activeView={activeView} />
            </div>
          </div>
        </div>
      </motion.div>
    );
  },
);

AnalyticsDashboard.displayName = 'AnalyticsDashboard';

export default AnalyticsDashboard;
