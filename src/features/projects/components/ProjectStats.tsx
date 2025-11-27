import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Project } from '@shared/types';

interface ProjectStatsProps {
  project: Project;
}

const ProjectStats: React.FC<ProjectStatsProps> = ({ project }) => {
  const completionPercentage = project.worldState.chaptersCount > 0 
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
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      {/* Main Progress Card */}
      <div className="md:col-span-1 bg-card border border-border rounded-lg p-4 flex flex-col justify-center items-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
        <div className="relative z-10 text-center">
          <div className="text-sm text-muted-foreground uppercase tracking-widest mb-1">Completion</div>
          <div className="text-4xl font-bold text-foreground">{completionPercentage}%</div>
          <div className="text-xs text-muted-foreground mt-2">
            {project.worldState.chaptersCompleted} / {project.worldState.chaptersCount} Chapters
          </div>
        </div>
        {/* Circular background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-primary/10 blur-3xl rounded-full pointer-events-none"></div>
      </div>

      {/* Activity Chart */}
      <div className="md:col-span-2 bg-card border border-border rounded-lg p-4">
        <div className="text-xs text-muted-foreground uppercase tracking-widest mb-4">Phase Progress</div>
        <div className="h-24 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart layout="vertical" data={data} barSize={12}>
              <XAxis type="number" hide domain={[0, 100]} />
              <YAxis type="category" dataKey="name" tick={{fill: '#64748b', fontSize: 10}} width={50} axisLine={false} tickLine={false} />
              <Tooltip 
                cursor={{fill: 'transparent'}} 
                contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f1f5f9', fontSize: '12px' }}
              />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                {data.map((entry, index) => (
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