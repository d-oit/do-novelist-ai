import { Edit, Home, Settings, MoreHorizontal } from 'lucide-react';
import React from 'react';

import { cn } from '@/lib/utils';

import { MoreSheet } from './MoreSheet';

interface BottomNavProps {
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

interface NavButtonProps {
  active: boolean;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  dataTestId?: string;
}

const NavButton: React.FC<NavButtonProps> = ({ active, icon, label, onClick, dataTestId }) => (
  <button
    onClick={onClick}
    data-testid={dataTestId}
    className={cn(
      'flex flex-1 flex-col items-center justify-center p-2 text-xs font-medium transition-colors',
      active ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
    )}
    type='button'
  >
    <div className={cn('mb-1 transition-transform', active && 'scale-110')}>{icon}</div>
    <span>{label}</span>
  </button>
);

export const BottomNav: React.FC<BottomNavProps> = ({ currentView, onNavigate }) => {
  const [isMoreOpen, setIsMoreOpen] = React.useState(false);

  // Check if current view is one of the "More" views
  const isMoreActive = ['world-building', 'plot-engine', 'metrics', 'dialogue'].includes(
    currentView,
  );

  return (
    <>
      <nav
        aria-label='Bottom navigation'
        className='fixed bottom-0 left-0 right-0 z-50 border-t bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60 md:hidden'
      >
        <div className='pb-safe flex h-16 items-center justify-around'>
          <NavButton
            active={currentView === 'dashboard'}
            icon={<Home className='h-5 w-5' />}
            label='Dashboard'
            onClick={() => onNavigate('dashboard')}
            dataTestId='mobile-nav-dashboard'
          />
          <NavButton
            active={currentView === 'projects'}
            icon={<Edit className='h-5 w-5' />}
            label='Projects'
            onClick={() => onNavigate('projects')}
            dataTestId='mobile-nav-projects'
          />
          <NavButton
            active={isMoreActive}
            icon={<MoreHorizontal className='h-5 w-5' />}
            label='More'
            onClick={() => setIsMoreOpen(true)}
            dataTestId='mobile-nav-more'
          />
          <NavButton
            active={currentView === 'settings'}
            icon={<Settings className='h-5 w-5' />}
            label='Settings'
            onClick={() => onNavigate('settings')}
            dataTestId='mobile-nav-settings'
          />
        </div>
      </nav>
      <MoreSheet
        isOpen={isMoreOpen}
        onClose={() => setIsMoreOpen(false)}
        currentView={currentView}
        onNavigate={onNavigate}
      />
    </>
  );
};
