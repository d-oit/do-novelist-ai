/**
 * DI Container Tests
 *
 * Tests for dependency injection container functionality.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

import { container } from '@/lib/di/Container';

describe('DI Container', () => {
  beforeEach(() => {
    // Clear container before each test
    container.clear();
  });

  describe('Registration', () => {
    it('should register a service', () => {
      // Arrange
      const factory = vi.fn(() => ({ test: true }));

      // Act
      container.register('test-service', factory);

      // Assert
      expect(container.has('test-service')).toBe(true);
    });

    it('should throw error when registering duplicate service', () => {
      // Arrange
      container.register('test-service', () => ({}));

      // Act & Assert
      expect(() => {
        container.register('test-service', () => ({}));
      }).toThrow('Service already registered: test-service');
    });
  });

  describe('Resolution', () => {
    it('should resolve registered service', () => {
      // Arrange
      const factory = vi.fn(() => ({ test: true }));
      container.register('test-service', factory);

      // Act
      const service = container.resolve('test-service');

      // Assert
      expect(service).toEqual({ test: true });
      expect(factory).toHaveBeenCalledTimes(1);
    });

    it('should throw error when resolving unregistered service', () => {
      // Act & Assert
      expect(() => {
        container.resolve('non-existent-service');
      }).toThrow('Service not registered: non-existent-service');
    });

    it('should return singleton instance', () => {
      // Arrange
      const factory = vi.fn(() => ({ id: 1 }));
      container.register('test-service', factory);

      // Act
      const instance1 = container.resolve('test-service');
      const instance2 = container.resolve('test-service');

      // Assert
      expect(instance1).toBe(instance2);
      expect(factory).toHaveBeenCalledTimes(1);
    });

    it('should resolve with generic type', () => {
      // Arrange
      interface TestService {
        getValue(): string;
      }
      container.register<TestService>('test-service', () => ({
        getValue: () => 'test',
      }));

      // Act
      const service = container.resolve<TestService>('test-service');

      // Assert
      expect(service.getValue()).toBe('test');
    });
  });

  describe('Container Clear', () => {
    it('should clear all registered services', () => {
      // Arrange
      container.register('service1', () => ({}));
      container.register('service2', () => ({}));

      // Act
      container.clear();

      // Assert
      expect(container.has('service1')).toBe(false);
      expect(container.has('service2')).toBe(false);
    });

    it('should clear all cached instances', () => {
      // Arrange
      const factory = vi.fn(() => ({ id: 1 }));
      container.register('test-service', factory);

      // Act
      container.resolve('test-service'); // First call creates instance
      container.clear(); // Clear both services and instances
      container.register('test-service', factory); // Re-register
      container.resolve('test-service'); // Second call creates new instance

      // Assert
      expect(factory).toHaveBeenCalledTimes(2);
    });
  });
});
