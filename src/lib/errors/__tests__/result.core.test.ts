import { describe, it, expect } from 'vitest';

import {
  ok,
  err,
  isOk,
  isErr,
  unwrap,
  unwrapOr,
  unwrapErr,
  map,
  mapErr,
  andThen,
  type Result,
} from '@/lib/errors/result';

describe('Result Type - Core Operations', () => {
  describe('constructor helpers', () => {
    it('should create success result with ok()', () => {
      const result = ok(42);

      expect(result.success).toBe(true);
      expect(result.data).toBe(42);
      expect(result.error).toBeUndefined();
    });

    it('should create error result with err()', () => {
      const error = new Error('Test error');
      const result = err(error);

      expect(result.success).toBe(false);
      expect(result.error).toBe(error);
      expect(result.data).toBeUndefined();
    });
  });

  describe('type guards', () => {
    it('should identify success with isOk()', () => {
      const result = ok(42);

      expect(isOk(result)).toBe(true);
      expect(isErr(result)).toBe(false);
    });

    it('should identify error with isErr()', () => {
      const result = err(new Error('Test error'));

      expect(isErr(result)).toBe(true);
      expect(isOk(result)).toBe(false);
    });

    it('should narrow types with isOk', () => {
      const result: Result<number> = ok(42);

      if (isOk(result)) {
        expect(result.data).toBe(42);
      }
    });

    it('should narrow types with isErr', () => {
      const error = {
        name: 'SystemError' as const,
        message: 'Test',
        code: 'SYSTEM_ERROR' as const,
        severity: 'critical' as const,
        timestamp: Date.now(),
        subsystem: 'test',
        operation: 'test',
        retryable: false,
      };
      const result: Result<number> = err(error);

      if (isErr(result)) {
        expect(result.error).toEqual(error);
      }
    });
  });

  describe('unwrap functions', () => {
    it('should unwrap success value', () => {
      const result = ok(42);

      expect(unwrap(result)).toBe(42);
    });

    it('should throw when unwrapping error', () => {
      const result = err(new Error('Test error'));

      expect(() => unwrap(result)).toThrow('Test error');
    });

    it('should add context when unwrapping error', () => {
      const result = err(new Error('Test error'));

      expect(() => unwrap(result, 'Operation failed')).toThrow('Operation failed: Test error');
    });

    it('should unwrapOr with default value on error', () => {
      const result = err(new Error('Test error'));

      expect(unwrapOr(result, 99)).toBe(99);
    });

    it('should return success value with unwrapOr', () => {
      const result = ok(42);

      expect(unwrapOr(result, 99)).toBe(42);
    });

    it('should unwrapErr on error result', () => {
      const error = new Error('Test error');
      const result = err(error);

      expect(unwrapErr(result)).toBe(error);
    });

    it('should throw when unwrapErr on success', () => {
      const result = ok(42);

      expect(() => unwrapErr(result)).toThrow('Called unwrapErr on an ok result');
    });
  });

  describe('map functions', () => {
    it('should map success value', () => {
      const result = ok(42);
      const mapped = map(result, x => x * 2);

      expect(isOk(mapped)).toBe(true);
      expect(unwrap(mapped)).toBe(84);
    });

    it('should not map error result', () => {
      const error = {
        name: 'SystemError' as const,
        message: 'Test error',
        code: 'SYSTEM_ERROR' as const,
        severity: 'critical' as const,
        timestamp: Date.now(),
        subsystem: 'test',
        operation: 'test',
        retryable: false,
      };
      const result: Result<number> = err(error);
      const mapped = map(result, x => x * 2);

      expect(isErr(mapped)).toBe(true);
      expect(unwrapErr(mapped)).toEqual(error);
    });

    it('should mapErr on error result', () => {
      const error = {
        name: 'SystemError' as const,
        message: 'Test error',
        code: 'SYSTEM_ERROR' as const,
        severity: 'critical' as const,
        timestamp: Date.now(),
        subsystem: 'test',
        operation: 'test',
        retryable: false,
      };
      const result = err(error);
      const mapped = mapErr(result, e => ({
        ...e,
        message: `Mapped: ${e.message}`,
      }));

      expect(isErr(mapped)).toBe(true);
      expect(unwrapErr(mapped).message).toBe('Mapped: Test error');
    });

    it('should not mapErr on success result', () => {
      const result: Result<number> = ok(42);
      const mapped = mapErr(result, e => ({
        ...e,
        message: `Mapped: ${e.message}`,
      }));

      expect(isOk(mapped)).toBe(true);
      expect(unwrap(mapped)).toBe(42);
    });
  });

  describe('andThen (flatMap)', () => {
    it('should chain successful operations', () => {
      const result = ok(21);
      const chained = andThen(result, x => ok(x * 2));

      expect(isOk(chained)).toBe(true);
      expect(unwrap(chained)).toBe(42);
    });

    it('should short-circuit on first error', () => {
      const error = {
        name: 'SystemError' as const,
        message: 'First error',
        code: 'SYSTEM_ERROR' as const,
        severity: 'critical' as const,
        timestamp: Date.now(),
        subsystem: 'test',
        operation: 'test',
        retryable: false,
      };
      const result: Result<number> = err(error);
      const chained = andThen(result, x => ok(x * 2));

      expect(isErr(chained)).toBe(true);
      expect(unwrapErr(chained)).toEqual(error);
    });

    it('should propagate second error', () => {
      const result = ok(42);
      const secondError = {
        name: 'SystemError' as const,
        message: 'Second error',
        code: 'SYSTEM_ERROR' as const,
        severity: 'critical' as const,
        timestamp: Date.now(),
        subsystem: 'test',
        operation: 'test',
        retryable: false,
      };
      const chained = andThen(result, () => err(secondError));

      expect(isErr(chained)).toBe(true);
      expect(unwrapErr(chained)).toEqual(secondError);
    });
  });
});
