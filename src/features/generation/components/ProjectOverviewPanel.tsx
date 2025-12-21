import type { FC } from 'react';

import CoverGenerator from '@/features/publishing/components/CoverGenerator';

import type { Project } from '@shared/types';

interface ProjectOverviewPanelProps {
  project: Project;
  onUpdateProject: (updates: Partial<Project>) => void;
}

export const ProjectOverviewPanel: FC<ProjectOverviewPanelProps> = ({
  project,
  onUpdateProject,
}) => {
  return (
    <div className='mx-auto min-h-full w-full max-w-3xl p-6 md:p-8' data-testid='overview-panel'>
      <div className='mb-8 flex flex-col items-start justify-between gap-4 border-b border-border pb-4 md:flex-row md:items-center'>
        <div>
          <h2 className='font-serif text-2xl font-bold text-foreground md:text-3xl'>
            {project.title}
          </h2>
          <p className='mt-1 text-sm text-muted-foreground'>{project.style}</p>
        </div>
      </div>
      <div className='space-y-8'>
        <CoverGenerator project={project} onUpdateProject={onUpdateProject} />
        <section className='mt-8 rounded-lg border border-border bg-secondary/10 p-4'>
          <h4 className='mb-2 text-xs font-bold uppercase text-muted-foreground'>Core Idea</h4>
          <p
            className='whitespace-pre-wrap font-mono text-sm text-foreground'
            data-testid='project-idea-content'
          >
            {project.idea}
          </p>
        </section>
      </div>
    </div>
  );
};

export default ProjectOverviewPanel;
