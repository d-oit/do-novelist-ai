// Component Index - Centralized exports for easy importing
//
// This module provides a centralized import map for all components.
// It follows the consolidation strategy where all UI primitives
// are sourced from @shared/components/ui as the single source of truth.
//
// Usage:
//   import { Button, Card, MetricCard } from '@/components';
//   import { CharacterCard } from '@/components/characters';

// === UI Primitives (Consolidated) ===
// All UI primitives now come from the shared location
export {
  Badge,
  badgeVariants,
  type BadgeProps,
  Button,
  buttonVariants,
  type ButtonProps,
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
  cardVariants,
  type CardProps,
  MetricCard,
  type MetricCardProps,
} from '@shared/components/ui';

// === Layout Components ===
export { default as Header } from '@shared/components/layout/Header';
export { default as AppBackground } from './layout/AppBackground';
export { default as MainLayout } from './layout/MainLayout';
export { default as Sidebar } from './layout/Sidebar';

// === Application Components ===
export { default as ActionCard } from './ActionCard';
export { default as AgentConsole } from './AgentConsole';
export { default as ErrorBoundary } from './error-boundary';
export { default as GoapVisualizer } from './GoapVisualizer';
export { default as Navbar } from './Navbar';
export { default as PlannerControl } from './PlannerControl';
export { default as ProjectDashboard } from './ProjectDashboard';
export { default as ProjectDashboardOptimized } from './ProjectDashboardOptimized';
export { default as ProjectStats } from './ProjectStats';

// === Feature Components ===
// These are re-exported from their respective feature modules
export { CharacterCard } from '@/features/characters/components/CharacterCard';
export { WritingStatsCard } from '@/features/analytics/components/WritingStatsCard';
export { AnalyticsDashboard } from '@/features/analytics/components/AnalyticsDashboard';

// === Component Paths Reference ===
// For developers - shows the canonical locations after consolidation:
//
// UI Primitives: @shared/components/ui/
//   ├── Badge.tsx (consolidated from 4 locations)
//   ├── Button.tsx (consolidated from 3 locations) 
//   ├── Card.tsx (consolidated from 3 locations)
//   └── MetricCard.tsx (consolidated from 2 locations)
//
// Layout: @shared/components/layout/
// Features: @/features/{feature}/components/
//
// DEPRECATED PATHS (use @shared/components/ui instead):
//   ❌ src/components/ui/badge.tsx
//   ❌ src/shared/components/badge.tsx
//   ❌ src/shared/components/display/Badge.tsx
//   (Similar for Button, Card, MetricCard)