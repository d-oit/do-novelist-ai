/**
 * StyleAnalysisCard Component
 * Displays detailed style metrics including readability, tone, and recommendations
 */

import { BookOpen, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import React, { useState } from 'react';

import type { StyleAnalysisResult, StyleRecommendation } from '@/features/writing-assistant/types';
import { cn } from '@/lib/utils';

// ============================================================================
// Component
// ============================================================================

interface StyleAnalysisCardProps {
  analysis: StyleAnalysisResult;
  showRecommendations?: boolean;
  className?: string;
}

export const StyleAnalysisCard: React.FC<StyleAnalysisCardProps> = ({
  analysis,
  showRecommendations = true,
  className,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Calculate grade level display
  const getGradeLevelDisplay = (grade: number): string => {
    if (grade <= 5) return 'K-5';
    if (grade <= 8) return '6-8';
    if (grade <= 12) return '9-12';
    if (grade <= 16) return 'College';
    return 'Graduate';
  };

  // Get readability label
  const getReadabilityLabel = (score: number): string => {
    if (score >= 90) return 'Very Easy';
    if (score >= 80) return 'Easy';
    if (score >= 70) return 'Fairly Easy';
    if (score >= 60) return 'Standard';
    if (score >= 50) return 'Fairly Difficult';
    if (score >= 30) return 'Difficult';
    return 'Very Difficult';
  };

  // Group recommendations by category
  const recommendationsByCategory = showRecommendations
    ? analysis.styleRecommendations.reduce(
        (acc, rec) => {
          acc[rec.category] = acc[rec.category] ?? [];
          acc[rec.category]!.push(rec);
          return acc;
        },
        {} as Record<string, StyleRecommendation[]>,
      )
    : {};

  return (
    <div className={cn('rounded-lg bg-white shadow-sm dark:bg-gray-800', className)}>
      {/* Header */}
      <div className='flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-gray-700'>
        <div className='flex items-center gap-2'>
          <BookOpen className='h-5 w-5 text-indigo-500' />
          <h3 className='font-semibold text-gray-900 dark:text-white'>Style Analysis</h3>
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className='rounded p-1 transition-colors hover:bg-gray-100 dark:hover:bg-gray-700'
        >
          {isExpanded ? <ChevronUp className='h-5 w-5' /> : <ChevronDown className='h-5 w-5' />}
        </button>
      </div>

      {/* Quick metrics */}
      <div className='grid grid-cols-2 gap-4 p-4 md:grid-cols-4'>
        <MetricCard
          label='Readability'
          value={analysis.fleschReadingEase}
          max={100}
          suffix='/100'
          color={
            analysis.fleschReadingEase >= 60
              ? 'green'
              : analysis.fleschReadingEase >= 40
                ? 'amber'
                : 'red'
          }
        />
        <MetricCard
          label='Grade Level'
          value={Math.round(analysis.fleschKincaidGrade)}
          max={18}
          color='blue'
          customDisplay={getGradeLevelDisplay(analysis.fleschKincaidGrade)}
        />
        <MetricCard label='Tone' value={analysis.primaryTone} color='purple' />
        <MetricCard label='Voice' value={analysis.voiceType} color='indigo' />
      </div>

      {/* Expanded content */}
      {isExpanded && (
        <div className='space-y-6 px-4 pb-4'>
          {/* Detailed metrics */}
          <div>
            <h4 className='mb-3 text-sm font-medium text-gray-700 dark:text-gray-300'>
              Readability Metrics
            </h4>
            <div className='grid grid-cols-2 gap-3 md:grid-cols-3'>
              <MetricRow
                label='Flesch Reading Ease'
                value={analysis.fleschReadingEase}
                suffix='/100'
                status={getReadabilityLabel(analysis.fleschReadingEase)}
              />
              <MetricRow
                label='Flesch-Kincaid Grade'
                value={analysis.fleschKincaidGrade}
                suffix=''
              />
              <MetricRow label='Gunning Fog Index' value={analysis.gunningFogIndex} suffix='' />
              <MetricRow
                label='Avg Sentence Length'
                value={analysis.averageSentenceLength}
                suffix='words'
              />
              <MetricRow
                label='Avg Word Length'
                value={analysis.averageWordLength}
                suffix='chars'
              />
              <MetricRow label='Vocabulary' value={analysis.vocabularyComplexity} />
            </div>
          </div>

          {/* Tone analysis */}
          <div>
            <h4 className='mb-3 text-sm font-medium text-gray-700 dark:text-gray-300'>
              Tone Analysis
            </h4>
            <div className='rounded-lg bg-gray-50 p-3 dark:bg-gray-900/50'>
              <div className='mb-2 flex items-center justify-between'>
                <span className='font-medium'>{analysis.primaryTone}</span>
                <span className='text-sm text-gray-500'>Intensity: {analysis.toneIntensity}%</span>
              </div>
              <div className='h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700'>
                <div
                  className='h-full rounded-full bg-indigo-500 transition-all'
                  style={{ width: `${analysis.toneIntensity}%` }}
                />
              </div>
              {analysis.secondaryTone && (
                <p className='mt-2 text-sm text-gray-500'>Secondary: {analysis.secondaryTone}</p>
              )}
            </div>
          </div>

          {/* Voice & perspective */}
          <div>
            <h4 className='mb-3 text-sm font-medium text-gray-700 dark:text-gray-300'>
              Voice & Perspective
            </h4>
            <div className='grid grid-cols-3 gap-3'>
              <div className='rounded-lg bg-gray-50 p-3 text-center dark:bg-gray-900/50'>
                <div className='mb-1 text-xs text-gray-500'>Voice</div>
                <div className='font-medium capitalize'>{analysis.voiceType}</div>
              </div>
              <div className='rounded-lg bg-gray-50 p-3 text-center dark:bg-gray-900/50'>
                <div className='mb-1 text-xs text-gray-500'>Perspective</div>
                <div className='font-medium capitalize'>
                  {analysis.perspective.replace('_', ' ')}
                </div>
              </div>
              <div className='rounded-lg bg-gray-50 p-3 text-center dark:bg-gray-900/50'>
                <div className='mb-1 text-xs text-gray-500'>Tense</div>
                <div className='font-medium capitalize'>{analysis.tense}</div>
              </div>
            </div>
          </div>

          {/* Consistency score */}
          <div>
            <h4 className='mb-3 text-sm font-medium text-gray-700 dark:text-gray-300'>
              Consistency Score
            </h4>
            <div className='flex items-center gap-4'>
              <div className='h-3 flex-1 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700'>
                <div
                  className={cn(
                    'h-full rounded-full transition-all',
                    analysis.consistencyScore >= 80
                      ? 'bg-green-500'
                      : analysis.consistencyScore >= 60
                        ? 'bg-amber-500'
                        : 'bg-red-500',
                  )}
                  style={{ width: `${analysis.consistencyScore}%` }}
                />
              </div>
              <span className='font-medium'>{analysis.consistencyScore}%</span>
            </div>
            {analysis.consistencyIssues.length > 0 && (
              <div className='mt-2 space-y-1'>
                {analysis.consistencyIssues.slice(0, 3).map((issue, i) => (
                  <div
                    key={i}
                    className={cn(
                      'rounded p-2 text-xs',
                      issue.severity === 'major'
                        ? 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300'
                        : issue.severity === 'moderate'
                          ? 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300'
                          : 'bg-gray-50 text-gray-600 dark:bg-gray-900/20 dark:text-gray-400',
                    )}
                  >
                    {issue.description}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recommendations */}
          {showRecommendations && analysis.styleRecommendations.length > 0 && (
            <div>
              <h4 className='mb-3 text-sm font-medium text-gray-700 dark:text-gray-300'>
                Recommendations ({analysis.styleRecommendations.length})
              </h4>

              {/* Category filter */}
              <div className='mb-3 flex flex-wrap gap-2'>
                {Object.keys(recommendationsByCategory).map(category => (
                  <button
                    key={category}
                    onClick={() =>
                      setSelectedCategory(selectedCategory === category ? null : category)
                    }
                    className={cn(
                      'rounded-full border px-2 py-1 text-xs transition-colors',
                      selectedCategory === category
                        ? 'border-indigo-500 bg-indigo-500 text-white'
                        : 'border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800',
                    )}
                  >
                    {category} ({(recommendationsByCategory[category] ?? []).length})
                  </button>
                ))}
              </div>

              {/* Recommendation list */}
              <div className='space-y-2'>
                {Object.entries(recommendationsByCategory)
                  .filter(([category]) => !selectedCategory || category === selectedCategory)
                  .flatMap(([, recs]) => recs)
                  .map((rec, i) => (
                    <RecommendationItem key={i} recommendation={rec} />
                  ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// Metric Card Component
// ============================================================================

interface MetricCardProps {
  label: string;
  value: number | string;
  max?: number;
  suffix?: string;
  color?: 'green' | 'amber' | 'red' | 'blue' | 'purple' | 'indigo';
  customDisplay?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  max = 100,
  suffix = '',
  color = 'blue',
  customDisplay,
}) => {
  const percentage = typeof value === 'number' ? (value / max) * 100 : 0;

  const colorClasses = {
    green: 'text-green-600 dark:text-green-400',
    amber: 'text-amber-600 dark:text-amber-400',
    red: 'text-red-600 dark:text-red-400',
    blue: 'text-blue-600 dark:text-blue-400',
    purple: 'text-purple-600 dark:text-purple-400',
    indigo: 'text-indigo-600 dark:text-indigo-400',
  };

  return (
    <div className='rounded-lg bg-gray-50 p-3 dark:bg-gray-900/50'>
      <div className='mb-1 text-xs text-gray-500 dark:text-gray-400'>{label}</div>
      <div className={cn('text-xl font-bold', colorClasses[color])}>
        {customDisplay ?? (typeof value === 'number' ? Math.round(value * 10) / 10 : value)}
        {suffix}
      </div>
      {typeof value === 'number' && (
        <div className='mt-2 h-1 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700'>
          <div
            className={cn('h-full rounded-full', {
              'bg-green-500': color === 'green',
              'bg-amber-500': color === 'amber',
              'bg-red-500': color === 'red',
              'bg-blue-500': color === 'blue',
              'bg-purple-500': color === 'purple',
              'bg-indigo-500': color === 'indigo',
            })}
            style={{ width: `${percentage}%` }}
          />
        </div>
      )}
    </div>
  );
};

// ============================================================================
// Metric Row Component
// ============================================================================

interface MetricRowProps {
  label: string;
  value: number | string;
  suffix?: string;
  status?: string;
}

const MetricRow: React.FC<MetricRowProps> = ({ label, value, suffix = '', status }) => (
  <div className='flex items-center justify-between rounded bg-gray-50 p-2 dark:bg-gray-900/50'>
    <span className='text-sm text-gray-600 dark:text-gray-400'>{label}</span>
    <div className='flex items-center gap-2'>
      <span className='text-sm font-medium'>
        {typeof value === 'number' ? Math.round(value * 10) / 10 : value}
        {suffix}
      </span>
      {status && (
        <span className='rounded bg-green-100 px-1.5 py-0.5 text-xs text-green-700 dark:bg-green-900/30 dark:text-green-300'>
          {status}
        </span>
      )}
    </div>
  </div>
);

// ============================================================================
// Recommendation Item Component
// ============================================================================

interface RecommendationItemProps {
  recommendation: StyleRecommendation;
}

const RecommendationItem: React.FC<RecommendationItemProps> = ({ recommendation }) => {
  const priorityColors = {
    high: 'border-l-red-500 bg-red-50 dark:bg-red-900/10',
    medium: 'border-l-amber-500 bg-amber-50 dark:bg-amber-900/10',
    low: 'border-l-blue-500 bg-blue-50 dark:bg-blue-900/10',
  };

  return (
    <div className={cn('rounded-lg border-l-4 p-3', priorityColors[recommendation.priority])}>
      <div className='flex items-start justify-between gap-2'>
        <div>
          <h5 className='text-sm font-medium'>{recommendation.title}</h5>
          <p className='mt-1 text-sm text-gray-600 dark:text-gray-400'>
            {recommendation.description}
          </p>
        </div>
        {recommendation.priority === 'high' && (
          <AlertTriangle className='mt-0.5 h-4 w-4 flex-shrink-0 text-red-500' />
        )}
      </div>
      {recommendation.examples && recommendation.examples.length > 0 && (
        <div className='mt-2 space-y-1'>
          {recommendation.examples.map((example, i) => (
            <div
              key={i}
              className='border-l border-gray-300 pl-3 text-xs text-gray-500 dark:border-gray-600 dark:text-gray-400'
            >
              {example}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StyleAnalysisCard;
