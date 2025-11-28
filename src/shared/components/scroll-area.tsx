import React from 'react';

interface ScrollAreaProps {
  className?: string;
  children: React.ReactNode;
}

const ScrollArea: React.FC<ScrollAreaProps> = ({ className, children }) => {
  return (
    <div className={`overflow-auto ${className ?? ''}`}>
      {children}
    </div>
  );
};

export default ScrollArea;
export { ScrollArea };