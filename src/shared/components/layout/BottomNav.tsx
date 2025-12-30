'use client';

import { Edit, Home, Settings } from 'lucide-react';
import React from 'react';

import { cn } from '@/lib/utils';

interface BottomNavProps {
  currentView: 'dashboard' | 'projects' | 'settings' | 'world-building';
  onNavigate: (view: 'dashboard' | 'projects' | 'settings' | 'world-building') => void;
}

interface NavButtonProps {
  active: boolean;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}

const NavButton: React.FC<NavButtonProps> = ({ active, icon, label, onClick }) => (
  <button
    onClick={onClick}
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
  return (
    <nav className='fixed bottom-0 left-0 right-0 z-50 border-t bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60 md:hidden'>
      <div className='pb-safe flex h-16 items-center justify-around'>
        <NavButton
          active={currentView === 'dashboard'}
          icon={<Home className='h-5 w-5' />}
          label='Dashboard'
          onClick={() => onNavigate('dashboard')}
        />
        <NavButton
          active={currentView === 'projects'}
          icon={<Edit className='h-5 w-5' />}
          label='Projects'
          onClick={() => onNavigate('projects')}
        />
        <NavButton
          active={currentView === 'settings'}
          icon={<Settings className='h-5 w-5' />}
          label='Settings'
          onClick={() => onNavigate('settings')}
        />
        <NavButton
          active={currentView === 'world-building'}
          icon={<Edit className='h-5 w-5' />}
          label='World'
          onClick={() => onNavigate('world-building')}
        />
      </div>
    </nav>
  );
};
