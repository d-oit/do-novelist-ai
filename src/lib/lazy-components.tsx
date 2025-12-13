
import { Loader2 } from 'lucide-react';
import React, { Suspense } from 'react';

import { cn } from '@/lib/utils';

// Loading component for lazy-loaded routes
interface LazyLoadingProps {
  className?: string;
  message?: string;
}

export const LazyLoading: React.FC<LazyLoadingProps> = ({ className, message = 'Loading...' }) => (
  <div
    className={cn(
      'flex min-h-[400px] flex-col items-center justify-center bg-background text-foreground',
      className,
    )}
  >
    <Loader2 className='mb-4 h-8 w-8 animate-spin text-primary' />
    <p className='text-sm text-muted-foreground'>{message}</p>
  </div>
);

// Generic lazy component wrapper
interface LazyComponentProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  className?: string;
}

export const LazyComponent: React.FC<LazyComponentProps> = ({ children, fallback, className }) => (
  <Suspense fallback={fallback || <LazyLoading className={className} />}>{children}</Suspense>
);

// Specific loading components for different features
export const AnalyticsLoading: React.FC = () => (
  <LazyLoading message='Loading analytics dashboard...' />
);

export const WorldBuildingLoading: React.FC = () => (
  <LazyLoading message='Loading world builder...' />
);

export const PublishingLoading: React.FC = () => (
  <LazyLoading message='Loading publishing tools...' />
);

export const BookViewerLoading: React.FC = () => <LazyLoading message='Loading book viewer...' />;
