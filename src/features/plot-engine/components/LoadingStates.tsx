/**
 * Loading States for Plot Engine Components
 *
 * Skeleton loaders for various plot engine visualizations
 */

import React from 'react';

import { Card } from '@/shared/components/ui/Card';
import { Skeleton } from '@/shared/components/ui/Skeleton';

/**
 * Loading skeleton for StoryArcVisualizer
 */
export const StoryArcVisualizerSkeleton: React.FC = () => {
  return (
    <div className='space-y-6'>
      {/* Header */}
      <Card className='p-6'>
        <div className='mb-4 flex items-center justify-between'>
          <div className='space-y-2'>
            <Skeleton className='h-6 w-48' />
            <Skeleton className='h-4 w-64' />
          </div>
          <Skeleton className='h-10 w-32' />
        </div>
      </Card>

      {/* Tension Curve Chart */}
      <Card className='p-6'>
        <Skeleton className='mb-4 h-6 w-32' />
        <Skeleton className='h-64 w-full' />
      </Card>

      {/* Pacing Analysis */}
      <Card className='p-6'>
        <Skeleton className='mb-4 h-6 w-32' />
        <Skeleton className='h-64 w-full' />
      </Card>

      {/* Plot Points */}
      <Card className='p-6'>
        <Skeleton className='mb-4 h-6 w-32' />
        <div className='space-y-3'>
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className='h-20 w-full' />
          ))}
        </div>
      </Card>
    </div>
  );
};

/**
 * Loading skeleton for CharacterGraphView
 */
export const CharacterGraphViewSkeleton: React.FC = () => {
  return (
    <div className='space-y-6'>
      {/* Legend */}
      <Card className='p-4'>
        <Skeleton className='mb-3 h-5 w-24' />
        <div className='flex flex-wrap gap-3'>
          {[1, 2, 3, 4, 5, 6, 7].map(i => (
            <Skeleton key={i} className='h-6 w-24' />
          ))}
        </div>
      </Card>

      {/* Network Graph */}
      <Card className='p-6'>
        <Skeleton className='mb-4 h-6 w-32' />
        <Skeleton className='h-96 w-full' />
      </Card>

      {/* Relationship Cards */}
      <div className='grid gap-4 sm:grid-cols-2'>
        {[1, 2, 3, 4].map(i => (
          <Card key={i} className='p-4'>
            <Skeleton className='mb-2 h-5 w-32' />
            <Skeleton className='h-4 w-full' />
          </Card>
        ))}
      </div>
    </div>
  );
};

/**
 * Loading skeleton for PlotHoleDetectorView
 */
export const PlotHoleDetectorViewSkeleton: React.FC = () => {
  return (
    <div className='space-y-6'>
      {/* Overview Card */}
      <Card className='p-6'>
        <Skeleton className='mb-6 h-6 w-48' />
        <div className='mb-6 flex items-center justify-between'>
          <div className='space-y-2'>
            <Skeleton className='h-4 w-24' />
            <Skeleton className='h-12 w-24' />
          </div>
          <div className='space-y-2'>
            <Skeleton className='h-4 w-24' />
            <Skeleton className='h-12 w-24' />
          </div>
        </div>
        <Skeleton className='mb-6 h-4 w-full' />
        {/* Severity Breakdown */}
        <div className='grid grid-cols-4 gap-3'>
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className='h-20 w-full' />
          ))}
        </div>
      </Card>

      {/* Filters */}
      <Card className='p-6'>
        <div className='flex flex-wrap items-center gap-4'>
          <Skeleton className='h-10 w-48' />
          <Skeleton className='h-10 w-48' />
          <Skeleton className='h-10 w-48' />
          <Skeleton className='h-10 w-32' />
        </div>
      </Card>

      {/* Plot Holes List */}
      <Card className='p-6'>
        <Skeleton className='mb-4 h-6 w-32' />
        <div className='space-y-4'>
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className='h-32 w-full' />
          ))}
        </div>
      </Card>
    </div>
  );
};

/**
 * Loading skeleton for PlotGenerator
 */
export const PlotGeneratorSkeleton: React.FC = () => {
  return (
    <div className='space-y-6'>
      {/* Generation Form */}
      <Card className='p-6'>
        <Skeleton className='mb-4 h-7 w-32' />
        <Skeleton className='mb-6 h-4 w-96' />

        <div className='space-y-4'>
          {/* Premise */}
          <div>
            <Skeleton className='mb-2 h-4 w-24' />
            <Skeleton className='h-24 w-full' />
          </div>

          {/* Genre and Target Length */}
          <div className='grid grid-cols-2 gap-4'>
            <div>
              <Skeleton className='mb-2 h-4 w-16' />
              <Skeleton className='h-10 w-full' />
            </div>
            <div>
              <Skeleton className='mb-2 h-4 w-32' />
              <Skeleton className='h-10 w-full' />
            </div>
          </div>

          {/* Structure and Tone */}
          <div className='grid grid-cols-2 gap-4'>
            <div>
              <Skeleton className='mb-2 h-4 w-32' />
              <Skeleton className='h-10 w-full' />
            </div>
            <div>
              <Skeleton className='mb-2 h-4 w-16' />
              <Skeleton className='h-10 w-full' />
            </div>
          </div>

          {/* Themes */}
          <div>
            <Skeleton className='mb-2 h-4 w-32' />
            <Skeleton className='h-10 w-full' />
          </div>

          {/* Actions */}
          <Skeleton className='h-10 w-32' />
        </div>
      </Card>
    </div>
  );
};

/**
 * Loading skeleton for PlotAnalyzer
 */
export const PlotAnalyzerSkeleton: React.FC = () => {
  return (
    <div className='space-y-6'>
      <Card className='p-6'>
        <div className='mb-4 flex items-center justify-between'>
          <div className='space-y-2'>
            <Skeleton className='h-7 w-32' />
            <Skeleton className='h-4 w-64' />
          </div>
          <Skeleton className='h-10 w-32' />
        </div>

        {/* Analysis Progress */}
        <div className='space-y-3'>
          <div className='flex items-center justify-between'>
            <Skeleton className='h-4 w-48' />
            <Skeleton className='h-4 w-12' />
          </div>
          <Skeleton className='h-2 w-full' />
        </div>
      </Card>

      {/* Results Placeholder */}
      <Card className='p-12 text-center'>
        <Skeleton className='mx-auto h-6 w-64' />
        <Skeleton className='mx-auto mt-2 h-4 w-96' />
      </Card>
    </div>
  );
};

/**
 * Generic loading card for any section
 */
export const LoadingCard: React.FC<{ height?: string }> = ({ height = 'h-64' }) => {
  return (
    <Card className='p-6'>
      <Skeleton className='mb-4 h-6 w-48' />
      <Skeleton className={cn('w-full', height)} />
    </Card>
  );
};
