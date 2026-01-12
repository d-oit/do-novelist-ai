/**
 * Plot Engine Components
 *
 * All components are lazy-loaded for optimal code splitting.
 * This prevents bundling heavy visualizations until they're needed.
 */

// Lazy-loaded components (recommended for all use cases)
export {
  LazyPlotAnalyzer,
  LazyStoryArcVisualizer,
  LazyCharacterGraphView,
  LazyPlotHoleDetectorView,
  LazyPlotGenerator,
  LazyPlotEngineDashboard,
} from './lazy-plot-engine';

// Non-lazy exports (lightweight components)
export { FeedbackCollector } from './FeedbackCollector';

// Loading States
export * from './LoadingStates';
