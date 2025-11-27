import React from 'react';
import { motion } from 'framer-motion';
import { Award } from 'lucide-react';
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

const ProgressRing: React.FC<ProgressRingProps> = ({
  value,
  max,
  size = 120,
  strokeWidth = 8,
  color = '#3B82F6',
  label
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const progress = Math.min(value / max, 1);
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (progress * circumference);

  return (
    <div className="relative flex items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          className="text-secondary/30"
        />
        {/* Progress circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </svg>

      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-2xl font-bold font-serif">
          {Math.round(progress * 100)}%
        </span>
        {label && (
          <span className="text-xs text-muted-foreground mt-1">{label}</span>
        )}
      </div>
    </div>
  );
};

export const GoalsProgress: React.FC<GoalsProgressProps> = ({
  chaptersCompleted,
  totalChapters,
  weeklyWords,
  weeklyGoal = 10000,
  consistency,
  className
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className={className}
    >
      <h3 className="font-serif font-semibold text-lg mb-4 flex items-center gap-2">
        <Award className="w-5 h-5 text-primary" />
        Progress & Goals
      </h3>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-6 text-center">
          <ProgressRing
            value={chaptersCompleted}
            max={totalChapters}
            color="#3B82F6"
            label="Chapters"
          />
          <p className="text-sm text-muted-foreground mt-4">
            {chaptersCompleted} of {totalChapters} chapters completed
          </p>
        </Card>

        <Card className="p-6 text-center">
          <ProgressRing
            value={weeklyWords}
            max={weeklyGoal}
            color="#10B981"
            label="Weekly Goal"
          />
          <p className="text-sm text-muted-foreground mt-4">
            {weeklyWords.toLocaleString()} of {weeklyGoal.toLocaleString()} weekly words
          </p>
        </Card>

        <Card className="p-6 text-center">
          <ProgressRing
            value={consistency}
            max={100}
            color="#F59E0B"
            label="Consistency"
          />
          <p className="text-sm text-muted-foreground mt-4">
            Writing consistency score
          </p>
        </Card>
      </div>
    </motion.div>
  );
};

export default GoalsProgress;
