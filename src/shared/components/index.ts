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
// Prefer UI primitives as the single source of truth to avoid duplicate exports
export * from './ui';
export * from './layout';
// Note: Avoid re-exporting './forms' or './display' here to prevent name collisions.
// Import those subpaths directly when needed:
//   import { Button } from '@/shared/components/forms'
//   import { Card } from '@/shared/components/display'

// Future categories (will be added as components are organized)
// export * from './feedback';
// export * from './navigation';

// Lazy-loaded components
export { default as LazyMDEditor } from './LazyMDEditor';
export { default as LazyRecharts } from './LazyRecharts';

// Utility components
export { ScrollArea } from './ScrollArea';
