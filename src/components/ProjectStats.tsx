
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Project } from '../types';

interface ProjectStatsProps {
  project: Project;
}

const ProjectStats: React.FC<ProjectStatsProps> = ({ project }) => {
  // Calculate Chapter Completion
  const chapterCompletion = project.worldState.chaptersCount > 0 
    ? Math.round((project.worldState.chaptersCompleted / project.worldState.chaptersCount) * 100) 
    : 0;

  // Calculate Word Count Progress
  const totalWords = project.chapters.reduce((acc, ch) => acc + (ch.content.trim().split(/\s+/).filter(w => w.length > 0).length || 0), 0);
  const targetWords = project.targetWordCount || 50000;
  const wordProgress = Math.min(100, Math.round((totalWords / targetWords) * 100));

  const data = [
    { name: 'Structure', value: project.worldState.hasOutline ? 100 : 0 },
    { name: 'Chapters', value: chapterCompletion },
    { name: 'Word Goal', value: wordProgress },
    { name: 'Status', value: project.status === 'Published' ? 100 : (project.status === 'Review' ? 75 : (project.status === 'Editing' ? 50 : 25)) },
  ];

  const COLORS = ['#60a5fa', '#4ade80', '#fb923c', '#a78bfa'];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      {/* Main Progress Card */}
      <div className="md:col-span-1 bg-card border border-border rounded-lg p-4 flex flex-col justify-center items-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
        <div className="relative z-10 text-center">
          <div className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Word Goal</div>
          <div className="text-4xl font-bold text-foreground">{wordProgress}%</div>
          <div className="text-xs text-muted-foreground mt-2 font-mono">
            {totalWords.toLocaleString()} / {targetWords.toLocaleString()} words
          </div>
        </div>
        {/* Circular background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-primary/10 blur-3xl rounded-full pointer-events-none"></div>
      </div>

      {/* Activity Chart */}
      <div className="md:col-span-2 bg-card border border-border rounded-lg p-4">
        <div className="text-xs text-muted-foreground uppercase tracking-widest mb-4">Project Metrics</div>
        <div className="h-24 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart layout="vertical" data={data} barSize={12}>
              <XAxis type="number" hide domain={[0, 100]} />
              <YAxis type="category" dataKey="name" tick={{fill: '#64748b', fontSize: 10}} width={60} axisLine={false} tickLine={false} />
              <Tooltip 
                cursor={{fill: 'transparent'}} 
                contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f1f5f9', fontSize: '12px' }}
              />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
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
};

export default ProjectStats;
