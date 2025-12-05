import { motion } from 'framer-motion';
import React, { ReactNode } from 'react';

import { cn } from '../../lib/utils';

import { AppBackground } from './AppBackground';

interface MainLayoutProps {
  children: ReactNode;
  className?: string;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children, className }) => {
  return (
    <motion.div
      className={cn(
        'relative flex min-h-screen flex-col overflow-hidden font-sans text-foreground selection:bg-primary/20',
        className,
      )}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <AppBackground />

      {/* Skip Links for Accessibility */}
      <a
        href='#main-content'
        className={cn(
          'absolute left-4 top-4 z-50',
          'rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground',
          '-translate-y-20 transform focus:translate-y-0',
          'transition-transform duration-200',
          'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
        )}
      >
        Skip to main content
      </a>

      <a
        href='#navigation'
        className={cn(
          'absolute left-4 top-16 z-50',
          'rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground',
          '-translate-y-20 transform focus:translate-y-0',
          'transition-transform duration-200',
          'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
        )}
      >
        Skip to navigation
      </a>

      {/* Main content with proper z-index and stagger animation */}
      <motion.div
        className='relative z-10 flex min-h-screen flex-col'
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.6 }}
      >
        {children}
      </motion.div>
    </motion.div>
  );
};

export default MainLayout;
