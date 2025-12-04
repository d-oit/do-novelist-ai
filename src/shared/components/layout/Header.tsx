import { motion, AnimatePresence } from 'framer-motion';
import {
  Menu,
  X,
  Database,
  Plus,
  LayoutDashboard,
  Folder,
  Settings,
  Sparkles,
  Map,
} from 'lucide-react';
import React, { useState, useEffect } from 'react';

import { useScrollLock } from '@/lib/hooks/useScrollLock';
import { cn } from '@/lib/utils';
import { zIndex } from '@/lib/z-index.config';

export interface HeaderProps {
  projectTitle: string;
  onNewProject: () => void;
  currentView: 'dashboard' | 'projects' | 'settings' | 'world-building';
  onNavigate: (view: 'dashboard' | 'projects' | 'settings' | 'world-building') => void;
}

const Header: React.FC<HeaderProps> = ({ projectTitle, onNewProject, currentView, onNavigate }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape' && isMenuOpen) {
        setIsMenuOpen(false);
      }
    };

    const handleResize = (): void => {
      if (window.innerWidth >= 768 && isMenuOpen) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', handleResize);

    return (): void => {
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', handleResize);
    };
  }, [isMenuOpen]);

  // Lock body scroll when mobile menu is open
  useScrollLock(isMenuOpen);

  const handleNav = (view: 'dashboard' | 'projects' | 'settings' | 'world-building'): void => {
    onNavigate(view);
    setIsMenuOpen(false);
  };

  const NavLink = ({
    view,
    icon: Icon,
    label,
  }: {
    view: 'dashboard' | 'projects' | 'settings' | 'world-building';
    icon: React.ElementType;
    label: string;
  }): React.ReactElement => {
    return (
      <button
        onClick={() => handleNav(view)}
        className={cn(
          'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200',
          'md:min-h-auto md:min-w-auto min-h-[44px] min-w-[44px]',
          'hover:scale-[0.98] active:scale-95',
          currentView === view
            ? 'bg-primary/15 text-primary shadow-sm ring-1 ring-primary/20'
            : 'text-muted-foreground hover:bg-secondary/80 hover:text-foreground hover:shadow-sm',
        )}
        data-testid={`nav-${view}`}
        role='menuitem'
        aria-current={currentView === view ? 'page' : undefined}
        aria-label={`Navigate to ${label}`}
      >
        <Icon className='h-4 w-4' aria-hidden='true' />
        <span className='font-medium'>{label}</span>
      </button>
    );
  };

  return (
    <>
      <motion.header
        className={cn(
          'sticky top-0 w-full',
          zIndex('STICKY_NAV'),
          'border-b border-border/40',
          'bg-white/95 backdrop-blur-xl backdrop-saturate-150 dark:bg-slate-950/95',
          'shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.12)]',
          'transition-all duration-300',
        )}
        role='banner'
        style={{ '--header-height': '4rem' } as React.CSSProperties}
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        <motion.div
          className='mx-auto flex h-16 max-w-7xl items-center justify-between px-4'
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          {/* Logo & Brand */}
          <motion.button
            className='group flex cursor-pointer items-center gap-3 transition-transform duration-200'
            onClick={() => handleNav('dashboard')}
            role='button'
            tabIndex={0}
            aria-label='Go to dashboard'
            whileHover={{ scale: 0.98 }}
            whileTap={{ scale: 0.95 }}
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <div
              className={cn(
                'rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 p-2.5',
                'transition-all duration-200 group-hover:shadow-lg group-hover:shadow-primary/20',
                'ring-1 ring-primary/10',
              )}
            >
              <Database className='h-5 w-5 text-primary' aria-hidden='true' />
            </div>
            <div className='hidden md:block'>
              <div className='flex items-center gap-2'>
                <span className='text-shadow-sm bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-lg font-bold leading-none text-transparent'>
                  Novelist.ai
                </span>
                <Sparkles className='h-4 w-4 text-primary/70' aria-hidden='true' />
              </div>
              <span className='font-mono text-xs tracking-wide text-muted-foreground'>
                GOAP Engine v0.5.0
              </span>
            </div>
          </motion.button>

          {/* Desktop Navigation */}
          <motion.div
            className='hidden items-center gap-2 md:flex'
            role='menubar'
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            <NavLink view='dashboard' icon={LayoutDashboard} label='Dashboard' />
            <NavLink view='projects' icon={Folder} label='Projects' />
            <NavLink view='world-building' icon={Map} label='World Building' />
            <NavLink view='settings' icon={Settings} label='Settings' />
          </motion.div>

          {/* Project Info & Actions */}
          <div className='hidden items-center gap-4 md:flex'>
            <div
              className='mr-2 flex flex-col border-r border-border/60 pr-4 text-right'
              aria-label='Current project information'
            >
              <span className='text-[10px] font-bold uppercase tracking-widest text-muted-foreground'>
                Active Project
              </span>
              <span className='max-w-[150px] truncate text-xs font-medium'>{projectTitle}</span>
            </div>

            <button
              onClick={onNewProject}
              className={cn(
                'flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-medium',
                'bg-slate-800/60 text-slate-200',
                'ring-1 ring-slate-700/50',
                'transition-all hover:bg-slate-800 hover:ring-slate-600',
                'hover:scale-[0.98] hover:shadow-lg active:scale-95',
                'shadow-lg shadow-indigo-500/10',
              )}
              data-testid='nav-new-project'
              aria-label='Create new project'
            >
              <Plus className='h-4 w-4' aria-hidden='true' />
              <span>New</span>
            </button>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            className={cn(
              'p-2.5 text-muted-foreground hover:text-foreground md:hidden',
              'rounded-lg transition-all duration-200 hover:bg-secondary/50',
              'flex min-h-[44px] min-w-[44px] items-center justify-center',
              'hover:scale-[0.98] active:scale-95',
            )}
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
        </motion.div>
      </motion.header>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              className={cn(
                'fixed inset-0 bg-black/20 backdrop-blur-sm md:hidden',
                zIndex('MODAL_BACKDROP'),
              )}
              onClick={() => setIsMenuOpen(false)}
              aria-hidden='true'
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            />

            {/* Mobile Menu */}
            <motion.div
              className={cn(
                'fixed left-0 right-0 top-16 md:hidden',
                zIndex('MODAL'),
                'h-[100dvh] bg-card/95 backdrop-blur-xl',
                'border-t border-border/40',
                'shadow-[0_8px_30px_rgb(0,0,0,0.12)]',
              )}
              role='menu'
              aria-label='Mobile navigation menu'
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -10, opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            >
              <div className='h-full space-y-6 overflow-y-auto p-6'>
                {/* Navigation Links */}
                <div className='flex flex-col gap-3' role='group' aria-label='Navigation links'>
                  <NavLink view='dashboard' icon={LayoutDashboard} label='Dashboard' />
                  <NavLink view='projects' icon={Folder} label='Projects' />
                  <NavLink view='world-building' icon={Map} label='World Building' />
                  <NavLink view='settings' icon={Settings} label='Settings' />
                </div>

                {/* Divider */}
                <div
                  className='h-px bg-gradient-to-r from-transparent via-border to-transparent'
                  aria-hidden='true'
                />

                {/* Project Actions */}
                <div className='space-y-4' role='group' aria-label='Project actions'>
                  <div className='flex items-center justify-between'>
                    <span className='text-xs font-bold uppercase tracking-wider text-muted-foreground'>
                      Active Project
                    </span>
                    <span className='max-w-[200px] truncate text-xs font-medium'>
                      {projectTitle}
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      onNewProject();
                      setIsMenuOpen(false);
                    }}
                    className={cn(
                      'flex w-full items-center justify-center gap-2 px-4 py-3',
                      'rounded-lg text-sm font-medium',
                      'bg-slate-800/60 text-slate-200',
                      'ring-1 ring-slate-700/50',
                      'transition-all hover:bg-slate-800 hover:ring-slate-600',
                      'hover:scale-[0.98] hover:shadow-lg active:scale-95',
                      'shadow-lg shadow-indigo-500/10',
                      'min-h-[44px]',
                    )}
                    aria-label='Create new project'
                  >
                    <Plus className='h-4 w-4' aria-hidden='true' />
                    <span>New Project</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default Header;
