/**
 * Tests for cache.ts
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';

import { getCacheKey, getCached, setCached, withCache, clearCache } from '@/lib/cache';

describe('cache.ts', () => {
  beforeEach(() => {
    // Clear cache before each test
    clearCache();
  });

  afterEach(() => {
    // Clean up is handled by importing fresh module each test
  });

  describe('getCacheKey', () => {
    it('should generate key for function with no args', () => {
      const key = getCacheKey('testFunc');
      expect(key).toBe('testFunc:[]');
    });

    it('should generate key for function with single arg', () => {
      const key = getCacheKey('testFunc', 'arg1');
      expect(key).toBe('testFunc:["arg1"]');
    });

    it('should generate key for function with multiple args', () => {
      const key = getCacheKey('testFunc', 'arg1', 123, { key: 'value' });
      expect(key).toBe('testFunc:["arg1",123,{"key":"value"}]');
    });

    it('should handle null and undefined args', () => {
      const key1 = getCacheKey('testFunc', null, undefined);
      expect(key1).toBe('testFunc:[null,null]');
    });

    it('should handle object args', () => {
      const key = getCacheKey('testFunc', { a: 1, b: 2 });
      expect(key).toBe('testFunc:[{"a":1,"b":2}]');
    });

    it('should handle array args', () => {
      const key = getCacheKey('testFunc', [1, 2, 3]);
      expect(key).toBe('testFunc:[[1,2,3]]');
    });

    it('should handle nested objects', () => {
      const key = getCacheKey('testFunc', { nested: { deep: { value: 1 } } });
      expect(key).toBe('testFunc:[{"nested":{"deep":{"value":1}}}]');
    });

    it('should generate consistent keys for same inputs', () => {
      const key1 = getCacheKey('testFunc', 'arg1', 'arg2');
      const key2 = getCacheKey('testFunc', 'arg1', 'arg2');
      expect(key1).toBe(key2);
    });

    it('should generate different keys for different inputs', () => {
      const key1 = getCacheKey('testFunc', 'arg1');
      const key2 = getCacheKey('testFunc', 'arg2');
      expect(key1).not.toBe(key2);
    });
  });

  describe('getCached', () => {
    it('should return undefined for non-existent key', () => {
      const result = getCached('non-existent-key');
      expect(result).toBeUndefined();
    });

    it('should return undefined for empty string key', () => {
      const result = getCached('');
      expect(result).toBeUndefined();
    });

    it('should return cached value when exists', () => {
      setCached('test-key', 'test-value');
      const result = getCached('test-key');
      expect(result).toBe('test-value');
    });

    it('should return cached object when exists', () => {
      const testObject = { a: 1, b: 2 };
      setCached('object-key', testObject);
      const result = getCached('object-key');
      expect(result).toEqual(testObject);
    });

    it('should return cached array when exists', () => {
      const testArray = [1, 2, 3, 4, 5];
      setCached('array-key', testArray);
      const result = getCached('array-key');
      expect(result).toEqual(testArray);
    });

    it('should return cached null when set', () => {
      setCached('null-key', null);
      const result = getCached('null-key');
      expect(result).toBeNull();
    });

    it('should return cached number when set', () => {
      setCached('number-key', 42);
      const result = getCached('number-key');
      expect(result).toBe(42);
    });

    it('should return cached boolean when set', () => {
      setCached('bool-key', true);
      const result = getCached('bool-key');
      expect(result).toBe(true);
    });
  });

  describe('setCached', () => {
    it('should set value for key', () => {
      setCached('test-key', 'test-value');
      expect(getCached('test-key')).toBe('test-value');
    });

    it('should overwrite existing value', () => {
      setCached('test-key', 'value1');
      setCached('test-key', 'value2');
      expect(getCached('test-key')).toBe('value2');
    });

    it('should store objects', () => {
      const testObj = { complex: { nested: { data: 'test' } } };
      setCached('obj-key', testObj);
      expect(getCached('obj-key')).toEqual(testObj);
    });

    it('should store arrays', () => {
      const testArray = [{ id: 1 }, { id: 2 }, { id: 3 }];
      setCached('array-key', testArray);
      expect(getCached('array-key')).toEqual(testArray);
    });

    it('should store null values', () => {
      setCached('null-key', null);
      expect(getCached('null-key')).toBeNull();
    });

    it('should store undefined values as undefined', () => {
      setCached('undefined-key', undefined);
      expect(getCached('undefined-key')).toBeUndefined();
    });

    it('should store functions (though not recommended)', () => {
      const testFn = () => 'test';
      setCached('fn-key', testFn);
      const result = getCached('fn-key');
      expect(typeof result).toBe('function');
      // @ts-ignore - function comparison
      expect(result()).toBe('test');
    });
  });

  describe('withCache', () => {
    it('should return cached value on second call', async () => {
      let callCount = 0;

      const testFn = async (input: string): Promise<string> => {
        callCount++;
        return `result-${input}`;
      };

      const wrapper = withCache(testFn, 'testFunction');

      // First call - executes function
      const result1 = await wrapper('arg1');
      expect(result1).toBe('result-arg1');
      expect(callCount).toBe(1);

      // Second call - should use cache
      const result2 = await wrapper('arg1');
      expect(result2).toBe('result-arg1');
      expect(callCount).toBe(1); // Should not increment
    });

    it('should call function for different arguments', async () => {
      let callCount = 0;

      const testFn = async (input: string): Promise<string> => {
        callCount++;
        return `result-${input}`;
      };

      const wrapper = withCache(testFn, 'testFunction');

      await wrapper('arg1');
      await wrapper('arg2');
      await wrapper('arg3');

      expect(callCount).toBe(3); // Should call for each different arg
    });

    it('should cache results with same arguments', async () => {
      let callCount = 0;

      const testFn = async (num: number): Promise<number> => {
        callCount++;
        return num * 2;
      };

      const wrapper = withCache(testFn, 'double');

      // Multiple calls with same argument
      const result1 = await wrapper(5);
      const result2 = await wrapper(5);
      const result3 = await wrapper(5);

      expect(result1).toBe(10);
      expect(result2).toBe(10);
      expect(result3).toBe(10);
      expect(callCount).toBe(1); // Should only call once
    });

    it('should handle errors in wrapped function', async () => {
      const testFn = async (): Promise<never> => {
        throw new Error('Test error');
      };

      const wrapper = withCache(testFn, 'errorFunction');

      await expect(wrapper()).rejects.toThrow('Test error');
    });

    it('should not cache errors', async () => {
      let callCount = 0;

      const testFn = async (): Promise<never> => {
        callCount++;
        throw new Error('Test error');
      };

      const wrapper = withCache(testFn, 'errorFunction');

      try {
        await wrapper();
      } catch {
        // Expected error
      }

      try {
        await wrapper();
      } catch {
        // Expected error
      }

      // Should call function twice (errors not cached)
      expect(callCount).toBe(2);
    });

    it('should cache successful results after errors', async () => {
      let callCount = 0;
      let shouldError = true;

      const testFn = async (): Promise<string> => {
        callCount++;
        if (shouldError) {
          shouldError = false;
          throw new Error('First error');
        }
        return 'success';
      };

      const wrapper = withCache(testFn, 'flakyFunction');

      // First call - errors
      try {
        await wrapper();
      } catch {
        // Expected
      }

      // Second call - succeeds and caches
      const result = await wrapper();
      expect(result).toBe('success');

      // Third call - should use cache
      const result2 = await wrapper();
      expect(result2).toBe('success');

      expect(callCount).toBe(2); // First error + first success (not cached on error)
    });

    it('should handle complex return types', async () => {
      const testFn = async (): Promise<{
        id: number;
        name: string;
        items: number[];
      }> => {
        return {
          id: 1,
          name: 'Test',
          items: [1, 2, 3],
        };
      };

      const wrapper = withCache(testFn, 'complexFn');

      const result1 = await wrapper();
      const result2 = await wrapper();

      expect(result1).toEqual({
        id: 1,
        name: 'Test',
        items: [1, 2, 3],
      });
      expect(result2).toEqual(result1);
    });

    it('should handle multiple arguments', async () => {
      const testFn = async (a: string, b: number, c: boolean): Promise<string> => {
        return `${a}-${b}-${c}`;
      };

      const wrapper = withCache(testFn, 'multiArgFn');

      const result1 = await wrapper('test', 42, true);
      const result2 = await wrapper('test', 42, true);
      const result3 = await wrapper('test', 42, false);

      expect(result1).toBe('test-42-true');
      expect(result2).toBe('test-42-true');
      expect(result3).toBe('test-42-false');
    });

    it('should handle object arguments', async () => {
      const testFn = async (input: { key: string }): Promise<string> => {
        return `result-${input.key}`;
      };

      const wrapper = withCache(testFn, 'objectArgFn');

      const obj1 = { key: 'value1' };
      const obj2 = { key: 'value1' }; // Same content

      const result1 = await wrapper(obj1);
      const result2 = await wrapper(obj2);

      expect(result1).toBe('result-value1');
      expect(result2).toBe('result-value1'); // Should use cache
    });

    it('should handle promise rejection', async () => {
      const testFn = async (): Promise<never> => {
        return Promise.reject(new Error('Rejected'));
      };

      const wrapper = withCache(testFn, 'rejectFn');

      await expect(wrapper()).rejects.toThrow('Rejected');
    });

    it('should not cache rejections', async () => {
      let rejectCount = 0;

      const testFn = async (): Promise<never> => {
        rejectCount++;
        return Promise.reject(new Error('Rejected'));
      };

      const wrapper = withCache(testFn, 'rejectFn');

      try {
        await wrapper();
      } catch {
        // Expected error
      }

      try {
        await wrapper();
      } catch {
        // Expected
      }

      expect(rejectCount).toBe(2); // Should reject both times
    });

    it('should handle function name in cache key', async () => {
      const result1 = await withCache(async (x: string) => x.toUpperCase(), 'upper')('test');
      const result2 = await withCache(async (x: string) => x.toLowerCase(), 'lower')('TEST');

      expect(result1).toBe('TEST');
      expect(result2).toBe('test');

      // Verify different cache keys were used
      const key1 = getCacheKey('upper', 'test');
      const key2 = getCacheKey('lower', 'TEST');

      expect(key1).not.toBe(key2);
    });
  });

  describe('integration tests', () => {
    it('should work end-to-end with cache key, set, get', () => {
      const key = getCacheKey('myFunction', 'arg1', 'arg2');
      setCached(key, 'my-result');
      const result = getCached(key);

      expect(result).toBe('my-result');
    });

    it('should handle multiple cache entries', async () => {
      const wrapper1 = withCache(async (x: number) => x * 2, 'double');
      const wrapper2 = withCache(async (x: number) => x * 3, 'triple');

      await wrapper1(5);
      await wrapper2(5);

      const result1 = await wrapper1(5); // Should use cache
      const result2 = await wrapper2(5); // Should use cache

      expect(result1).toBe(10);
      expect(result2).toBe(15);
    });

    it('should not interfere between different cache keys', async () => {
      const wrapper = withCache(async (input: string) => input, 'test');

      await wrapper('value1');
      await wrapper('value2');
      await wrapper('value1'); // Should use cache
      await wrapper('value2'); // Should use cache

      // Verify both values were cached
      const key1 = getCacheKey('test', 'value1');
      const key2 = getCacheKey('test', 'value2');

      expect(getCached(key1)).toBe('value1');
      expect(getCached(key2)).toBe('value2');
    });
  });
});
