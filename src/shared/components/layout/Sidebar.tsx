import React, { type ReactNode } from 'react';

import { cn } from '@/lib/utils';

interface SidebarProps {
  children: ReactNode;
  className?: string;
  position?: 'left' | 'right';
  width?: string;
  isCollapsible?: boolean;
  isCollapsed?: boolean;
  onToggle?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  children,
  className,
  position = 'left',
  width = '240px',
  isCollapsible = false,
  isCollapsed = false,
  onToggle,
}) => {
  return (
    <aside
      className={cn(
        'flex flex-col border-r border-border/40 bg-card/50 backdrop-blur-sm',
        'transition-all duration-300 ease-in-out',
        'hidden md:flex', // Hidden on mobile by default
        isCollapsed ? 'w-16' : width,
        position === 'right' && 'border-l border-r-0 border-border/40',
        className,
      )}
      style={{
        width: isCollapsed ? '4rem' : width,
        minWidth: isCollapsed ? '4rem' : width,
      }}
    >
      {/* Sidebar Header */}
      {isCollapsible && (
        <div className='border-b border-border/40 p-4'>
          <button
            onClick={onToggle}
            className={cn(
              'flex w-full items-center justify-center p-2',
              'rounded-lg transition-colors hover:bg-secondary/50',
              'text-muted-foreground hover:text-foreground',
            )}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {/* Toggle icon would go here */}
          </button>
        </div>
      )}

      {/* Sidebar Content */}
      <div className='flex-1 overflow-y-auto overflow-x-hidden'>{children}</div>
    </aside>
  );
};

export default Sidebar;
