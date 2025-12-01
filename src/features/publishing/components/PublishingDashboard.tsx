import { motion } from 'framer-motion';
import { Globe, BookOpen, RefreshCw, X } from 'lucide-react';
import React, { useState, useEffect, useMemo } from 'react';

import { Button } from '../../../components/ui/Button';
import { cn } from '../../../lib/utils';
import { Project } from '../../../types';
import { usePublishingAnalytics } from '../hooks/usePublishingAnalytics';

import { AlertsSection } from './AlertsSection';
import { FeedbackWidget } from './FeedbackWidget';
import { MetricsOverview } from './MetricsOverview';
import { PlatformStatusGrid } from './PlatformStatusGrid';

interface PublishingDashboardProps {
  project: Project;
  publicationId?: string;
  onClose: () => void;
  className?: string;
}

const PublishingDashboard: React.FC<PublishingDashboardProps> = ({
  project,
  publicationId,
  onClose,
  className,
}) => {
  const analytics = usePublishingAnalytics();
  const [selectedTimeframe, setSelectedTimeframe] = useState<'7d' | '30d' | '90d'>('30d');
  const [feedbackFilter, setFeedbackFilter] = useState<'all' | 'positive' | 'negative'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAlerts, setShowAlerts] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if ((publicationId?.length ?? 0) > 0) {
      void analytics.loadPublicationData(publicationId);
      const days = selectedTimeframe === '7d' ? 7 : selectedTimeframe === '30d' ? 30 : 90;
      void analytics.loadTrends(publicationId, days);
    }
  }, [publicationId, selectedTimeframe]);

  const refreshData = async (): Promise<void> => {
    if ((publicationId?.length ?? 0) === 0) return;
    setIsRefreshing(true);
    try {
      await analytics.refreshAnalytics(publicationId);
    } catch (error) {
      console.error('Failed to refresh analytics:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const filteredFeedback = useMemo(() => {
    let filtered =
      feedbackFilter === 'all'
        ? analytics.feedback
        : analytics.filterFeedback(undefined, feedbackFilter);

    if (searchQuery) {
      filtered = analytics.searchFeedback(searchQuery);
    }
    return filtered;
  }, [analytics.feedback, feedbackFilter, searchQuery, analytics]);

  if (!analytics.analytics) {
    return (
      <div className='flex items-center justify-center p-8'>
        <div className='text-center'>
          <BookOpen className='mx-auto mb-4 h-12 w-12 text-muted-foreground/50' />
          <h3 className='mb-2 text-lg font-medium'>No Publication Data</h3>
          <p className='text-muted-foreground'>Publish your project first to see analytics data.</p>
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
      <div className='flex items-center justify-between border-b border-border/40 bg-gradient-to-r from-purple-500/5 via-transparent to-blue-500/5 p-6'>
        <div className='flex items-center gap-3'>
          <Globe className='h-6 w-6 text-primary' />
          <div>
            <h2 className='font-serif text-xl font-semibold'>Publishing Analytics</h2>
            <p className='text-sm text-muted-foreground'>Reader engagement for "{project.title}"</p>
          </div>
        </div>

        <div className='flex items-center gap-2'>
          <div className='flex overflow-hidden rounded border border-border'>
            {(['7d', '30d', '90d'] as const).map(period => (
              <button
                key={period}
                onClick={() => setSelectedTimeframe(period)}
                className={cn(
                  'px-3 py-1 text-xs transition-colors',
                  selectedTimeframe === period
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary/50 text-muted-foreground hover:text-foreground',
                )}
              >
                {period}
              </button>
            ))}
          </div>

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

          <Button variant='outline' size='sm' onClick={onClose} className='text-xs'>
            <X className='h-4 w-4' />
          </Button>
        </div>
      </div>

      <div className='flex-1 space-y-6 overflow-y-auto p-6'>
        <AlertsSection
          alerts={analytics.alerts}
          onMarkAsRead={analytics.markAlertAsRead}
          onDismiss={analytics.dismissAlert}
          onClose={() => setShowAlerts(false)}
          showAlerts={showAlerts}
        />

        <MetricsOverview
          analytics={analytics.analytics}
          engagement={analytics.engagement}
          averageRating={analytics.averageRating}
        />

        <FeedbackWidget
          feedback={filteredFeedback}
          totalReviews={analytics.totalReviews}
          sentimentBreakdown={analytics.sentimentBreakdown}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          feedbackFilter={feedbackFilter}
          onFilterChange={setFeedbackFilter}
        />

        <PlatformStatusGrid insights={analytics.insights} />
      </div>
    </motion.div>
  );
};

export default PublishingDashboard;
