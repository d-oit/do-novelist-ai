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
        className
      )}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <AppBackground />

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
