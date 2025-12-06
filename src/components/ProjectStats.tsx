import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

import type { Project } from '../types';
import { PublishStatus } from '../shared/types';

interface ProjectStatsProps {
  project: Project;
}

const ProjectStats: React.FC<ProjectStatsProps> = React.memo(({ project }) => {
  // Memoize chapter completion calculation
  const chapterCompletion = useMemo(
    () =>
      project.worldState.chaptersCount > 0
        ? Math.round(
            (project.worldState.chaptersCompleted / project.worldState.chaptersCount) * 100,
          )
        : 0,
    [project.worldState.chaptersCompleted, project.worldState.chaptersCount],
  );

  // Memoize total words calculation
  const totalWords = useMemo(
    () =>
      project.chapters.reduce(
        (acc, ch) =>
          acc +
          (ch.content
            .trim()
            .split(/\s+/)
            .filter(w => w.length > 0).length || 0),
        0,
      ),
    [project.chapters],
  );

  // Memoize word progress calculation
  const { targetWords, wordProgress } = useMemo(() => {
    const target = project.targetWordCount || 50000;
    const progress = Math.min(100, Math.round((totalWords / target) * 100));
    return { targetWords: target, wordProgress: progress };
  }, [totalWords, project.targetWordCount]);

  // Memoize chart data
  const data = useMemo(
    () => [
      { name: 'Structure', value: project.worldState.hasOutline ? 100 : 0 },
      { name: 'Chapters', value: chapterCompletion },
      { name: 'Word Goal', value: wordProgress },
      {
        name: 'Status',
        value:
          project.status === PublishStatus.PUBLISHED
            ? 100
            : project.status === PublishStatus.REVIEW
              ? 75
              : project.status === PublishStatus.EDITING
                ? 50
                : 25,
      },
    ],
    [project.worldState.hasOutline, chapterCompletion, wordProgress, project.status],
  );

  const COLORS = useMemo(() => ['#60a5fa', '#4ade80', '#fb923c', '#a78bfa'], []);

  return (
    <div className='mb-6 grid grid-cols-1 gap-4 md:grid-cols-3'>
      {/* Main Progress Card */}
      <div className='relative flex flex-col items-center justify-center overflow-hidden rounded-lg border border-border bg-card p-4 md:col-span-1'>
        <div className='absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent' />
        <div className='relative z-10 text-center'>
          <div className='mb-1 text-xs uppercase tracking-widest text-muted-foreground'>
            Word Goal
          </div>
          <div className='text-4xl font-bold text-foreground'>{wordProgress}%</div>
          <div className='mt-2 font-mono text-xs text-muted-foreground'>
            {totalWords.toLocaleString()} / {targetWords.toLocaleString()} words
          </div>
        </div>
        {/* Circular background glow */}
        <div className='pointer-events-none absolute left-1/2 top-1/2 h-32 w-32 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 blur-3xl' />
      </div>

      {/* Activity Chart */}
      <div className='rounded-lg border border-border bg-card p-4 md:col-span-2'>
        <div className='mb-4 text-xs uppercase tracking-widest text-muted-foreground'>
          Project Metrics
        </div>
        <div className='h-24 min-h-[96px] w-full'>
          <ResponsiveContainer width='100%' height={96} minHeight={96}>
            <BarChart layout='vertical' data={data} barSize={12}>
              <XAxis type='number' hide domain={[0, 100]} />
              <YAxis
                type='category'
                dataKey='name'
                tick={{ fill: '#64748b', fontSize: 10 }}
                width={60}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                cursor={{ fill: 'transparent' }}
                contentStyle={{
                  backgroundColor: '#1e293b',
                  borderColor: '#334155',
                  color: '#f1f5f9',
                  fontSize: '12px',
                }}
              />
              <Bar dataKey='value' radius={[0, 4, 4, 0]}>
                {data.map((_entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
});

ProjectStats.displayName = 'ProjectStats';

export default ProjectStats;
