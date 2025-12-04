import { motion } from 'framer-motion';
import { Award } from 'lucide-react';
import React, { useMemo } from 'react';

import { Card } from '../../../components/ui/Card';

interface GoalsProgressProps {
  chaptersCompleted: number;
  totalChapters: number;
  weeklyWords: number;
  weeklyGoal?: number;
  consistency: number;
  className?: string;
}

interface ProgressRingProps {
  value: number;
  max: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  label?: string;
}

const ProgressRing: React.FC<ProgressRingProps> = React.memo(
  ({ value, max, size = 120, strokeWidth = 8, color = '#3B82F6', label }) => {
    const { radius, circumference, progress, strokeDasharray, strokeDashoffset } = useMemo(() => {
      const r = (size - strokeWidth) / 2;
      const c = r * 2 * Math.PI;
      const p = Math.min(value / max, 1);
      return {
        radius: r,
        circumference: c,
        progress: p,
        strokeDasharray: c,
        strokeDashoffset: c - p * c,
      };
    }, [value, max, size, strokeWidth]);

    return (
      <div className='relative flex items-center justify-center'>
        <svg width={size} height={size} className='-rotate-90 transform'>
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke='currentColor'
            strokeWidth={strokeWidth}
            fill='transparent'
            className='text-secondary/30'
          />
          {/* Progress circle */}
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            fill='transparent'
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap='round'
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1, ease: 'easeOut' }}
          />
        </svg>

        {/* Center content */}
        <div className='absolute inset-0 flex flex-col items-center justify-center text-center'>
          <span className='font-serif text-2xl font-bold'>{Math.round(progress * 100)}%</span>
          {label != null && <span className='mt-1 text-xs text-muted-foreground'>{label}</span>}
        </div>
      </div>
    );
  },
);

ProgressRing.displayName = 'ProgressRing';

export const GoalsProgress: React.FC<GoalsProgressProps> = React.memo(
  ({
    chaptersCompleted,
    totalChapters,
    weeklyWords,
    weeklyGoal = 10000,
    consistency,
    className,
  }) => {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className={className}
      >
        <h3 className='mb-4 flex items-center gap-2 font-serif text-lg font-semibold'>
          <Award className='h-5 w-5 text-primary' />
          Progress & Goals
        </h3>

        <div className='grid grid-cols-1 gap-6 lg:grid-cols-3'>
          <Card className='p-6 text-center'>
            <ProgressRing
              value={chaptersCompleted}
              max={totalChapters}
              color='#3B82F6'
              label='Chapters'
            />
            <p className='mt-4 text-sm text-muted-foreground'>
              {chaptersCompleted} of {totalChapters} chapters completed
            </p>
          </Card>

          <Card className='p-6 text-center'>
            <ProgressRing
              value={weeklyWords}
              max={weeklyGoal}
              color='#10B981'
              label='Weekly Goal'
            />
            <p className='mt-4 text-sm text-muted-foreground'>
              {weeklyWords.toLocaleString()} of {weeklyGoal.toLocaleString()} weekly words
            </p>
          </Card>

          <Card className='p-6 text-center'>
            <ProgressRing value={consistency} max={100} color='#F59E0B' label='Consistency' />
            <p className='mt-4 text-sm text-muted-foreground'>Writing consistency score</p>
          </Card>
        </div>
      </motion.div>
    );
  },
);

GoalsProgress.displayName = 'GoalsProgress';

export default GoalsProgress;
