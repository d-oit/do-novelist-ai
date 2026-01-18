import { motion } from 'framer-motion';
import { TrendingUp, Flame, Brain, Target } from 'lucide-react';
import React, { useMemo } from 'react';

import { Card } from '@/shared/components/ui/Card';

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

export const SessionTimeline: React.FC<SessionTimelineProps> = React.memo(
  ({ insights, className }) => {
    // Memoize computed values
    const roundedProductivity = useMemo(
      () => Math.round(insights.productivity),
      [insights.productivity],
    );
    const roundedAIAssistance = useMemo(
      () => Math.round(insights.aiAssistance),
      [insights.aiAssistance],
    );

    const streakMessage = useMemo(
      () => (insights.currentStreak >= 7 ? 'on fire' : 'building momentum'),
      [insights.currentStreak],
    );

    const aiBalanceMessage = useMemo(
      () =>
        insights.aiAssistance > 30
          ? 'consider more original writing'
          : 'good balance of creativity',
      [insights.aiAssistance],
    );

    const milestoneMessage = useMemo(() => {
      if (insights.totalWords < 10000) return '10K words milestone ahead';
      if (insights.totalWords < 50000) return '50K words - halfway to novel';
      return 'Novel length achieved!';
    }, [insights.totalWords]);
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className={className}
      >
        <h3 className='mb-4 flex items-center gap-2 font-serif text-lg font-semibold'>
          <Brain className='h-5 w-5 text-primary' data-testid='header-brain-icon' />
          AI Insights & Recommendations
        </h3>

        <div className='grid grid-cols-1 gap-4 lg:grid-cols-2'>
          <Card className='border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 p-4 dark:border-blue-800 dark:from-blue-950/20 dark:to-indigo-950/20'>
            <div className='flex items-start gap-3'>
              <TrendingUp className='mt-1 h-5 w-5 text-blue-600' />
              <div>
                <h4 className='font-medium text-blue-900 dark:text-blue-100'>Peak Performance</h4>
                <p className='mt-1 text-sm text-blue-700 dark:text-blue-200'>
                  You write best between 9-11 AM with an average of{' '}
                  <span data-testid='productivity-value'>{roundedProductivity}</span> words/hour.
                </p>
              </div>
            </div>
          </Card>

          <Card className='border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 p-4 dark:border-green-800 dark:from-green-950/20 dark:to-emerald-950/20'>
            <div className='flex items-start gap-3'>
              <Flame className='mt-1 h-5 w-5 text-green-600' />
              <div>
                <h4 className='font-medium text-green-900 dark:text-green-100'>Streak Power</h4>
                <p className='mt-1 text-sm text-green-700 dark:text-green-200'>
                  <span data-testid='streak-header'>{insights.currentStreak} day streak!</span>{' '}
                  You're <span data-testid='streak-message'>{streakMessage}</span>.
                </p>
              </div>
            </div>
          </Card>

          <Card className='border-purple-200 bg-gradient-to-br from-purple-50 to-violet-50 p-4 dark:border-purple-800 dark:from-purple-950/20 dark:to-violet-950/20'>
            <div className='flex items-start gap-3'>
              <Brain className='mt-1 h-5 w-5 text-purple-600' data-testid='card-brain-icon' />
              <div>
                <h4 className='font-medium text-purple-900 dark:text-purple-100'>AI Balance</h4>
                <p className='mt-1 text-sm text-purple-700 dark:text-purple-200'>
                  <span data-testid='ai-percentage'>{roundedAIAssistance}%</span> AI assistance -{' '}
                  <span data-testid='ai-message'>{aiBalanceMessage}</span>.
                </p>
              </div>
            </div>
          </Card>

          <Card className='border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50 p-4 dark:border-orange-800 dark:from-orange-950/20 dark:to-amber-950/20'>
            <div className='flex items-start gap-3'>
              <Target className='mt-1 h-5 w-5 text-orange-600' />
              <div>
                <h4 className='font-medium text-orange-900 dark:text-orange-100'>Next Milestone</h4>
                <p className='mt-1 text-sm text-orange-700 dark:text-orange-200'>
                  {milestoneMessage}
                </p>
              </div>
            </div>
          </Card>
        </div>
      </motion.div>
    );
  },
);

SessionTimeline.displayName = 'SessionTimeline';

export default SessionTimeline;
