import React from 'react';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';

import type { Project } from '@shared/types';

import { useProjects } from '../hooks/useProjects';


export const ProjectDashboard: React.FC = React.memo(() => {
  const { projects, isLoading, error } = useProjects();

  if (isLoading) {
    return (
      <Card data-testid='card'>
        <CardContent>Loading...</CardContent>
      </Card>
    );
  }

  if (error != null) {
    return (
      <Card data-testid='card'>
        <CardContent>Error: {error}</CardContent>
      </Card>
    );
  }

  return (
    <div>
      {projects.map((project: Project) => (
        <Card key={project.id} data-testid='card'>
          <CardHeader>
            <CardTitle>{project.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{project.idea}</p>
            <p>Style: {project.style}</p>
          </CardContent>
        </Card>
      ))}

      {projects.length === 0 && (
        <Card data-testid='card'>
          <CardContent>No projects found</CardContent>
        </Card>
      )}
    </div>
  );
});

ProjectDashboard.displayName = 'ProjectDashboard';

export default ProjectDashboard;
