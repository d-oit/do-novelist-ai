import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Globe, BookOpen, RefreshCw, X } from 'lucide-react';
import { usePublishingAnalytics } from '../hooks/usePublishingAnalytics';
import { Project } from '../../../types';
import { Button } from '../../../components/ui/Button';
import { AlertsSection } from './AlertsSection';
import { FeedbackWidget } from './FeedbackWidget';
import { PlatformStatusGrid } from './PlatformStatusGrid';
import { MetricsOverview } from './MetricsOverview';
import { cn } from '../../../lib/utils';

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
  className
}) => {
  const analytics = usePublishingAnalytics();
  const [selectedTimeframe, setSelectedTimeframe] = useState<'7d' | '30d' | '90d'>('30d');
  const [feedbackFilter, setFeedbackFilter] = useState<'all' | 'positive' | 'negative'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAlerts, setShowAlerts] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (publicationId) {
      analytics.loadPublicationData(publicationId);
      const days = selectedTimeframe === '7d' ? 7 : selectedTimeframe === '30d' ? 30 : 90;
      analytics.loadTrends(publicationId, days);
    }
  }, [publicationId, selectedTimeframe]);

  const refreshData = async () => {
    if (!publicationId) return;
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
    let filtered = feedbackFilter === 'all'
      ? analytics.feedback
      : analytics.filterFeedback(undefined, feedbackFilter);

    if (searchQuery) {
      filtered = analytics.searchFeedback(searchQuery);
    }
    return filtered;
  }, [analytics.feedback, feedbackFilter, searchQuery, analytics]);

  if (!analytics.analytics) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <BookOpen className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
          <h3 className="font-medium text-lg mb-2">No Publication Data</h3>
          <p className="text-muted-foreground">
            Publish your project first to see analytics data.
          </p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className={cn(
        "flex flex-col h-full bg-card/50 backdrop-blur-sm border border-border/40 rounded-lg overflow-hidden",
        className
      )}
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-border/40 bg-gradient-to-r from-purple-500/5 via-transparent to-blue-500/5">
        <div className="flex items-center gap-3">
          <Globe className="w-6 h-6 text-primary" />
          <div>
            <h2 className="font-serif font-semibold text-xl">Publishing Analytics</h2>
            <p className="text-sm text-muted-foreground">
              Reader engagement for "{project.title}"
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex rounded border border-border overflow-hidden">
            {(['7d', '30d', '90d'] as const).map((period) => (
              <button
                key={period}
                onClick={() => setSelectedTimeframe(period)}
                className={cn(
                  "px-3 py-1 text-xs transition-colors",
                  selectedTimeframe === period
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary/50 text-muted-foreground hover:text-foreground"
                )}
              >
                {period}
              </button>
            ))}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={refreshData}
            disabled={isRefreshing}
            className="text-xs"
          >
            <RefreshCw className={cn("w-3 h-3 mr-1", isRefreshing && "animate-spin")} />
            Refresh
          </Button>

          <Button variant="outline" size="sm" onClick={onClose} className="text-xs">
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
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
