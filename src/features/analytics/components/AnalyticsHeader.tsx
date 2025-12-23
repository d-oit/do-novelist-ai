/**
 * Analytics Header Component
 * Extracted from AnalyticsDashboard for better separation of concerns
 */

import { X, Download, RefreshCw, Eye, EyeOff } from 'lucide-react';
import React from 'react';

import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import type { Project } from '@/types';

interface AnalyticsHeaderProps {
  project: Project;
  isCompact: boolean;
  onToggleCompact: () => void;
  onExport: () => void;
  onRefresh: () => void;
  onClose: () => void;
  className?: string;
}

const AnalyticsHeader: React.FC<AnalyticsHeaderProps> = ({
  project,
  isCompact,
  onToggleCompact,
  onExport,
  onRefresh,
  onClose,
  className,
}) => {
  return (
    <div
      className={cn(
        'flex items-center justify-between border-b border-border/50 bg-card/30 p-4',
        className,
      )}
    >
      <div className='flex items-center gap-3'>
        <h2 className='text-xl font-semibold text-foreground'>Analytics Dashboard</h2>
        <span className='text-sm text-muted-foreground'>{project.title}</span>
      </div>

      <div className='flex items-center gap-2'>
        <Button
          size='sm'
          variant='outline'
          onClick={onToggleCompact}
          aria-label={isCompact ? 'Switch to detailed view' : 'Switch to compact view'}
        >
          {isCompact ? <Eye className='h-4 w-4' /> : <EyeOff className='h-4 w-4' />}
          {isCompact ? 'Detailed' : 'Compact'}
        </Button>

        <Button size='sm' variant='outline' onClick={onExport} aria-label='Export analytics data'>
          <Download className='h-4 w-4' />
          Export
        </Button>

        <Button size='sm' variant='outline' onClick={onRefresh} aria-label='Refresh analytics data'>
          <RefreshCw className='h-4 w-4' />
          Refresh
        </Button>

        <Button
          size='sm'
          variant='outline'
          onClick={onClose}
          aria-label='Close analytics dashboard'
        >
          <X className='h-4 w-4' />
          Close
        </Button>
      </div>
    </div>
  );
};

export default AnalyticsHeader;
