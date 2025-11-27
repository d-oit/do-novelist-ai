import React from 'react';
import { motion } from 'framer-motion';
import {
  BookOpen,
  Target,
  Clock,
  Zap,
  PieChart,
  Flame,
  Brain,
  Activity
} from 'lucide-react';
import MetricCard from '../../../components/ui/MetricCard';

interface WritingStatsCardProps {
  totalWords: number;
  chaptersCompleted: number;
  totalChapters: number;
  timeSpent: number;
  productivity: number;
  weeklyWords: number;
  currentStreak: number;
  aiAssistance: number;
  className?: string;
}

export const WritingStatsCard: React.FC<WritingStatsCardProps> = ({
  totalWords,
  chaptersCompleted,
  totalChapters,
  timeSpent,
  productivity,
  weeklyWords,
  currentStreak,
  aiAssistance,
  className
}) => {
  const completionPercentage = Math.round((chaptersCompleted / Math.max(totalChapters, 1)) * 100);
  const timeHours = Math.round(timeSpent / 60);
  const timeMinutes = Math.round(timeSpent % 60);

  return (
    <div className={className}>
      {/* Writing Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <h3 className="font-serif font-semibold text-lg mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5 text-primary" />
          Writing Overview
        </h3>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Total Words"
            value={totalWords}
            icon={<BookOpen className="w-5 h-5" />}
            color="text-blue-500"
            variant="success"
          />

          <MetricCard
            title="Chapters"
            value={`${chaptersCompleted}/${totalChapters}`}
            suffix={` (${completionPercentage}%)`}
            icon={<Target className="w-5 h-5" />}
            color="text-green-500"
          />

          <MetricCard
            title="Time Invested"
            value={`${timeHours}h ${timeMinutes}m`}
            icon={<Clock className="w-5 h-5" />}
            color="text-purple-500"
          />

          <MetricCard
            title="Productivity"
            value={Math.round(productivity)}
            suffix=" wph"
            icon={<Zap className="w-5 h-5" />}
            color="text-orange-500"
          />
        </div>
      </motion.div>

      {/* Weekly Performance */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mt-6"
      >
        <h3 className="font-serif font-semibold text-lg mb-4 flex items-center gap-2">
          <PieChart className="w-5 h-5 text-primary" />
          This Week's Performance
        </h3>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <MetricCard
            title="Weekly Words"
            value={weeklyWords}
            change={15}
            icon={<PieChart className="w-5 h-5" />}
            color="text-emerald-500"
            variant="success"
          />

          <MetricCard
            title="Writing Streak"
            value={`${currentStreak} days`}
            icon={<Flame className="w-5 h-5" />}
            color="text-red-500"
          />

          <MetricCard
            title="AI Assistance"
            value={Math.round(aiAssistance)}
            suffix="%"
            icon={<Brain className="w-5 h-5" />}
            color="text-violet-500"
          />
        </div>
      </motion.div>
    </div>
  );
};

export default WritingStatsCard;
