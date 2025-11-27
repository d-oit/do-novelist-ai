import React from 'react';
import { motion } from 'framer-motion';
import {
  Eye,
  Star,
  Users,
  Download,
  Clock,
  Target,
  Share2,
  BarChart3,
  Activity
} from 'lucide-react';
import MetricCard from '../../../components/ui/MetricCard';
import type { PublishingAnalytics, ReaderEngagement } from '../types';

interface MetricsOverviewProps {
  analytics: PublishingAnalytics;
  engagement: ReaderEngagement | null;
  averageRating: number;
}

export const MetricsOverview: React.FC<MetricsOverviewProps> = ({
  analytics,
  engagement,
  averageRating
}) => {
  return (
    <>
      {/* Key Metrics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <h3 className="font-serif font-semibold text-lg mb-4 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-primary" />
          Performance Overview
        </h3>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            icon={<Eye className="w-6 h-6" />}
            title="Total Views"
            value={analytics.views}
            change={15.2}
            color="text-blue-500"
          />

          <MetricCard
            icon={<Users className="w-6 h-6" />}
            title="Unique Readers"
            value={analytics.uniqueVisitors}
            change={8.7}
            color="text-green-500"
          />

          <MetricCard
            icon={<Star className="w-6 h-6" />}
            title="Average Rating"
            value={averageRating}
            format="rating"
            change={2.1}
            color="text-yellow-500"
          />

          <MetricCard
            icon={<Download className="w-6 h-6" />}
            title="Downloads"
            value={analytics.downloads}
            change={-3.2}
            color="text-purple-500"
          />
        </div>
      </motion.div>

      {/* Engagement Metrics */}
      {engagement && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h3 className="font-serif font-semibold text-lg mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" />
            Reader Engagement
          </h3>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <MetricCard
              icon={<Clock className="w-6 h-6" />}
              title="Avg. Reading Time"
              value={`${Math.round(engagement.averageReadingTime)} min`}
              change={12.3}
              color="text-indigo-500"
            />

            <MetricCard
              icon={<Target className="w-6 h-6" />}
              title="Completion Rate"
              value={engagement.completionRate}
              format="percentage"
              change={-2.1}
              color="text-emerald-500"
            />

            <MetricCard
              icon={<Share2 className="w-6 h-6" />}
              title="Social Shares"
              value={engagement.socialEngagement.shares}
              change={25.7}
              color="text-pink-500"
            />
          </div>
        </motion.div>
      )}
    </>
  );
};
