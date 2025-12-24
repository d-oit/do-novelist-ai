import React from 'react';

import type { Project } from '@shared/types';

const LazyChart = React.lazy(() => import('./ProjectStatsChart'));

interface ProjectStatsProps {
  project: Project;
}

const ProjectStats: React.FC<ProjectStatsProps> = ({ project }) => {
  const completionPercentage =
    project.worldState.chaptersCount > 0
      ? Math.round((project.worldState.chaptersCompleted / project.worldState.chaptersCount) * 100)
      : 0;

  const data = [
    { name: 'Outline', value: project.worldState.hasOutline ? 100 : 0 },
    { name: 'Draft', value: completionPercentage },
    { name: 'Review', value: 0 }, // Placeholder
    { name: 'Polish', value: 0 }, // Placeholder
  ];

  const COLORS = ['#60a5fa', '#4ade80', '#a78bfa', '#fb923c'];

  return (
    <div className='mb-6 grid grid-cols-1 gap-4 md:grid-cols-3'>
      {/* Main Progress Card */}
      <div className='relative flex flex-col items-center justify-center overflow-hidden rounded-lg border border-border bg-card p-4 md:col-span-1'>
        <div className='absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent' />
        <div className='relative z-10 text-center'>
          <div className='mb-1 text-sm uppercase tracking-widest text-muted-foreground'>
            Completion
          </div>
          <div className='text-4xl font-bold text-foreground'>{completionPercentage}%</div>
          <div className='mt-2 text-xs text-muted-foreground'>
            {project.worldState.chaptersCompleted} / {project.worldState.chaptersCount} Chapters
          </div>
        </div>
        {/* Circular background glow */}
        <div className='pointer-events-none absolute left-1/2 top-1/2 h-32 w-32 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 blur-3xl' />
      </div>

      {/* Activity Chart */}
      <div className='rounded-lg border border-border bg-card p-4 md:col-span-2'>
        <div className='mb-4 text-xs uppercase tracking-widest text-muted-foreground'>
          Phase Progress
        </div>
        <div className='h-24 min-h-[96px] w-full'>
          <React.Suspense
            fallback={<div className='h-24 w-full animate-pulse rounded bg-muted/30' />}
          >
            <LazyChart data={data} colors={COLORS} yWidth={50} />
          </React.Suspense>
        </div>
      </div>
    </div>
  );
};

export default ProjectStats;
