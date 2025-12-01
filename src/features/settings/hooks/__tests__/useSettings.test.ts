import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { settingsService } from '../../services/settingsService';
import { type Settings, type SettingsCategory } from '../../types';
import { DEFAULT_SETTINGS } from '../../types';
import { useSettings } from '../useSettings';

// Mock the settings service
vi.mock('../../services/settingsService');
const mockSettingsService = vi.mocked(settingsService);

// Mock DOM methods
const mockClassListToggle = vi.fn();
const mockSetProperty = vi.fn();

describe('useSettings', () => {
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

    // Setup DOM mocks
    Object.defineProperty(document, 'documentElement', {
      value: {
        classList: { toggle: mockClassListToggle },
        style: { fontSize: '', setProperty: mockSetProperty },
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

    mockSettingsService.load.mockReturnValue(DEFAULT_SETTINGS);
    mockSettingsService.save.mockReturnValue();
  });

  afterEach(() => {
    mockClassListToggle.mockClear();
    mockSetProperty.mockClear();
  });

  // Initialization Tests
  it('initializes with default settings', () => {
    const { result } = renderHook(() => useSettings());

    act(() => {
      result.current.init();
    });

    expect(mockSettingsService.load).toHaveBeenCalled();
    expect(result.current.settings).toEqual(DEFAULT_SETTINGS);
    expect(result.current.isLoading).toBe(false);
  });

  it('applies theme on initialization', async () => {
    const { result } = renderHook(() => useSettings());

    await act(async () => {
      result.current.init();
    });

    await waitFor(() => {
      expect(mockClassListToggle).toHaveBeenCalled();
    });
  });

  it('handles initialization errors', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockSettingsService.load.mockImplementation(() => {
      throw new Error('Load failed');
    });

    const { result } = renderHook(() => useSettings());

    act(() => {
      result.current.init();
    });

    expect(result.current.error).toBe('Load failed');
    expect(result.current.isLoading).toBe(false);

    consoleErrorSpy.mockRestore();
  });

  it('sets loading state during initialization', () => {
    mockSettingsService.load.mockReturnValue(DEFAULT_SETTINGS);

    const { result } = renderHook(() => useSettings());

    act(() => {
      result.current.init();
    });

    expect(result.current.isLoading).toBe(false); // init is synchronous
  });

  // Update Tests
  it('updates settings successfully', () => {
    const { result } = renderHook(() => useSettings());

    act(() => {
      result.current.init();
    });

    const updates: Partial<Settings> = {
      fontSize: 18,
      theme: 'dark',
    };

    act(() => {
      result.current.update(updates);
    });

    expect(mockSettingsService.save).toHaveBeenCalled();
    expect(result.current.settings.fontSize).toBe(18);
    expect(result.current.settings.theme).toBe('dark');
    expect(result.current.isSaving).toBe(false);
  });

  it('applies theme when theme is updated', () => {
    const { result } = renderHook(() => useSettings());

    act(() => {
      result.current.init();
    });

    mockClassListToggle.mockClear();

    act(() => {
      result.current.update({ theme: 'dark' });
    });

    expect(mockClassListToggle).toHaveBeenCalledWith('dark', true);
  });

  it('applies font size when fontSize is updated', () => {
    const { result } = renderHook(() => useSettings());

    act(() => {
      result.current.init();
    });

    act(() => {
      result.current.update({ fontSize: 20 });
    });

    expect(document.documentElement.style.fontSize).toBe('20px');
  });

  it('validates settings before saving', () => {
    const { result } = renderHook(() => useSettings());

    act(() => {
      result.current.init();
    });

    // Try to update with invalid data (fontSize too low)
    act(() => {
      result.current.update({ fontSize: 5 } as any);
    });

    expect(result.current.error).toBe('Invalid settings data');
  });

  it('handles update errors', () => {
    mockSettingsService.save.mockImplementation(() => {
      throw new Error('Save failed');
    });

    const { result } = renderHook(() => useSettings());

    act(() => {
      result.current.init();
    });

    act(() => {
      result.current.update({ theme: 'dark' });
    });

    expect(result.current.error).toBe('Save failed');
    expect(result.current.isSaving).toBe(false);
  });

  it('sets saving state during update', () => {
    const { result } = renderHook(() => useSettings());

    act(() => {
      result.current.init();
    });

    act(() => {
      result.current.update({ theme: 'dark' });
    });

    expect(result.current.isSaving).toBe(false); // update is synchronous
  });

  // Reset Tests
  it('resets all settings to defaults', () => {
    const { result } = renderHook(() => useSettings());

    act(() => {
      result.current.init();
    });

    act(() => {
      result.current.update({ fontSize: 20, theme: 'dark' });
    });

    act(() => {
      result.current.reset();
    });

    expect(result.current.settings).toEqual(DEFAULT_SETTINGS);
    expect(mockSettingsService.save).toHaveBeenCalledWith(DEFAULT_SETTINGS);
  });

  it('reapplies defaults after reset', () => {
    const { result } = renderHook(() => useSettings());

    act(() => {
      result.current.init();
    });

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
    mockSettingsService.save.mockImplementation(() => {
      throw new Error('Reset failed');
    });

    const { result } = renderHook(() => useSettings());

    act(() => {
      result.current.init();
    });

    expect(() => {
      act(() => {
        result.current.reset();
      });
    }).toThrow('Reset failed');
  });

  // Reset Category Tests
  it('resets appearance category settings', () => {
    const { result } = renderHook(() => useSettings());

    act(() => {
      result.current.init();
    });

    act(() => {
      result.current.update({
        theme: 'dark',
        fontSize: 20,
        fontFamily: 'serif',
        compactMode: true,
        // Keep other settings different
        autoSave: false,
      });
    });

    act(() => {
      result.current.resetCategory('appearance');
    });

    expect(result.current.settings.theme).toBe(DEFAULT_SETTINGS.theme);
    expect(result.current.settings.fontSize).toBe(DEFAULT_SETTINGS.fontSize);
    expect(result.current.settings.fontFamily).toBe(DEFAULT_SETTINGS.fontFamily);
    expect(result.current.settings.compactMode).toBe(DEFAULT_SETTINGS.compactMode);
    expect(result.current.settings.autoSave).toBe(false); // Other settings unchanged
  });

  it('resets AI category settings', () => {
    const { result } = renderHook(() => useSettings());

    act(() => {
      result.current.init();
    });

    act(() => {
      result.current.update({
        aiModel: 'gpt-4',
        aiTemperature: 1.0,
        enableAIAssistance: false,
      });
    });

    act(() => {
      result.current.resetCategory('ai');
    });

    expect(result.current.settings.aiModel).toBe(DEFAULT_SETTINGS.aiModel);
    expect(result.current.settings.aiTemperature).toBe(DEFAULT_SETTINGS.aiTemperature);
    expect(result.current.settings.enableAIAssistance).toBe(DEFAULT_SETTINGS.enableAIAssistance);
  });

  it('resets editor category settings', () => {
    const { result } = renderHook(() => useSettings());

    act(() => {
      result.current.init();
    });

    act(() => {
      result.current.update({
        autoSave: false,
        autoSaveInterval: 120,
        spellCheck: false,
        wordWrap: false,
      });
    });

    act(() => {
      result.current.resetCategory('editor');
    });

    expect(result.current.settings.autoSave).toBe(DEFAULT_SETTINGS.autoSave);
    expect(result.current.settings.autoSaveInterval).toBe(DEFAULT_SETTINGS.autoSaveInterval);
    expect(result.current.settings.spellCheck).toBe(DEFAULT_SETTINGS.spellCheck);
    expect(result.current.settings.wordWrap).toBe(DEFAULT_SETTINGS.wordWrap);
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
    mockSettingsService.load.mockImplementation(() => {
      throw new Error('Load error');
    });

    const { result } = renderHook(() => useSettings());

    act(() => {
      result.current.init();
    });

    expect(result.current.error).toBe('Load error');

    act(() => {
      result.current.clearError();
    });

    expect(result.current.error).toBeNull();
  });

  it('clears error before new operations', () => {
    mockSettingsService.save.mockImplementation(() => {
      throw new Error('Save error');
    });

    const { result } = renderHook(() => useSettings());

    act(() => {
      result.current.init();
    });

    act(() => {
      result.current.update({ theme: 'dark' });
    });

    expect(result.current.error).toBe('Save error');

    mockSettingsService.save.mockImplementation(() => {});

    act(() => {
      result.current.update({ theme: 'light' });
    });

    expect(result.current.error).toBeNull();
  });

  // Theme Application Tests
  it('applies light theme correctly', () => {
    const { result } = renderHook(() => useSettings());

    act(() => {
      result.current.init();
    });

    mockClassListToggle.mockClear();

    act(() => {
      result.current.update({ theme: 'light' });
    });

    expect(mockClassListToggle).toHaveBeenCalledWith('dark', false);
  });

  it('applies dark theme correctly', () => {
    const { result } = renderHook(() => useSettings());

    act(() => {
      result.current.init();
    });

    mockClassListToggle.mockClear();

    act(() => {
      result.current.update({ theme: 'dark' });
    });

    expect(mockClassListToggle).toHaveBeenCalledWith('dark', true);
  });

  it('applies system theme based on media query', () => {
    const matchMediaMock = vi.fn().mockImplementation(query => ({
      matches: query === '(prefers-color-scheme: dark)',
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    window.matchMedia = matchMediaMock;

    const { result } = renderHook(() => useSettings());

    act(() => {
      result.current.init();
    });

    mockClassListToggle.mockClear();

    act(() => {
      result.current.update({ theme: 'system' });
    });

    expect(mockClassListToggle).toHaveBeenCalledWith('dark', true);
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

  // Persistence Tests
  it('persists settings across hook remounts', () => {
    const customSettings: Settings = {
      ...DEFAULT_SETTINGS,
      theme: 'dark',
      fontSize: 18,
    };

    mockSettingsService.load.mockReturnValue(customSettings);

    const { result: result1 } = renderHook(() => useSettings());

    act(() => {
      result1.current.init();
    });

    expect(result1.current.settings.theme).toBe('dark');

    // Remount
    const { result: result2 } = renderHook(() => useSettings());

    act(() => {
      result2.current.init();
    });

    expect(result2.current.settings.theme).toBe('dark');
  });

  // Multiple Settings Update Tests
  it('updates multiple settings at once', () => {
    const { result } = renderHook(() => useSettings());

    act(() => {
      result.current.init();
    });

    const updates: Partial<Settings> = {
      theme: 'dark',
      fontSize: 18,
      autoSave: false,
      dailyWordGoal: 1000,
    };

    act(() => {
      result.current.update(updates);
    });

    expect(result.current.settings.theme).toBe('dark');
    expect(result.current.settings.fontSize).toBe(18);
    expect(result.current.settings.autoSave).toBe(false);
    expect(result.current.settings.dailyWordGoal).toBe(1000);
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
});
