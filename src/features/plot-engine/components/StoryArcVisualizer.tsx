/**
 * Story Arc Visualizer Component
 *
 * Interactive visualization of story structure, tension curve, and plot points
 */

import React, { useMemo } from 'react';
import {
  Line,
  LineChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

import type { StoryArc, PlotPoint } from '@/features/plot-engine';
import { cn } from '@/lib/utils';
import { Card } from '@/shared/components/ui/Card';

interface StoryArcVisualizerProps {
  storyArc: StoryArc;
  onPlotPointClick?: (plotPoint: PlotPoint) => void;
}

export const StoryArcVisualizer: React.FC<StoryArcVisualizerProps> = ({
  storyArc,
  onPlotPointClick,
}) => {
  // Prepare data for tension curve chart
  const tensionData = useMemo(() => {
    return storyArc.tension.map(point => ({
      chapter: `Ch ${point.chapterNumber}`,
      chapterNumber: point.chapterNumber,
      tension: point.tensionLevel,
      emotional: point.emotional,
    }));
  }, [storyArc.tension]);

  // Prepare data for pacing chart
  const pacingData = useMemo(() => {
    return storyArc.pacing.byChapter.map(ch => ({
      chapter: `Ch ${ch.chapterNumber}`,
      chapterNumber: ch.chapterNumber,
      pace: ch.pace,
      wordCount: ch.wordCount,
    }));
  }, [storyArc.pacing.byChapter]);

  // Get all plot points across acts
  const allPlotPoints = useMemo(() => {
    // This would come from plot structure if available
    return [] as PlotPoint[];
  }, []);

  return (
    <div className='space-y-6'>
      {/* Story Structure Overview */}
      <Card className='p-6'>
        <h3 className='mb-4 text-lg font-semibold'>Story Structure</h3>
        <div className='mb-6 grid grid-cols-3 gap-4'>
          <div className='text-center'>
            <p className='text-sm text-muted-foreground'>Structure</p>
            <p className='mt-1 text-xl font-bold capitalize'>
              {storyArc.structure.replace('-', ' ')}
            </p>
          </div>
          <div className='text-center'>
            <p className='text-sm text-muted-foreground'>Coherence</p>
            <p className='mt-1 text-xl font-bold'>{Math.round(storyArc.coherence * 100)}%</p>
          </div>
          <div className='text-center'>
            <p className='text-sm text-muted-foreground'>Pacing</p>
            <p className='mt-1 text-xl font-bold capitalize'>{storyArc.pacing.overall}</p>
          </div>
        </div>

        {/* Structure Diagram */}
        <div className='relative h-24 rounded-lg bg-muted/30'>
          {storyArc.structure === '3-act' && <ThreeActDiagram />}
          {storyArc.structure === '5-act' && <FiveActDiagram />}
          {storyArc.structure === 'hero-journey' && <HeroJourneyDiagram />}
        </div>
      </Card>

      {/* Tension Curve */}
      <Card className='p-6'>
        <h3 className='mb-4 text-lg font-semibold'>Tension Curve</h3>
        <ResponsiveContainer width='100%' height={300}>
          <LineChart data={tensionData}>
            <CartesianGrid strokeDasharray='3 3' />
            <XAxis dataKey='chapter' />
            <YAxis domain={[0, 100]} />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length > 0) {
                  const data = payload[0]?.payload as (typeof tensionData)[0];
                  return (
                    <div className='rounded-lg border bg-background p-3 shadow-lg'>
                      <p className='font-medium'>{data.chapter}</p>
                      <p className='text-sm text-muted-foreground'>Tension: {data.tension}/100</p>
                      <p className='text-sm capitalize text-muted-foreground'>
                        State: {data.emotional}
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend />
            <Line
              type='monotone'
              dataKey='tension'
              stroke='hsl(var(--primary))'
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
              name='Tension Level'
            />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      {/* Pacing Analysis */}
      <Card className='p-6'>
        <h3 className='mb-4 text-lg font-semibold'>Pacing Analysis</h3>
        <ResponsiveContainer width='100%' height={300}>
          <LineChart data={pacingData}>
            <CartesianGrid strokeDasharray='3 3' />
            <XAxis dataKey='chapter' />
            <YAxis yAxisId='left' domain={[0, 100]} />
            <YAxis yAxisId='right' orientation='right' />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length > 0) {
                  const data = payload[0]?.payload as (typeof pacingData)[0];
                  return (
                    <div className='rounded-lg border bg-background p-3 shadow-lg'>
                      <p className='font-medium'>{data.chapter}</p>
                      <p className='text-sm text-muted-foreground'>Pace: {data.pace}/100</p>
                      <p className='text-sm text-muted-foreground'>
                        Words: {data.wordCount.toLocaleString()}
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend />
            <Line
              yAxisId='left'
              type='monotone'
              dataKey='pace'
              stroke='hsl(var(--primary))'
              strokeWidth={2}
              dot={{ r: 4 }}
              name='Pace'
            />
            <Line
              yAxisId='right'
              type='monotone'
              dataKey='wordCount'
              stroke='hsl(var(--secondary))'
              strokeWidth={2}
              strokeDasharray='5 5'
              dot={{ r: 4 }}
              name='Word Count'
            />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      {/* Plot Points Timeline */}
      {allPlotPoints.length > 0 && (
        <Card className='p-6'>
          <h3 className='mb-4 text-lg font-semibold'>Plot Points</h3>
          <div className='space-y-3'>
            {allPlotPoints.map(point => (
              <PlotPointItem
                key={point.id}
                plotPoint={point}
                onClick={() => onPlotPointClick?.(point)}
              />
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};

// Three Act Structure Diagram
const ThreeActDiagram: React.FC = () => (
  <div className='absolute inset-0 flex items-center justify-between px-4'>
    <div className='flex-1 border-t-2 border-primary' />
    <div className='rounded bg-primary px-3 py-1 text-xs font-medium text-primary-foreground'>
      Act 1: Setup
    </div>
    <div className='flex-1 border-t-2 border-primary' />
    <div className='rounded bg-primary px-3 py-1 text-xs font-medium text-primary-foreground'>
      Act 2: Confrontation
    </div>
    <div className='flex-1 border-t-2 border-primary' />
    <div className='rounded bg-primary px-3 py-1 text-xs font-medium text-primary-foreground'>
      Act 3: Resolution
    </div>
    <div className='flex-1 border-t-2 border-primary' />
  </div>
);

// Five Act Structure Diagram
const FiveActDiagram: React.FC = () => (
  <div className='absolute inset-0 flex items-center justify-between px-2'>
    {['Exposition', 'Rising', 'Climax', 'Falling', 'Denouement'].map((act, i) => (
      <React.Fragment key={act}>
        {i > 0 && <div className='flex-1 border-t-2 border-primary' />}
        <div className='rounded bg-primary px-2 py-1 text-xs font-medium text-primary-foreground'>
          {act}
        </div>
      </React.Fragment>
    ))}
  </div>
);

// Hero's Journey Diagram
const HeroJourneyDiagram: React.FC = () => (
  <div className='absolute inset-0 flex items-center justify-between px-4'>
    <div className='flex-1 border-t-2 border-primary' />
    <div className='rounded bg-primary px-3 py-1 text-xs font-medium text-primary-foreground'>
      Departure
    </div>
    <div className='flex-1 border-t-2 border-primary' />
    <div className='rounded bg-primary px-3 py-1 text-xs font-medium text-primary-foreground'>
      Initiation
    </div>
    <div className='flex-1 border-t-2 border-primary' />
    <div className='rounded bg-primary px-3 py-1 text-xs font-medium text-primary-foreground'>
      Return
    </div>
    <div className='flex-1 border-t-2 border-primary' />
  </div>
);

// Plot Point Item Component
interface PlotPointItemProps {
  plotPoint: PlotPoint;
  onClick?: () => void;
}

const PlotPointItem: React.FC<PlotPointItemProps> = ({ plotPoint, onClick }) => {
  const typeColors = {
    inciting_incident: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    rising_action: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    climax: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    falling_action: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
    resolution: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
    plot_twist: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
    midpoint: 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300',
    turning_point: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300',
    dark_night: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300',
  };

  return (
    <button
      onClick={onClick}
      className='w-full rounded-lg border p-3 text-left transition-colors hover:bg-muted/50'
      data-testid='plot-point-item'
    >
      <div className='flex items-start justify-between gap-2'>
        <div className='flex-1'>
          <h4 className='text-sm font-medium'>{plotPoint.title}</h4>
          <p className='mt-1 text-xs text-muted-foreground'>{plotPoint.description}</p>
        </div>
        <span
          className={cn('rounded-full px-2 py-1 text-xs font-medium', typeColors[plotPoint.type])}
        >
          {plotPoint.type.replace('_', ' ')}
        </span>
      </div>
      {plotPoint.position !== undefined && (
        <div className='mt-2'>
          <div className='h-1 overflow-hidden rounded-full bg-muted'>
            <div className='h-full bg-primary' style={{ width: `${plotPoint.position}%` }} />
          </div>
          <p className='mt-1 text-xs text-muted-foreground'>
            Position: {plotPoint.position}% through story
          </p>
        </div>
      )}
    </button>
  );
};
