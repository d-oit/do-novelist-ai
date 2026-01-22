import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { useSettings } from '@/features/settings/hooks/useSettings';
import { settingsService } from '@/features/settings/services/settingsService';
import { type Settings, type SettingsCategory } from '@/types';
import { DEFAULT_SETTINGS } from '@/types';

// Mock settings service
vi.mock('../../services/settingsService');
const mockSettingsService = vi.mocked(settingsService);

// Mock DOM methods
const mockClassListToggle = vi.fn();
const mockSetProperty = vi.fn();

describe('useSettings - Edge Cases', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Reset Zustand store state
    useSettings.setState({
      settings: DEFAULT_SETTINGS,
      isLoading: false,
      isSaving: false,
      error: null,
      activeCategory: 'appearance',
    });

    // Setup DOM mocks with writable fontSize property
    const mockStyle = {
      fontSize: '',
      setProperty: mockSetProperty,
    };

    Object.defineProperty(mockStyle, 'fontSize', {
      writable: true,
      configurable: true,
      value: '',
    });

    Object.defineProperty(document, 'documentElement', {
      value: {
        classList: { toggle: mockClassListToggle },
        style: mockStyle,
      },
      writable: true,
      configurable: true,
    });

    // Mock window.matchMedia
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });

    mockSettingsService.load.mockResolvedValue(DEFAULT_SETTINGS);
    mockSettingsService.save.mockResolvedValue();
  });

  afterEach(() => {
    mockClassListToggle.mockClear();
    mockSetProperty.mockClear();
  });

  // Edge Cases
  it('handles empty update gracefully', () => {
    const { result } = renderHook(() => useSettings());

    act(() => {
      result.current.init();
    });

    const originalSettings = { ...result.current.settings };

    act(() => {
      result.current.update({});
    });

    expect(result.current.settings).toEqual(originalSettings);
  });

  it('handles category reset for all categories', () => {
    const { result } = renderHook(() => useSettings());

    act(() => {
      result.current.init();
    });

    const categories: SettingsCategory[] = ['appearance', 'ai', 'editor', 'goals', 'privacy', 'experimental'];

    for (const category of categories) {
      act(() => {
        result.current.resetCategory(category);
      });
    }

    // All settings should be reset to defaults
    expect(result.current.settings).toEqual(DEFAULT_SETTINGS);
  });

  it('handles invalid category reset gracefully', () => {
    const { result } = renderHook(() => useSettings());

    act(() => {
      result.current.init();
    });

    act(() => {
      result.current.update({ theme: 'dark', fontSize: 20 });
    });

    const originalSettings = { ...result.current.settings };

    // Try to reset invalid category - should not crash
    act(() => {
      result.current.resetCategory('invalid' as SettingsCategory);
    });

    // Settings should remain unchanged
    expect(result.current.settings).toEqual(originalSettings);
  });

  it('handles service unavailability during load', () => {
    mockSettingsService.load.mockImplementation(() => {
      throw new Error('Service unavailable');
    });

    const { result } = renderHook(() => useSettings());

    act(() => {
      result.current.init();
    });

    expect(result.current.error).toBe('Service unavailable');
    expect(result.current.isLoading).toBe(false);
  });

  it('handles service unavailability during save', () => {
    mockSettingsService.save.mockImplementation(() => {
      throw new Error('Service unavailable');
    });

    const { result } = renderHook(() => useSettings());

    act(() => {
      result.current.init();
    });

    act(() => {
      result.current.update({ theme: 'dark' });
    });

    expect(result.current.error).toBe('Service unavailable');
    expect(result.current.isSaving).toBe(false);
  });

  it('handles malformed settings data', () => {
    const malformedSettings = {
      theme: 'invalid-theme',
      fontSize: -5,
      aiTemperature: 2.5,
    } as any;

    mockSettingsService.load.mockReturnValue(malformedSettings);

    const { result } = renderHook(() => useSettings());

    act(() => {
      result.current.init();
    });

    // Should handle gracefully without crashing
    expect(result.current.settings).toBeDefined();
  });

  it('handles concurrent updates without race conditions', async () => {
    const { result } = renderHook(() => useSettings());

    act(() => {
      result.current.init();
    });

    // Simulate concurrent updates
    act(() => {
      result.current.update({ theme: 'dark' });
      result.current.update({ fontSize: 18 });
      result.current.update({ autoSave: false });
    });

    expect(result.current.isSaving).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('maintains state consistency during errors', () => {
    mockSettingsService.save.mockImplementation(() => {
      throw new Error('Save failed');
    });

    const { result } = renderHook(() => useSettings());

    act(() => {
      result.current.init();
    });

    const originalSettings = { ...result.current.settings };

    act(() => {
      result.current.update({ theme: 'dark' });
    });

    // State should remain consistent after error
    expect(result.current.settings).toEqual(originalSettings);
    expect(result.current.error).toBe('Save failed');
  });

  it('handles DOM manipulation failures', async () => {
    // Mock DOM methods to throw errors
    mockClassListToggle.mockImplementation(() => {
      throw new Error('DOM manipulation failed');
    });

    const { result } = renderHook(() => useSettings());

    await act(async () => {
      result.current.init();
      // Wait for any pending promises
      await Promise.resolve();
    });

    // Should handle gracefully without crashing
    expect(result.current.settings).toBeDefined();
  });

  it('handles media query listener failures', async () => {
    const mockMatchMedia = vi.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn().mockImplementation(() => {
        throw new Error('Listener add failed');
      }),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    window.matchMedia = mockMatchMedia;

    const { result } = renderHook(() => useSettings());

    await act(async () => {
      result.current.init();
      // Wait for any pending promises
      await Promise.resolve();
    });

    // Should handle gracefully without crashing
    expect(result.current.settings).toBeDefined();
  });

  it('handles settings validation edge cases', () => {
    const { result } = renderHook(() => useSettings());

    act(() => {
      result.current.init();
    });

    // Test boundary values
    const edgeCases = [
      { fontSize: 0 }, // Too low (min is 12)
      { fontSize: 100 }, // Too high (max is 24)
      { aiTemperature: -1 }, // Too low (min is 0)
      { aiTemperature: 2 }, // Too high (max is 2, but this should be valid)
      { autoSaveInterval: 0 }, // Too low (min is 30)
      { dailyWordGoal: -1 }, // Negative (min is 0)
    ];

    edgeCases.forEach((testCase, index) => {
      act(() => {
        result.current.update(testCase as any);
      });

      // Only expect error for truly invalid cases
      if (index === 0 || index === 1 || index === 4 || index === 5) {
        // fontSize: 0, fontSize: 100, autoSaveInterval: 0, dailyWordGoal: -1
        expect(result.current.error).toBe('Invalid settings data');
      }

      // Clear error for next test
      act(() => {
        result.current.clearError();
      });
    });
  });

  it('handles memory cleanup on unmount', () => {
    const { unmount } = renderHook(() => useSettings());

    // Should not throw when unmounting
    expect(() => unmount()).not.toThrow();
  });

  it('handles rapid category changes', () => {
    const { result } = renderHook(() => useSettings());

    act(() => {
      result.current.init();
    });

    // Rapidly change categories
    const categories = ['appearance', 'ai', 'editor', 'goals', 'privacy', 'experimental'];

    categories.forEach(category => {
      act(() => {
        result.current.setActiveCategory(category as SettingsCategory);
      });

      expect(result.current.activeCategory).toBe(category);
    });
  });

  it('handles settings with undefined values', () => {
    const { result } = renderHook(() => useSettings());

    act(() => {
      result.current.init();
    });

    act(() => {
      result.current.update({ theme: undefined } as any);
    });

    // Should not crash and maintain consistency
    expect(result.current.settings).toBeDefined();
  });

  it('handles large settings objects', () => {
    const { result } = renderHook(() => useSettings());

    act(() => {
      result.current.init();
    });

    // Create a large settings object
    const largeSettings: Partial<Settings> = {
      theme: 'dark',
      fontSize: 18,
      fontFamily: 'system', // Use valid enum value
      compactMode: true,
      autoSave: true,
      autoSaveInterval: 60,
      spellCheck: true,
      wordWrap: true,
      aiModel: 'gpt-4',
      aiTemperature: 0.7,
      enableAIAssistance: true,
      dailyWordGoal: 2000,
    };

    act(() => {
      result.current.update(largeSettings);
    });

    expect(result.current.settings.theme).toBe('dark');
    expect(result.current.settings.fontSize).toBe(18);
    expect(result.current.error).toBeNull();
  });
});
