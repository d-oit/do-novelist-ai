import React from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  Flame,
  Brain,
  Target
} from 'lucide-react';
import { Card } from '../../../components/ui/Card';

interface InsightData {
  productivity: number;
  currentStreak: number;
  aiAssistance: number;
  totalWords: number;
}

interface SessionTimelineProps {
  insights: InsightData;
  className?: string;
}

export const SessionTimeline: React.FC<SessionTimelineProps> = ({
  insights,
  className
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className={className}
    >
      <h3 className="font-serif font-semibold text-lg mb-4 flex items-center gap-2">
        <Brain className="w-5 h-5 text-primary" />
        AI Insights & Recommendations
      </h3>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-800">
          <div className="flex items-start gap-3">
            <TrendingUp className="w-5 h-5 text-blue-600 mt-1" />
            <div>
              <h4 className="font-medium text-blue-900 dark:text-blue-100">Peak Performance</h4>
              <p className="text-sm text-blue-700 dark:text-blue-200 mt-1">
                You write best between 9-11 AM with an average of {Math.round(insights.productivity)} words/hour.
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-200 dark:border-green-800">
          <div className="flex items-start gap-3">
            <Flame className="w-5 h-5 text-green-600 mt-1" />
            <div>
              <h4 className="font-medium text-green-900 dark:text-green-100">Streak Power</h4>
              <p className="text-sm text-green-700 dark:text-green-200 mt-1">
                {insights.currentStreak} day streak! You're {insights.currentStreak >= 7 ? 'on fire' : 'building momentum'}.
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-950/20 dark:to-violet-950/20 border-purple-200 dark:border-purple-800">
          <div className="flex items-start gap-3">
            <Brain className="w-5 h-5 text-purple-600 mt-1" />
            <div>
              <h4 className="font-medium text-purple-900 dark:text-purple-100">AI Balance</h4>
              <p className="text-sm text-purple-700 dark:text-purple-200 mt-1">
                {Math.round(insights.aiAssistance)}% AI assistance - {insights.aiAssistance > 30 ? 'consider more original writing' : 'good balance of creativity'}.
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20 border-orange-200 dark:border-orange-800">
          <div className="flex items-start gap-3">
            <Target className="w-5 h-5 text-orange-600 mt-1" />
            <div>
              <h4 className="font-medium text-orange-900 dark:text-orange-100">Next Milestone</h4>
              <p className="text-sm text-orange-700 dark:text-orange-200 mt-1">
                {insights.totalWords < 10000 ? '10K words milestone ahead' :
                 insights.totalWords < 50000 ? '50K words - halfway to novel' :
                 'Novel length achieved!'}
              </p>
            </div>
          </div>
        </Card>
      </div>
    </motion.div>
  );
};

export default SessionTimeline;
