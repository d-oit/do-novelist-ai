/**
 * Dependency Injection Container
 *
 * Simple DI container implementation with singleton pattern support.
 * Provides service registration and resolution without framework overhead.
 *
 * @module lib/di
 */

import { logger } from '@/lib/logging/logger';

import { type IContainer } from './IContainer';

/**
 * DI Container implementation
 *
 * Manages service lifecycle with singleton pattern. Services are registered
 * with factory functions and resolved only when first needed.
 *
 * @example
 * ```ts
 * const container = new Container();
 * container.register('service', () => new Service());
 * const service = container.resolve<Service>('service');
 * ```
 */
export class Container implements IContainer {
  private services: Map<string, () => unknown> = new Map();
  private instances: Map<string, unknown> = new Map();

  /**
   * Register a service factory
   *
   * @param token - Unique identifier for the service
   * @param factory - Factory function to create the service instance
   * @throws Error if a service with the same token is already registered
   *
   * @example
   * ```ts
   * container.register('project-service', () => {
   *   const repo = container.resolve('project-repository');
   *   return new ProjectService(repo);
   * });
   * ```
   */
  public register<T>(token: string, factory: () => T): void {
    if (this.services.has(token)) {
      const error = new Error(`Service already registered: ${token}`);
      logger.error('Failed to register service', { component: 'Container', token, error });
      throw error;
    }

    this.services.set(token, factory);
    logger.debug('Service registered', { component: 'Container', token });
  }

  /**
   * Resolve a service by token
   *
   * Returns the singleton instance of the service. Creates the instance on
   * first resolution using the registered factory function.
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
  public resolve<T>(token: string): T {
    if (!this.services.has(token)) {
      const error = new Error(`Service not registered: ${token}`);
      logger.error('Failed to resolve service', { component: 'Container', token, error });
      throw error;
    }

    // Return existing instance if already resolved (singleton pattern)
    if (this.instances.has(token)) {
      return this.instances.get(token) as T;
    }

    // Create new instance using factory
    const factory = this.services.get(token)!;
    const instance = factory();

    // Cache the instance for singleton pattern
    this.instances.set(token, instance);
    logger.debug('Service resolved', { component: 'Container', token });

    return instance as T;
  }

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
  public has(token: string): boolean {
    return this.services.has(token);
  }

  /**
   * Clear all registered services and instances
   *
   * Removes all services and cached instances from the container.
   * Useful for testing scenarios where container state needs to be reset.
   *
   * @example
   * ```ts
   * beforeEach(() => {
   *   container.clear();
   * });
   * ```
   */
  public clear(): void {
    this.services.clear();
    this.instances.clear();
    logger.debug('Container cleared', { component: 'Container' });
  }
}

/**
 * Singleton container instance
 *
 * Global container instance used throughout the application.
 * All services should be registered to this instance during initialization.
 *
 * @example
 * ```ts
 * import { container } from '@/lib/di';
 *
 * container.register('my-service', () => new MyService());
 * const service = container.resolve<MyService>('my-service');
 * ```
 */
export const container = new Container();
