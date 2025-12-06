/**
 * Analytics Sidebar Component - Extracted from AnalyticsDashboard
 * Handles analytics navigation and quick stats
 */

import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, Target, Clock } from 'lucide-react';
import React from 'react';

import { cn } from '../../../lib/utils';
import type { Project } from '../../../shared/types';
import { ChapterStatus } from '../../../shared/types';

interface AnalyticsSidebarProps {
  project: Project;
  activeView: string;
  onViewChange: (view: string) => void;
  className?: string;
}

const AnalyticsSidebar: React.FC<AnalyticsSidebarProps> = ({
  project,
  activeView,
  onViewChange,
  className,
}) => {
  const navigationItems = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'productivity', label: 'Productivity', icon: TrendingUp },
    { id: 'goals', label: 'Goals', icon: Target },
    { id: 'timeline', label: 'Timeline', icon: Clock },
  ];

  // Calculate quick stats
  const totalWords = project.chapters.reduce((sum, ch) => sum + (ch.wordCount || 0), 0);
  const completedChapters = project.chapters.filter(
    ch => ch.status === ChapterStatus.COMPLETE,
  ).length;

  const progressPercentage =
    project.chapters.length > 0
      ? Math.round((completedChapters / project.chapters.length) * 100)
      : 0;

  return (
    <div className={cn('space-y-6', className)}>
      {/* Quick Stats */}
      <div className='space-y-3'>
        <h3 className='text-sm font-semibold text-foreground'>Quick Stats</h3>
        <div className='space-y-2'>
          <div className='flex items-center justify-between rounded-lg bg-card/50 p-2'>
            <span className='text-sm text-muted-foreground'>Total Words</span>
            <span className='font-medium text-foreground'>{totalWords.toLocaleString()}</span>
          </div>
          <div className='flex items-center justify-between rounded-lg bg-card/50 p-2'>
            <span className='text-sm text-muted-foreground'>Chapters</span>
            <span className='font-medium text-foreground'>
              {completedChapters}/{project.chapters.length}
            </span>
          </div>
          <div className='flex items-center justify-between rounded-lg bg-card/50 p-2'>
            <span className='text-sm text-muted-foreground'>Progress</span>
            <span className='font-medium text-foreground'>{progressPercentage}%</span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className='space-y-2'>
        <h3 className='text-sm font-semibold text-foreground'>Views</h3>
        <div className='space-y-1'>
          {navigationItems.map(item => {
            const Icon = item.icon;
            const isActive = activeView === item.id;

            return (
              <motion.button
                key={item.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onViewChange(item.id)}
                className={cn(
                  'w-full rounded-lg p-3 text-left transition-all',
                  'border border-border/50 hover:border-primary/50',
                  isActive
                    ? 'border-primary bg-primary/10 shadow-md shadow-primary/10'
                    : 'bg-card/50 hover:bg-card',
                )}
              >
                <div className='flex items-center gap-3'>
                  <Icon className='h-4 w-4 text-primary' />
                  <span className='text-sm font-medium text-foreground'>{item.label}</span>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsSidebar;
