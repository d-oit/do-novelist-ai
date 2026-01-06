/**
 * Story Arc Visualizer Component
 *
 * Interactive visualization of story structure, tension curve, and plot points
 */

import { Download, GripVertical } from 'lucide-react';
import React, { useMemo, useState } from 'react';
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

import type { StoryArc, PlotPoint, PlotStructure } from '@/features/plot-engine';
import { cn } from '@/lib/utils';
import { Button } from '@/shared/components/ui/Button';
import { Card } from '@/shared/components/ui/Card';

interface StoryArcVisualizerProps {
  storyArc: StoryArc;
  plotStructure?: PlotStructure;
  onPlotPointClick?: (plotPoint: PlotPoint) => void;
  onPlotPointsReorder?: (plotPoints: PlotPoint[]) => void;
}

export const StoryArcVisualizer: React.FC<StoryArcVisualizerProps> = React.memo(
  ({ storyArc, plotStructure, onPlotPointClick, onPlotPointsReorder }) => {
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

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
      if (!plotStructure) return [] as PlotPoint[];

      const points: PlotPoint[] = [];

      // Collect plot points from all acts
      plotStructure.acts.forEach(act => {
        points.push(...act.plotPoints);
      });

      // Add climax and resolution if available
      if (plotStructure.climax) points.push(plotStructure.climax);
      if (plotStructure.resolution) points.push(plotStructure.resolution);

      // Sort by position
      return points.sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
    }, [plotStructure]);

    // Export data as JSON
    const handleExport = (): void => {
      const exportData = {
        storyArc: {
          structure: storyArc.structure,
          coherence: storyArc.coherence,
          pacing: storyArc.pacing,
          tension: tensionData,
          recommendations: storyArc.recommendations,
        },
        plotPoints: allPlotPoints.map(p => ({
          id: p.id,
          type: p.type,
          title: p.title,
          description: p.description,
          position: p.position,
          importance: p.importance,
        })),
        exportedAt: new Date().toISOString(),
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `story-arc-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    };

    // Handle drag start
    const handleDragStart = (index: number): void => {
      setDraggedIndex(index);
    };

    // Handle drag over
    const handleDragOver = (e: React.DragEvent, index: number): void => {
      e.preventDefault();
      if (draggedIndex === null || draggedIndex === index) return;

      const newPoints = [...allPlotPoints];
      const draggedItem = newPoints[draggedIndex];
      if (!draggedItem) return;

      newPoints.splice(draggedIndex, 1);
      newPoints.splice(index, 0, draggedItem);

      setDraggedIndex(index);
      onPlotPointsReorder?.(newPoints);
    };

    // Handle drag end
    const handleDragEnd = (): void => {
      setDraggedIndex(null);
    };

    return (
      <div className='space-y-6'>
        {/* Export Button */}
        <div className='flex justify-end'>
          <Button
            onClick={handleExport}
            variant='outline'
            className='gap-2'
            data-testid='export-button'
            aria-label='Export story arc data'
          >
            <Download className='h-4 w-4' />
            Export Data
          </Button>
        </div>

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
            <div className='mb-4 flex items-center justify-between'>
              <h3 className='text-lg font-semibold'>Plot Points</h3>
              <p className='text-sm text-muted-foreground'>
                Drag to reorder • {allPlotPoints.length} points
              </p>
            </div>
            <div className='space-y-3'>
              {allPlotPoints.map((point, index) => (
                <PlotPointItem
                  key={point.id}
                  plotPoint={point}
                  isDragging={draggedIndex === index}
                  onClick={() => onPlotPointClick?.(point)}
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={(e: React.DragEvent) => handleDragOver(e, index)}
                  onDragEnd={handleDragEnd}
                />
              ))}
            </div>
          </Card>
        )}
      </div>
    );
  },
);

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
  isDragging: boolean;
  onClick?: () => void;
  onDragStart?: () => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDragEnd?: () => void;
}

const PlotPointItem: React.FC<PlotPointItemProps> = ({
  plotPoint,
  isDragging,
  onClick,
  onDragStart,
  onDragOver,
  onDragEnd,
}) => {
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
    <div
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
      className={cn(
        'group relative w-full rounded-lg border p-3 transition-all',
        isDragging ? 'opacity-50' : 'hover:bg-muted/50',
      )}
      data-testid='plot-point-item'
    >
      <button onClick={onClick} className='w-full text-left'>
        <div className='flex items-start gap-3'>
          {/* Drag Handle */}
          <div className='cursor-move pt-1 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100'>
            <GripVertical className='h-4 w-4' />
          </div>

          <div className='flex flex-1 items-start justify-between gap-2'>
            <div className='flex-1'>
              <h4 className='text-sm font-medium'>{plotPoint.title}</h4>
              <p className='mt-1 text-xs text-muted-foreground'>{plotPoint.description}</p>
            </div>
            <span
              className={cn(
                'rounded-full px-2 py-1 text-xs font-medium',
                typeColors[plotPoint.type],
              )}
            >
              {plotPoint.type.replace('_', ' ')}
            </span>
          </div>
        </div>

        {plotPoint.position !== undefined && (
          <div className='ml-7 mt-2'>
            <div className='h-1 overflow-hidden rounded-full bg-muted'>
              <div className='h-full bg-primary' style={{ width: `${plotPoint.position}%` }} />
            </div>
            <p className='mt-1 text-xs text-muted-foreground'>
              Position: {plotPoint.position}% through story
            </p>
          </div>
        )}
      </button>
    </div>
  );
};
