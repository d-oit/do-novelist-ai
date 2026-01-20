import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { useSettings } from '@/features/settings/hooks/useSettings';
import { settingsService } from '@/features/settings/services/settingsService';
import { type Settings } from '@/types';
import { DEFAULT_SETTINGS } from '@/types';

// Mock settings service
vi.mock('../../services/settingsService');
const mockSettingsService = vi.mocked(settingsService);

// Mock DOM methods
const mockClassListToggle = vi.fn();
const mockSetProperty = vi.fn();

describe('useSettings - Advanced Features', () => {
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

  // Persistence Tests
  it('persists settings across hook remounts', () => {
    const customSettings: Settings = {
      ...DEFAULT_SETTINGS,
      theme: 'dark',
      fontSize: 18,
    };

    mockSettingsService.load.mockResolvedValue(customSettings);

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

  // Advanced Font Settings
  it('applies font family when updated', () => {
    const { result } = renderHook(() => useSettings());

    act(() => {
      result.current.init();
    });

    act(() => {
      result.current.update({ fontFamily: 'serif' });
    });

    expect(result.current.settings.fontFamily).toBe('serif');
  });

  it('applies compact mode when enabled', () => {
    const { result } = renderHook(() => useSettings());

    act(() => {
      result.current.init();
    });

    act(() => {
      result.current.update({ compactMode: true });
    });

    expect(result.current.settings.compactMode).toBe(true);
  });

  // AI Settings Tests
  it('updates AI model setting', () => {
    const { result } = renderHook(() => useSettings());

    act(() => {
      result.current.init();
    });

    act(() => {
      result.current.update({ aiModel: 'gpt-4' });
    });

    expect(result.current.settings.aiModel).toBe('gpt-4');
  });

  it('updates AI temperature setting', () => {
    const { result } = renderHook(() => useSettings());

    act(() => {
      result.current.init();
    });

    act(() => {
      result.current.update({ aiTemperature: 0.8 });
    });

    expect(result.current.settings.aiTemperature).toBe(0.8);
  });

  it('toggles AI assistance setting', () => {
    const { result } = renderHook(() => useSettings());

    act(() => {
      result.current.init();
    });

    act(() => {
      result.current.update({ enableAIAssistance: false });
    });

    expect(result.current.settings.enableAIAssistance).toBe(false);
  });

  // Editor Settings Tests
  it('updates auto-save interval', () => {
    const { result } = renderHook(() => useSettings());

    act(() => {
      result.current.init();
    });

    act(() => {
      result.current.update({ autoSaveInterval: 120 });
    });

    expect(result.current.settings.autoSaveInterval).toBe(120);
  });

  it('toggles spell check setting', () => {
    const { result } = renderHook(() => useSettings());

    act(() => {
      result.current.init();
    });

    act(() => {
      result.current.update({ spellCheck: false });
    });

    expect(result.current.settings.spellCheck).toBe(false);
  });

  it('toggles word wrap setting', () => {
    const { result } = renderHook(() => useSettings());

    act(() => {
      result.current.init();
    });

    act(() => {
      result.current.update({ wordWrap: false });
    });

    expect(result.current.settings.wordWrap).toBe(false);
  });

  // Goals Settings Tests
  it('updates daily word goal', () => {
    const { result } = renderHook(() => useSettings());

    act(() => {
      result.current.init();
    });

    act(() => {
      result.current.update({ dailyWordGoal: 2000 });
    });

    expect(result.current.settings.dailyWordGoal).toBe(2000);
  });
  // Removed test for weeklyWritingDays - property doesn't exist in Settings type
});
