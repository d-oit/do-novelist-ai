import React, { ReactNode } from 'react';
import { cn } from '../../lib/utils';

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
  onToggle
}) => {
  return (
    <aside
      className={cn(
        "flex flex-col bg-card/50 backdrop-blur-sm border-r border-border/40",
        "transition-all duration-300 ease-in-out",
        "hidden md:flex", // Hidden on mobile by default
        isCollapsed ? 'w-16' : width,
        position === 'right' && 'border-r-0 border-l border-border/40',
        className
      )}
      style={{ 
        width: isCollapsed ? '4rem' : width,
        minWidth: isCollapsed ? '4rem' : width 
      }}
    >
      {/* Sidebar Header */}
      {isCollapsible && (
        <div className="p-4 border-b border-border/40">
          <button
            onClick={onToggle}
            className={cn(
              "w-full flex items-center justify-center p-2",
              "rounded-lg hover:bg-secondary/50 transition-colors",
              "text-muted-foreground hover:text-foreground"
            )}
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {/* Toggle icon would go here */}
          </button>
        </div>
      )}
      
      {/* Sidebar Content */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        {children}
      </div>
    </aside>
  );
};

export default Sidebar;