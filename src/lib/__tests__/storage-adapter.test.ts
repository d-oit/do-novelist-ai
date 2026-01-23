/**
 * Storage Adapter Tests
 * Tests the unified storage interface with Turso/localStorage fallback
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getDrizzleClient } from '@/lib/database/drizzle';
import { kvService, KV_NAMESPACES } from '@/lib/database/services/key-value-service';
import { StorageAdapter } from '@/lib/storage-adapter';

// Mock dependencies
vi.mock('@/lib/database/drizzle');
vi.mock('@/lib/database/services/key-value-service');
vi.mock('@/lib/logging/logger', () => ({
  logger: {
    error: vi.fn(),
  },
}));

describe('StorageAdapter', () => {
  let adapter: StorageAdapter;
  let mockLocalStorage: Record<string, string>;

  beforeEach(() => {
    adapter = new StorageAdapter();
    mockLocalStorage = {};

    // Mock localStorage
    const localStorageMock = {
      getItem: vi.fn((key: string) => mockLocalStorage[key] || null),
      setItem: vi.fn((key: string, value: string) => {
        mockLocalStorage[key] = value;
      }),
      removeItem: vi.fn((key: string) => {
        delete mockLocalStorage[key];
      }),
      clear: vi.fn(() => {
        mockLocalStorage = {};
      }),
      key: vi.fn((index: number) => Object.keys(mockLocalStorage)[index] || null),
      get length() {
        return Object.keys(mockLocalStorage).length;
      },
    };

    Object.defineProperty(global, 'localStorage', {
      value: localStorageMock,
      writable: true,
      configurable: true,
    });

    vi.clearAllMocks();
  });

  describe('get()', () => {
    it('should use Turso when available', async () => {
      vi.mocked(getDrizzleClient).mockReturnValue({} as never);
      vi.mocked(kvService.get).mockResolvedValue({ test: 'value' });

      const result = await adapter.get(KV_NAMESPACES.SETTINGS, 'testKey', 'user123');

      expect(kvService.get).toHaveBeenCalledWith(KV_NAMESPACES.SETTINGS, 'testKey', 'user123');
      expect(result).toEqual({ test: 'value' });
      expect(localStorage.getItem).not.toHaveBeenCalled();
    });

    it('should fall back to localStorage when Turso unavailable', async () => {
      vi.mocked(getDrizzleClient).mockReturnValue(null);
      mockLocalStorage['novelist_settings_testKey'] = JSON.stringify({ test: 'value' });

      const result = await adapter.get(KV_NAMESPACES.SETTINGS, 'testKey');

      expect(kvService.get).not.toHaveBeenCalled();
      expect(localStorage.getItem).toHaveBeenCalledWith('novelist_settings_testKey');
      expect(result).toEqual({ test: 'value' });
    });

    it('should include userId in localStorage key when provided', async () => {
      vi.mocked(getDrizzleClient).mockReturnValue(null);
      mockLocalStorage['novelist_settings_testKey_user123'] = JSON.stringify({ test: 'value' });

      const result = await adapter.get(KV_NAMESPACES.SETTINGS, 'testKey', 'user123');

      expect(localStorage.getItem).toHaveBeenCalledWith('novelist_settings_testKey_user123');
      expect(result).toEqual({ test: 'value' });
    });

    it('should return null for non-existent keys', async () => {
      vi.mocked(getDrizzleClient).mockReturnValue(null);

      const result = await adapter.get(KV_NAMESPACES.SETTINGS, 'nonexistent');

      expect(result).toBeNull();
    });

    it('should handle JSON parse errors gracefully', async () => {
      vi.mocked(getDrizzleClient).mockReturnValue(null);
      mockLocalStorage['novelist_settings_testKey'] = 'invalid-json{';

      const result = await adapter.get(KV_NAMESPACES.SETTINGS, 'testKey');

      expect(result).toBe('invalid-json{'); // Returns raw string if not JSON
    });

    it('should return null in SSR environment', async () => {
      vi.mocked(getDrizzleClient).mockReturnValue(null);
      const originalWindow = global.window;
      // @ts-expect-error - Testing SSR
      delete global.window;

      const result = await adapter.get(KV_NAMESPACES.SETTINGS, 'testKey');

      expect(result).toBeNull();
      global.window = originalWindow;
    });
  });

  describe('set()', () => {
    it('should use Turso when available', async () => {
      vi.mocked(getDrizzleClient).mockReturnValue({} as never);
      vi.mocked(kvService.set).mockResolvedValue(undefined);

      const testValue = { test: 'value' };
      await adapter.set(KV_NAMESPACES.SETTINGS, 'testKey', testValue, 'user123');

      expect(kvService.set).toHaveBeenCalledWith(KV_NAMESPACES.SETTINGS, 'testKey', testValue, 'user123', undefined);
      expect(localStorage.setItem).not.toHaveBeenCalled();
    });

    it('should fall back to localStorage when Turso unavailable', async () => {
      vi.mocked(getDrizzleClient).mockReturnValue(null);

      const testValue = { test: 'value' };
      await adapter.set(KV_NAMESPACES.SETTINGS, 'testKey', testValue);

      expect(localStorage.setItem).toHaveBeenCalledWith('novelist_settings_testKey', JSON.stringify(testValue));
      expect(mockLocalStorage['novelist_settings_testKey']).toBe(JSON.stringify(testValue));
    });

    it('should include userId in localStorage key when provided', async () => {
      vi.mocked(getDrizzleClient).mockReturnValue(null);

      const testValue = { test: 'value' };
      await adapter.set(KV_NAMESPACES.SETTINGS, 'testKey', testValue, 'user123');

      expect(localStorage.setItem).toHaveBeenCalledWith('novelist_settings_testKey_user123', JSON.stringify(testValue));
    });

    it('should do nothing in SSR environment', async () => {
      vi.mocked(getDrizzleClient).mockReturnValue(null);
      const originalWindow = global.window;
      // @ts-expect-error - Testing SSR
      delete global.window;

      await adapter.set(KV_NAMESPACES.SETTINGS, 'testKey', { test: 'value' });

      expect(localStorage.setItem).not.toHaveBeenCalled();
      global.window = originalWindow;
    });
  });

  describe('delete()', () => {
    it('should use Turso when available', async () => {
      vi.mocked(getDrizzleClient).mockReturnValue({} as never);
      vi.mocked(kvService.delete).mockResolvedValue(undefined);

      await adapter.delete(KV_NAMESPACES.SETTINGS, 'testKey', 'user123');

      expect(kvService.delete).toHaveBeenCalledWith(KV_NAMESPACES.SETTINGS, 'testKey', 'user123');
      expect(localStorage.removeItem).not.toHaveBeenCalled();
    });

    it('should fall back to localStorage when Turso unavailable', async () => {
      vi.mocked(getDrizzleClient).mockReturnValue(null);
      mockLocalStorage['novelist_settings_testKey'] = JSON.stringify({ test: 'value' });

      await adapter.delete(KV_NAMESPACES.SETTINGS, 'testKey');

      expect(localStorage.removeItem).toHaveBeenCalledWith('novelist_settings_testKey');
      expect(mockLocalStorage['novelist_settings_testKey']).toBeUndefined();
    });
  });

  describe('getAll()', () => {
    it('should use Turso when available', async () => {
      vi.mocked(getDrizzleClient).mockReturnValue({} as never);
      vi.mocked(kvService.getAll).mockResolvedValue({ key1: 'value1', key2: 'value2' });

      const result = await adapter.getAll(KV_NAMESPACES.SETTINGS, 'user123');

      expect(kvService.getAll).toHaveBeenCalledWith(KV_NAMESPACES.SETTINGS, 'user123');
      expect(result).toEqual({ key1: 'value1', key2: 'value2' });
    });

    it('should fall back to localStorage and filter by namespace', async () => {
      vi.mocked(getDrizzleClient).mockReturnValue(null);
      mockLocalStorage['novelist_settings_key1'] = JSON.stringify('value1');
      mockLocalStorage['novelist_settings_key2'] = JSON.stringify('value2');
      mockLocalStorage['novelist_other_key3'] = JSON.stringify('value3');

      const result = await adapter.getAll(KV_NAMESPACES.SETTINGS);

      expect(result).toEqual({ key1: 'value1', key2: 'value2' });
      expect(result).not.toHaveProperty('key3');
    });

    it('should return empty object in SSR environment', async () => {
      vi.mocked(getDrizzleClient).mockReturnValue(null);
      const originalWindow = global.window;
      // @ts-expect-error - Testing SSR
      delete global.window;

      const result = await adapter.getAll(KV_NAMESPACES.SETTINGS);

      expect(result).toEqual({});
      global.window = originalWindow;
    });
  });

  describe('clearNamespace()', () => {
    it('should use Turso when available', async () => {
      vi.mocked(getDrizzleClient).mockReturnValue({} as never);
      vi.mocked(kvService.clearNamespace).mockResolvedValue(undefined);

      await adapter.clearNamespace(KV_NAMESPACES.SETTINGS, 'user123');

      expect(kvService.clearNamespace).toHaveBeenCalledWith(KV_NAMESPACES.SETTINGS, 'user123');
    });

    it('should fall back to localStorage and remove all matching keys', async () => {
      vi.mocked(getDrizzleClient).mockReturnValue(null);
      mockLocalStorage['novelist_settings_key1'] = JSON.stringify('value1');
      mockLocalStorage['novelist_settings_key2'] = JSON.stringify('value2');
      mockLocalStorage['novelist_other_key3'] = JSON.stringify('value3');

      await adapter.clearNamespace(KV_NAMESPACES.SETTINGS);

      expect(mockLocalStorage['novelist_settings_key1']).toBeUndefined();
      expect(mockLocalStorage['novelist_settings_key2']).toBeUndefined();
      expect(mockLocalStorage['novelist_other_key3']).toBe(JSON.stringify('value3')); // Not removed
    });
  });
});
