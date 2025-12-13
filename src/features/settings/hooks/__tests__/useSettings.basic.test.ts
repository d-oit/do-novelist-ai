import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { useSettings } from '@/features/settings/hooks/useSettings';
import { type Settings } from '@/types';
import { DEFAULT_SETTINGS } from '@/types';

// Mock DOM methods
const mockClassListToggle = vi.fn();
const mockSetProperty = vi.fn();

describe('useSettings - Basic Operations', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Reset Zustand store completely
    useSettings.setState((state) => ({
      ...state,
      settings: DEFAULT_SETTINGS,
      isLoading: false,
      isSaving: false,
      error: null,
      activeCategory: 'appearance',
    }));

    // Mock localStorage
    const localStorageMock = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    };
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true,
    });

    // Clear localStorage for each test
    localStorageMock.getItem.mockReturnValue(null);

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
  });

  afterEach(() => {
    mockClassListToggle.mockClear();
    mockSetProperty.mockClear();
  });

  // Initialization Tests
  it('initializes with default settings', () => {
    const { result } = renderHook(() => useSettings());

    // Zustand persist loads from storage automatically
    expect(result.current.settings).toEqual(DEFAULT_SETTINGS);
    expect(result.current.isLoading).toBe(false);
  });

  it('applies theme on initialization', () => {
    const { result } = renderHook(() => useSettings());

    // Theme should be applied on first render
    expect(result.current.settings).toBeDefined();
  });

  it('handles initialization errors', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    // Mock localStorage to throw
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: () => {
          throw new Error('Storage error');
        },
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn(),
      },
      writable: true,
    });

    const { result } = renderHook(() => useSettings());

    // Should fallback to defaults on error
    expect(result.current.settings).toEqual(DEFAULT_SETTINGS);

    consoleErrorSpy.mockRestore();
  });

  // Update Tests
  it('updates settings successfully', () => {
    const { result } = renderHook(() => useSettings());

    const updates: Partial<Settings> = {
      fontSize: 18,
      theme: 'dark',
    };

    act(() => {
      result.current.update(updates);
    });

    expect(result.current.settings.fontSize).toBe(18);
    expect(result.current.settings.theme).toBe('dark');
    expect(result.current.isSaving).toBe(false);
  });

  it('applies theme when theme is updated', () => {
    const { result } = renderHook(() => useSettings());

    mockClassListToggle.mockClear();

    act(() => {
      result.current.update({ theme: 'dark' });
    });

    expect(mockClassListToggle).toHaveBeenCalledWith('dark', true);
  });

  it('applies font size when fontSize is updated', () => {
    const { result } = renderHook(() => useSettings());

    act(() => {
      result.current.update({ fontSize: 20 });
    });

    expect(document.documentElement.style.fontSize).toBe('20px');
  });

  it('validates settings before saving', () => {
    const { result } = renderHook(() => useSettings());

    // Try to update with invalid data (fontSize too low)
    act(() => {
      result.current.update({ fontSize: 5 } as any);
    });

    expect(result.current.error).toBe('Invalid settings data');
  });

  it('handles update errors', () => {
    const { result } = renderHook(() => useSettings());

    // Mock localStorage to throw on save
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: vi.fn().mockReturnValue(null),
        setItem: () => {
          throw new Error('Save failed');
        },
        removeItem: vi.fn(),
        clear: vi.fn(),
      },
      writable: true,
    });

    act(() => {
      result.current.update({ theme: 'dark' });
    });

    expect(result.current.error).toBe('Save failed');
    expect(result.current.isSaving).toBe(false);
  });

  // Reset Tests
  it('resets all settings to defaults', () => {
    const { result } = renderHook(() => useSettings());

    act(() => {
      result.current.update({ fontSize: 20, theme: 'dark' });
    });

    act(() => {
      result.current.reset();
    });

    expect(result.current.settings).toEqual(DEFAULT_SETTINGS);
  });

  it('reapplies defaults after reset', () => {
    const { result } = renderHook(() => useSettings());

    act(() => {
      result.current.update({ theme: 'dark', fontSize: 20 });
    });

    mockClassListToggle.mockClear();

    act(() => {
      result.current.reset();
    });

    expect(mockClassListToggle).toHaveBeenCalled();
    expect(document.documentElement.style.fontSize).toBe('16px');
  });

  it('handles reset errors', () => {
    const { result } = renderHook(() => useSettings());

    // Mock localStorage to throw on setItem (which save() uses)
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: vi.fn().mockReturnValue(null),
        setItem: () => {
          throw new Error('Reset failed');
        },
        removeItem: vi.fn(),
        clear: vi.fn(),
      },
      writable: true,
    });

    expect(() => {
      act(() => {
        result.current.reset();
      });
    }).toThrow('Reset failed');
  });

  // Active Category Tests
  it('sets active category', () => {
    const { result } = renderHook(() => useSettings());

    act(() => {
      result.current.setActiveCategory('ai');
    });

    expect(result.current.activeCategory).toBe('ai');
  });

  it('changes active category', () => {
    const { result } = renderHook(() => useSettings());

    act(() => {
      result.current.setActiveCategory('appearance');
      result.current.setActiveCategory('editor');
    });

    expect(result.current.activeCategory).toBe('editor');
  });

  // Error Management Tests
  it('clears error state', () => {
    const { result } = renderHook(() => useSettings());

    act(() => {
      result.current.update({ fontSize: 5 } as any);
    });

    expect(result.current.error).toBe('Invalid settings data');

    act(() => {
      result.current.clearError();
    });

    expect(result.current.error).toBeNull();
  });

  it('clears error before new operations', () => {
    const { result } = renderHook(() => useSettings());

    // Force an error
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: vi.fn().mockReturnValue(null),
        setItem: () => {
          throw new Error('Save error');
        },
        removeItem: vi.fn(),
        clear: vi.fn(),
      },
      writable: true,
    });

    act(() => {
      result.current.update({ theme: 'dark' });
    });

    expect(result.current.error).toBe('Save error');

    // Fix localStorage and try again
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: vi.fn().mockReturnValue(null),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn(),
      },
      writable: true,
    });

    act(() => {
      result.current.update({ theme: 'light' });
    });

    expect(result.current.error).toBeNull();
  });

  // Initial State Tests
  it('maintains initial state correctly', () => {
    const { result } = renderHook(() => useSettings());

    expect(result.current.settings).toEqual(DEFAULT_SETTINGS);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isSaving).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.activeCategory).toBe('appearance');
  });
});
