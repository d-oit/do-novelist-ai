/**
 * Analytics Dashboard - Refactored to use smaller components
 * Main container for analytics views
 */

import { motion } from 'framer-motion';
import { X, Download, RefreshCw, Eye, EyeOff } from 'lucide-react';
import React, { useState, useCallback } from 'react';

import { Button } from '../../../components/ui/Button';
import { cn } from '../../../lib/utils';
import { Project, ChapterStatus } from '../../../types';

import AnalyticsContent from './AnalyticsContent';
import AnalyticsSidebar from './AnalyticsSidebar';

interface AnalyticsDashboardProps {
  project: Project;
  onClose: () => void;
  className?: string;
}

const AnalyticsDashboardRefactored: React.FC<AnalyticsDashboardProps> = React.memo(
  ({ project, onClose, className }) => {
    const [activeView, setActiveView] = useState('overview');
    const [isCompact, setIsCompact] = useState(false);

    const handleExport = useCallback((): void => {
      // Export analytics data
      const data = {
        project: project.title,
        exportDate: new Date().toISOString(),
        chapters: project.chapters.length,
        totalWords: project.chapters.reduce((sum, ch) => sum + (ch.wordCount || 0), 0),
        completed: project.chapters.filter(ch => ch.status === ChapterStatus.COMPLETE).length,
      };

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${project.title}-analytics.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, [project.title, project.chapters]);

    const handleToggleCompact = useCallback(() => {
      setIsCompact(prev => !prev);
    }, []);

    const handleRefresh = useCallback(() => {
      // Handle refresh logic
    }, []);

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
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
          <div className='flex items-center justify-between border-b border-border/50 bg-card/30 p-4'>
            <div className='flex items-center gap-3'>
              <h2 className='text-xl font-semibold text-foreground'>Analytics Dashboard</h2>
              <span className='text-sm text-muted-foreground'>{project.title}</span>
            </div>

            <div className='flex items-center gap-2'>
              <Button size='sm' variant='outline' onClick={handleToggleCompact}>
                {isCompact ? <Eye className='h-4 w-4' /> : <EyeOff className='h-4 w-4' />}
                {isCompact ? 'Detailed' : 'Compact'}
              </Button>

              <Button size='sm' variant='outline' onClick={handleExport}>
                <Download className='h-4 w-4' />
                Export
              </Button>

              <Button size='sm' variant='outline' onClick={handleRefresh}>
                <RefreshCw className='h-4 w-4' />
                Refresh
              </Button>

              <Button size='sm' variant='outline' onClick={onClose}>
                <X className='h-4 w-4' />
                Close
              </Button>
            </div>
          </div>

          {/* Content */}
          <div className='flex flex-1 overflow-hidden'>
            {/* Sidebar */}
            <div className='w-64 overflow-y-auto border-r border-border/50 bg-card/20 p-4'>
              <AnalyticsSidebar
                project={project}
                activeView={activeView}
                onViewChange={setActiveView}
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

AnalyticsDashboardRefactored.displayName = 'AnalyticsDashboardRefactored';

export default AnalyticsDashboardRefactored;
