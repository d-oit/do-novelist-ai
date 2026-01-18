import { AnimatePresence, motion } from 'framer-motion';
import { Map, ChartColumn, BarChart3, MessageSquare, X } from 'lucide-react';
import React from 'react';

import { cn } from '@/lib/utils';

type ViewMode =
  | 'dashboard'
  | 'projects'
  | 'settings'
  | 'world-building'
  | 'plot-engine'
  | 'metrics'
  | 'dialogue';

interface MoreSheetProps {
  isOpen: boolean;
  onClose: () => void;
  currentView: ViewMode;
  onNavigate: (view: ViewMode) => void;
}

interface SheetNavItemProps {
  icon: React.ReactNode;
  label: string;
  description: string;
  active: boolean;
  onClick: () => void;
}

const SheetNavItem: React.FC<SheetNavItemProps> = ({
  icon,
  label,
  description,
  active,
  onClick,
}) => (
  <button
    onClick={onClick}
    className={cn(
      'flex w-full items-center gap-4 rounded-xl p-4 text-left transition-all',
      'min-h-[60px]',
      active
        ? 'bg-primary/10 text-primary ring-1 ring-primary/20'
        : 'hover:bg-secondary/80 active:scale-[0.98]',
    )}
    type='button'
    aria-current={active ? 'page' : undefined}
  >
    <div
      className={cn(
        'flex h-10 w-10 items-center justify-center rounded-lg',
        active ? 'bg-primary/20' : 'bg-secondary',
      )}
    >
      {icon}
    </div>
    <div className='flex-1'>
      <div className='text-sm font-medium'>{label}</div>
      <div className='text-xs text-muted-foreground'>{description}</div>
    </div>
  </button>
);

export const MoreSheet: React.FC<MoreSheetProps> = ({
  isOpen,
  onClose,
  currentView,
  onNavigate,
}) => {
  const handleNavigate = (view: ViewMode): void => {
    onNavigate(view);
    onClose();
  };

  // Close on escape key
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent): void => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Prevent body scroll when open
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className='fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden'
            onClick={onClose}
            aria-hidden='true'
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={cn(
              'fixed bottom-0 left-0 right-0 z-50 md:hidden',
              'rounded-t-2xl border-t bg-card shadow-xl',
              'max-h-[70vh] overflow-hidden',
            )}
            role='dialog'
            aria-modal='true'
            aria-label='More navigation options'
          >
            {/* Handle bar */}
            <div className='flex justify-center py-3'>
              <div className='h-1 w-10 rounded-full bg-muted-foreground/30' />
            </div>

            {/* Header */}
            <div className='flex items-center justify-between px-4 pb-2'>
              <h2 className='text-lg font-semibold'>More</h2>
              <button
                onClick={onClose}
                className='rounded-full p-2 hover:bg-secondary'
                aria-label='Close menu'
                type='button'
              >
                <X className='h-5 w-5' />
              </button>
            </div>

            {/* Navigation items */}
            <div className='pb-safe space-y-2 overflow-y-auto px-4 pb-8'>
              <SheetNavItem
                icon={<Map className='h-5 w-5' />}
                label='World Building'
                description='Create locations, cultures, and lore'
                active={currentView === 'world-building'}
                onClick={() => handleNavigate('world-building')}
              />
              <SheetNavItem
                icon={<ChartColumn className='h-5 w-5' />}
                label='Plot Engine'
                description='Visualize story arcs and character graphs'
                active={currentView === 'plot-engine'}
                onClick={() => handleNavigate('plot-engine')}
              />
              <SheetNavItem
                icon={<BarChart3 className='h-5 w-5' />}
                label='Metrics'
                description='Analytics and writing statistics'
                active={currentView === 'metrics'}
                onClick={() => handleNavigate('metrics')}
              />
              <SheetNavItem
                icon={<MessageSquare className='h-5 w-5' />}
                label='Dialogue'
                description='Character voice and dialogue analysis'
                active={currentView === 'dialogue'}
                onClick={() => handleNavigate('dialogue')}
              />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
