/**
 * Projects Feature - Public API
 *
 * This is the public export boundary for the projects feature.
 * Only import from this file when using the projects feature from other parts of the app.
 */

// Components
export { default as ProjectsView } from './components/ProjectsView';
export { default as ProjectWizard } from './components/ProjectWizard';

// Hooks
export { useProjects, selectFilteredProjects } from './hooks/useProjects';

// Services
export { projectService } from './services/projectService';

// Types
export type {
  WizardStep,
  ProjectFilters,
  ProjectStats,
  ProjectCreationData,
  ProjectUpdateData,
} from './types';

export { isValidWizardStep, validateProjectCreation, ProjectCreationSchema } from './types';
