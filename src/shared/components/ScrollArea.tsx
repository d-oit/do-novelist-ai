import React from 'react';

import { cn } from '@/lib/utils';

export interface ScrollAreaProps {
  className?: string;
  children: React.ReactNode;
}

const ScrollArea: React.FC<ScrollAreaProps> = ({ className, children }) => {
  return <div className={cn('overflow-auto', className)}>{children}</div>;
};

ScrollArea.displayName = 'ScrollArea';

export { ScrollArea };
