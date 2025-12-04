// Shared Component Library - Main Barrel Export
//
// This is the primary entry point for all shared components.
// Use this import pattern throughout the codebase:
//
// import { Button, Card, MetricCard } from '@/shared/components';
//
// Or import specific categories:
//
// import { Button } from '@/shared/components/forms';
// import { Card } from '@/shared/components/display';

// Re-export from all component categories
export * from './forms';
export * from './display';
export * from './layout';
export * from './ui';

// Future categories (will be added as components are organized)
// export * from './feedback';
// export * from './navigation';

// Lazy-loaded components
export { default as LazyMDEditor } from './LazyMDEditor';
export { default as LazyRecharts } from './LazyRecharts';

// Utility components
export { ScrollArea } from './ScrollArea';
