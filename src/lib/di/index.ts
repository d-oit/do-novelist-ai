/**
 * DI Module Public API
 *
 * Exports container, tokens, and convenience functions for dependency injection.
 *
 * @module lib/di
 */

// Core container
export { container, Container } from './Container';
export type { IContainer } from './IContainer';

// Tokens
export { REPOSITORY_TOKENS, SERVICE_TOKENS } from './registry';

// Registry functions
export {
  initializeContainer,
  getProjectService,
  getCharacterService,
  getPlotStorageService,
} from './registry';
