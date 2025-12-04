import { Menu, X, Database, Plus, LayoutDashboard, Folder, Settings } from 'lucide-react';
import React, { useState, useEffect } from 'react';

import { cn } from '../lib/utils';

interface NavbarProps {
  id?: string;
  projectTitle: string;
  onNewProject: () => void;
  currentView: 'dashboard' | 'projects' | 'settings';
  onNavigate: (view: 'dashboard' | 'projects' | 'settings') => void;
}

const Navbar: React.FC<NavbarProps> = ({
  id,
  projectTitle,
  onNewProject,
  currentView,
  onNavigate,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect((): (() => void) => {
    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape' && isMenuOpen) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return (): void => document.removeEventListener('keydown', handleKeyDown);
  }, [isMenuOpen]);

  const handleNav = (view: 'dashboard' | 'projects' | 'settings'): void => {
    onNavigate(view);
    setIsMenuOpen(false);
  };

  const NavLink = ({
    view,
    icon: Icon,
    label,
  }: {
    view: 'dashboard' | 'projects' | 'settings';
    icon: React.ElementType;
    label: string;
  }): React.ReactElement => {
    return (
      <button
        onClick={() => handleNav(view)}
        className={cn(
          'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors',
          currentView === view
            ? 'bg-primary/10 text-primary'
            : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
        )}
        data-testid={`nav-${view}`}
        role='menuitem'
        aria-current={currentView === view ? 'page' : undefined}
        aria-label={`Navigate to ${label}`}
      >
        <Icon className='h-4 w-4' aria-hidden='true' /> {label}
      </button>
    );
  };

  return (
    <nav
      id={id}
      className='sticky top-0 z-40 w-full border-b border-border bg-card'
      role='navigation'
      aria-label='Main navigation'
    >
      <div className='mx-auto flex h-16 max-w-7xl items-center justify-between px-4'>
        <div
          className='flex cursor-pointer items-center gap-3'
          onClick={() => handleNav('dashboard')}
          role='button'
          tabIndex={0}
          aria-label='Go to dashboard'
        >
          <div className='rounded-lg bg-primary/10 p-2'>
            <Database className='h-5 w-5 text-primary' aria-hidden='true' />
          </div>
          <div className='hidden md:block'>
            <span className='text-lg font-bold leading-none'>Novelist.ai</span>
            <span className='font-mono text-xs text-muted-foreground'>GOAP Engine v0.5.0</span>
          </div>
        </div>

        <div className='hidden items-center gap-1 md:flex' role='menubar'>
          <NavLink view='dashboard' icon={LayoutDashboard} label='Dashboard' />
          <NavLink view='projects' icon={Folder} label='Projects' />
          <NavLink view='settings' icon={Settings} label='Settings' />
        </div>

        <div className='hidden items-center gap-3 md:flex'>
          <div
            className='mr-2 flex flex-col border-r border-border pr-4 text-right'
            aria-label='Current project information'
          >
            <span className='text-[10px] font-bold uppercase text-muted-foreground'>
              Current Project
            </span>
            <span className='max-w-[150px] truncate text-xs font-medium'>{projectTitle}</span>
          </div>

          <button
            onClick={onNewProject}
            className='flex items-center gap-2 rounded-md bg-secondary px-3 py-2 text-xs font-medium text-secondary-foreground transition-colors hover:bg-secondary/80'
            data-testid='nav-new-project'
            aria-label='Create new project'
          >
            <Plus className='h-4 w-4' aria-hidden='true' /> New
          </button>
        </div>

        <button
          className='p-2 text-muted-foreground hover:text-foreground md:hidden'
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          data-testid='mobile-menu-toggle'
          aria-expanded={isMenuOpen}
          aria-label={isMenuOpen ? 'Close mobile menu' : 'Open mobile menu'}
        >
          {isMenuOpen ? (
            <X className='h-6 w-6' aria-hidden='true' />
          ) : (
            <Menu className='h-6 w-6' aria-hidden='true' />
          )}
        </button>
      </div>

      {isMenuOpen && (
        <div
          className='animate-in slide-in-from-top-5 absolute w-full border-t border-border bg-card md:hidden'
          role='menu'
          aria-label='Mobile navigation menu'
        >
          <div className='space-y-4 p-4'>
            <div className='flex flex-col gap-2' role='group' aria-label='Navigation links'>
              <NavLink view='dashboard' icon={LayoutDashboard} label='Dashboard' />
              <NavLink view='projects' icon={Folder} label='Projects' />
              <NavLink view='settings' icon={Settings} label='Settings' />
            </div>
            <div className='my-2 h-px w-full bg-border' aria-hidden='true' />
            <div className='space-y-3' role='group' aria-label='Project actions'>
              <div className='flex items-center justify-between'>
                <span className='text-xs font-bold uppercase text-muted-foreground'>
                  Active Project
                </span>
                <span className='max-w-[200px] truncate text-xs font-medium'>{projectTitle}</span>
              </div>
              <button
                onClick={() => {
                  onNewProject();
                  setIsMenuOpen(false);
                }}
                className='flex w-full items-center justify-center gap-2 rounded-md bg-secondary px-3 py-2 text-sm font-medium text-secondary-foreground transition-colors hover:bg-secondary/80'
                aria-label='Create new project'
              >
                <Plus className='h-4 w-4' aria-hidden='true' /> New Project
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
