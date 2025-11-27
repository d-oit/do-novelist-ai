/**
 * Versioning Feature - Public API
 * Provides version history and collaboration capabilities
 */

export * from './types';
export * from './hooks/useVersioning';
export * from './services/versioningService';

// Components
export { default as VersionHistory } from './components/VersionHistory';
export { default as VersionComparison } from './components/VersionComparison';