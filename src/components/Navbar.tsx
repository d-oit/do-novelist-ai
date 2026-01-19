import { Plus } from 'lucide-react';

import { cn } from '@/lib/utils';

interface NavbarProps {
  projectTitle: string;
  onNewProject: () => void;
  currentView:
    | 'dashboard'
    | 'projects'
    | 'settings'
    | 'world-building'
    | 'plot-engine'
    | 'metrics'
    | 'dialogue';
  onNavigate: (
    view:
      | 'dashboard'
      | 'projects'
      | 'settings'
      | 'world-building'
      | 'plot-engine'
      | 'metrics'
      | 'dialogue',
  ) => void;
}

const Navbar: React.FC<NavbarProps> = ({ projectTitle, onNewProject, currentView, onNavigate }) => {
  return (
    <nav
      aria-label='Main navigation'
      className='flex items-center justify-between border-b border-border/40 bg-card/50 px-4 py-2 backdrop-blur-sm'
    >
      <div className='flex items-center gap-4'>
        <div className='text-lg font-bold text-primary'>Novelist.ai</div>
        <div className='text-sm text-muted-foreground'>{projectTitle}</div>
      </div>

      <div className='flex items-center gap-2'>
        <button
          onClick={() => onNavigate('dashboard')}
          className={cn(
            'rounded-md px-3 py-2 text-sm font-medium transition-colors',
            currentView === 'dashboard'
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
          )}
          data-testid='nav-dashboard'
        >
          Dashboard
        </button>

        <button
          onClick={() => onNavigate('settings')}
          className={cn(
            'rounded-md px-3 py-2 text-sm font-medium transition-colors',
            currentView === 'settings'
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
          )}
          data-testid='nav-settings'
        >
          Settings
        </button>

        <button
          onClick={onNewProject}
          className={cn(
            'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium',
            'bg-slate-800/60 text-slate-200',
            'ring-1 ring-slate-700/50',
            'transition-all hover:bg-slate-800 hover:ring-slate-600',
          )}
          data-testid='nav-new-project'
        >
          <Plus className='h-4 w-4' />
          New Project
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
