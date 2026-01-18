/**
 * DI Container Interface
 *
 * Defines the contract for dependency injection container.
 * Supports service registration and resolution with singleton pattern.
 *
 * @module lib/di
 */

/**
 * Container interface for dependency injection
 *
 * Provides methods to register and resolve services in a decoupled manner.
 * All services are resolved as singletons by default.
 *
 * @example
 * ```ts
 * import { container } from '@/lib/di';
 *
 * // Register a service
 * container.register('my-service', () => new MyService());
 *
 * // Resolve the service
 * const service = container.resolve<MyService>('my-service');
 * ```
 */
export interface IContainer {
  /**
   * Register a service factory
   *
   * The factory function is called once when the service is first resolved,
   * and the same instance is returned on subsequent calls (singleton pattern).
   *
   * @param token - Unique identifier for the service
   * @param factory - Factory function that creates the service instance
   *
   * @example
   * ```ts
   * container.register('project-service', () => {
   *   const repo = container.resolve('project-repository');
   *   return new ProjectService(repo);
   * });
   * ```
   */
  register<T>(token: string, factory: () => T): void;

  /**
   * Resolve a service by token
   *
   * Returns the singleton instance of the service. If the service has not been
   * resolved before, the factory is called to create the instance.
   *
   * @param token - Unique identifier for the service
   * @returns The resolved service instance
   * @throws Error if the service is not registered
   *
   * @example
   * ```ts
   * const projectService = container.resolve<ProjectService>('project-service');
   * const projects = await projectService.getAll();
   * ```
   */
  resolve<T>(token: string): T;

  /**
   * Check if a service is registered
   *
   * @param token - Unique identifier for the service
   * @returns true if the service is registered, false otherwise
   *
   * @example
   * ```ts
   * if (container.has('my-service')) {
   *   const service = container.resolve('my-service');
   * }
   * ```
   */
  has(token: string): boolean;

  /**
   * Clear all registered services and instances
   *
   * This is primarily useful for testing scenarios where you want to reset
   * the container state between test runs.
   *
   * @example
   * ```ts
   * beforeEach(() => {
   *   container.clear();
   * });
   * ```
   */
  clear(): void;
}
