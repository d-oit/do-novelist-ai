import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useCharacters } from '../useCharacters';
import { characterService } from '../../services/characterService';
import type { Character, CharacterRole, CharacterArc } from '../../types';

// Mock the character service
vi.mock('../../services/characterService');
const mockCharacterService = vi.mocked(characterService);

const createMockCharacter = (overrides: Partial<Character> = {}): Character => ({
  id: crypto.randomUUID(),
  projectId: 'test-project-id',
  name: 'Test Character',
  role: 'protagonist' as CharacterRole,
  arc: 'change' as CharacterArc,
  age: 25,
  gender: 'Female',
  occupation: 'Detective',
  motivation: 'To solve the mystery of her past',
  goal: 'Find the truth about her family',
  conflict: 'Her past connections threaten her current life',
  backstory: 'Grew up in a mysterious household',
  traits: [
    {
      category: 'personality',
      name: 'Determined',
      description: 'Never gives up',
      intensity: 8
    }
  ],
  relationships: [],
  createdAt: Date.now(),
  updatedAt: Date.now(),
  ...overrides
});

describe('useCharacters', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Reset Zustand store state
    useCharacters.setState({
      characters: [],
      selectedId: null,
      filters: {
        search: '',
        roles: [],
        arcs: [],
        validationStatus: 'all'
      },
      isLoading: false,
      isEditing: false,
      error: null
    });

    mockCharacterService.init.mockResolvedValue();
    mockCharacterService.getAll.mockResolvedValue([]);
    mockCharacterService.create.mockImplementation(async (character) => character);
    mockCharacterService.update.mockImplementation(async (id, data) => {
      const char = createMockCharacter({ id, ...data });
      return char;
    });
    mockCharacterService.delete.mockResolvedValue();
  });

  // Initialization Tests
  it('initializes the character service', async () => {
    const { result } = renderHook(() => useCharacters());

    await act(async () => {
      await result.current.init();
    });

    expect(mockCharacterService.init).toHaveBeenCalled();
    expect(result.current.isLoading).toBe(false);
  });

  it('handles initialization errors', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockCharacterService.init.mockRejectedValue(new Error('Database error'));

    const { result } = renderHook(() => useCharacters());

    await act(async () => {
      await result.current.init();
    });

    await waitFor(() => {
      expect(result.current.error).toBe('Database error');
      expect(result.current.isLoading).toBe(false);
    });

    consoleErrorSpy.mockRestore();
  });

  // Load Tests
  it('loads characters for a project', async () => {
    const mockCharacters = [
      createMockCharacter({ name: 'Character 1' }),
      createMockCharacter({ name: 'Character 2' })
    ];
    mockCharacterService.getAll.mockResolvedValue(mockCharacters);

    const { result } = renderHook(() => useCharacters());

    await act(async () => {
      await result.current.load('test-project-id');
    });

    expect(mockCharacterService.getAll).toHaveBeenCalledWith('test-project-id');
    expect(result.current.characters).toEqual(mockCharacters);
    expect(result.current.isLoading).toBe(false);
  });

  it('sets loading state while loading characters', async () => {
    mockCharacterService.getAll.mockImplementation(() => {
      return new Promise(resolve => setTimeout(() => resolve([]), 100));
    });

    const { result } = renderHook(() => useCharacters());

    act(() => {
      result.current.load('test-project-id');
    });

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
  });

  it('handles load errors', async () => {
    mockCharacterService.getAll.mockRejectedValue(new Error('Failed to load'));

    const { result } = renderHook(() => useCharacters());

    await act(async () => {
      await result.current.load('test-project-id');
    });

    await waitFor(() => {
      expect(result.current.error).toBe('Failed to load');
      expect(result.current.isLoading).toBe(false);
    });
  });

  // Create Tests
  it('creates a new character', async () => {
    const { result } = renderHook(() => useCharacters());

    const newCharacterData = {
      projectId: 'test-project-id',
      name: 'New Character',
      role: 'antagonist' as CharacterRole,
      arc: 'fall' as CharacterArc,
      motivation: 'Seeking power at any cost',
      goal: 'Control the kingdom',
      conflict: 'Moral boundaries limit his ambition',
      traits: [],
      relationships: []
    };

    await act(async () => {
      await result.current.create(newCharacterData);
    });

    expect(mockCharacterService.create).toHaveBeenCalled();
    expect(result.current.characters).toHaveLength(1);
    expect(result.current.characters[0]?.name).toBe('New Character');
    expect(result.current.isEditing).toBe(false);
  });

  it('generates unique IDs for new characters', async () => {
    const { result } = renderHook(() => useCharacters());

    const characterData = {
      projectId: 'test-project-id',
      name: 'Character',
      role: 'protagonist' as CharacterRole,
      arc: 'growth' as CharacterArc,
      motivation: 'Test motivation',
      goal: 'Test goal',
      conflict: 'Test conflict',
      traits: [],
      relationships: []
    };

    await act(async () => {
      await result.current.create(characterData);
      await result.current.create(characterData);
    });

    expect(result.current.characters).toHaveLength(2);
    expect(result.current.characters[0]?.id).not.toBe(result.current.characters[1]?.id);
  });

  it('sets timestamps when creating characters', async () => {
    const { result } = renderHook(() => useCharacters());

    await act(async () => {
      await result.current.create({
        projectId: 'test-project-id',
        name: 'Test',
        role: 'protagonist' as CharacterRole,
        arc: 'change' as CharacterArc,
        motivation: 'Test motivation',
        goal: 'Test goal',
        conflict: 'Test conflict',
        traits: [],
        relationships: []
      });
    });

    const character = result.current.characters[0];

    expect(character?.createdAt).toBeGreaterThan(0);
    expect(character?.updatedAt).toBeGreaterThan(0);
    expect(character?.updatedAt).toBe(character?.createdAt);
  });

  it('handles create errors', async () => {
    // Explicitly reset and set mock for this test
    mockCharacterService.create.mockReset();
    mockCharacterService.create.mockRejectedValue(new Error('Creation failed'));

    const { result } = renderHook(() => useCharacters());

    // Ensure starting with clean state
    expect(result.current.characters).toHaveLength(0);

    await act(async () => {
      await result.current.create({
        projectId: 'test-project-id',
        name: 'Test',
        role: 'protagonist' as CharacterRole,
        arc: 'change' as CharacterArc,
        motivation: 'Test motivation',
        goal: 'Test goal',
        conflict: 'Test conflict',
        traits: [],
        relationships: []
      });
    });

    await waitFor(() => {
      expect(result.current.error).toBe('Creation failed');
    });

    expect(result.current.characters).toHaveLength(0);
  });

  // Update Tests
  it('updates an existing character', async () => {
    const existingCharacter = createMockCharacter({ name: 'Original Name' });
    mockCharacterService.getAll.mockResolvedValue([existingCharacter]);

    const { result } = renderHook(() => useCharacters());

    await act(async () => {
      await result.current.load('test-project-id');
    });

    await act(async () => {
      await result.current.update(existingCharacter.id, { name: 'Updated Name' });
    });

    expect(mockCharacterService.update).toHaveBeenCalledWith(existingCharacter.id, { name: 'Updated Name' });
    expect(result.current.characters[0]?.name).toBe('Updated Name');
    expect(result.current.isEditing).toBe(false);
  });

  it('updates timestamps when updating characters', async () => {
    const existingCharacter = createMockCharacter();
    mockCharacterService.getAll.mockResolvedValue([existingCharacter]);

    const { result } = renderHook(() => useCharacters());

    await act(async () => {
      await result.current.load('test-project-id');
    });

    const originalUpdatedAt = result.current.characters[0]?.updatedAt;

    await act(async () => {
      await result.current.update(existingCharacter.id, { name: 'Updated' });
    });

    expect(result.current.characters[0]?.updatedAt).toBeGreaterThan(originalUpdatedAt || 0);
  });

  it('handles update errors', async () => {
    const existingCharacter = createMockCharacter();
    mockCharacterService.getAll.mockResolvedValue([existingCharacter]);
    mockCharacterService.update.mockRejectedValue(new Error('Update failed'));

    const { result } = renderHook(() => useCharacters());

    await act(async () => {
      await result.current.load('test-project-id');
    });

    await act(async () => {
      await result.current.update(existingCharacter.id, { name: 'Updated' });
    });

    await waitFor(() => {
      expect(result.current.error).toBe('Update failed');
    });
  });

  // Delete Tests
  it('deletes a character', async () => {
    const character1 = createMockCharacter({ name: 'Character 1' });
    const character2 = createMockCharacter({ name: 'Character 2' });
    mockCharacterService.getAll.mockResolvedValue([character1, character2]);

    const { result } = renderHook(() => useCharacters());

    await act(async () => {
      await result.current.load('test-project-id');
    });

    expect(result.current.characters).toHaveLength(2);

    await act(async () => {
      await result.current.delete(character1.id);
    });

    expect(mockCharacterService.delete).toHaveBeenCalledWith(character1.id);
    expect(result.current.characters).toHaveLength(1);
    expect(result.current.characters[0]?.id).toBe(character2.id);
  });

  it('clears selection when deleting selected character', async () => {
    const character = createMockCharacter();
    mockCharacterService.getAll.mockResolvedValue([character]);

    const { result } = renderHook(() => useCharacters());

    await act(async () => {
      await result.current.load('test-project-id');
      result.current.select(character.id);
    });

    expect(result.current.selectedId).toBe(character.id);

    await act(async () => {
      await result.current.delete(character.id);
    });

    expect(result.current.selectedId).toBeNull();
  });

  it('keeps selection when deleting different character', async () => {
    const character1 = createMockCharacter({ name: 'Character 1' });
    const character2 = createMockCharacter({ name: 'Character 2' });
    mockCharacterService.getAll.mockResolvedValue([character1, character2]);

    const { result } = renderHook(() => useCharacters());

    await act(async () => {
      await result.current.load('test-project-id');
      result.current.select(character1.id);
    });

    await act(async () => {
      await result.current.delete(character2.id);
    });

    expect(result.current.selectedId).toBe(character1.id);
  });

  it('handles delete errors', async () => {
    const character = createMockCharacter();
    mockCharacterService.getAll.mockResolvedValue([character]);
    mockCharacterService.delete.mockRejectedValue(new Error('Delete failed'));

    const { result } = renderHook(() => useCharacters());

    await act(async () => {
      await result.current.load('test-project-id');
    });

    await act(async () => {
      await result.current.delete(character.id);
    });

    await waitFor(() => {
      expect(result.current.error).toBe('Delete failed');
      expect(result.current.characters).toHaveLength(1);
    });
  });

  // Selection Tests
  it('selects a character', () => {
    const { result } = renderHook(() => useCharacters());

    act(() => {
      result.current.select('test-id');
    });

    expect(result.current.selectedId).toBe('test-id');
  });

  it('clears selection when selecting null', () => {
    const { result } = renderHook(() => useCharacters());

    act(() => {
      result.current.select('test-id');
      result.current.select(null);
    });

    expect(result.current.selectedId).toBeNull();
  });

  // Filter Tests
  it('sets search filter', () => {
    const { result } = renderHook(() => useCharacters());

    act(() => {
      result.current.setFilters({ search: 'test query' });
    });

    expect(result.current.filters.search).toBe('test query');
  });

  it('sets role filter', () => {
    const { result } = renderHook(() => useCharacters());

    act(() => {
      result.current.setFilters({ roles: ['protagonist', 'antagonist'] });
    });

    expect(result.current.filters.roles).toEqual(['protagonist', 'antagonist']);
  });

  it('sets arc filter', () => {
    const { result } = renderHook(() => useCharacters());

    act(() => {
      result.current.setFilters({ arcs: ['change', 'growth'] });
    });

    expect(result.current.filters.arcs).toEqual(['change', 'growth']);
  });

  it('sets validation status filter', () => {
    const { result } = renderHook(() => useCharacters());

    act(() => {
      result.current.setFilters({ validationStatus: 'warnings' });
    });

    expect(result.current.filters.validationStatus).toBe('warnings');
  });

  it('merges filter updates', () => {
    const { result } = renderHook(() => useCharacters());

    act(() => {
      result.current.setFilters({ search: 'test' });
      result.current.setFilters({ roles: ['protagonist'] });
    });

    expect(result.current.filters.search).toBe('test');
    expect(result.current.filters.roles).toEqual(['protagonist']);
  });

  // Editing Mode Tests
  it('sets editing mode', () => {
    const { result } = renderHook(() => useCharacters());

    act(() => {
      result.current.setEditing(true);
    });

    expect(result.current.isEditing).toBe(true);

    act(() => {
      result.current.setEditing(false);
    });

    expect(result.current.isEditing).toBe(false);
  });

  it('clears editing mode after successful create', async () => {
    const { result } = renderHook(() => useCharacters());

    act(() => {
      result.current.setEditing(true);
    });

    await act(async () => {
      await result.current.create({
        projectId: 'test-project-id',
        name: 'Test',
        role: 'protagonist' as CharacterRole,
        arc: 'change' as CharacterArc,
        motivation: 'Test motivation',
        goal: 'Test goal',
        conflict: 'Test conflict',
        traits: [],
        relationships: []
      });
    });

    expect(result.current.isEditing).toBe(false);
  });

  it('clears editing mode after successful update', async () => {
    const character = createMockCharacter();
    mockCharacterService.getAll.mockResolvedValue([character]);

    const { result } = renderHook(() => useCharacters());

    await act(async () => {
      await result.current.load('test-project-id');
    });

    act(() => {
      result.current.setEditing(true);
    });

    await act(async () => {
      await result.current.update(character.id, { name: 'Updated' });
    });

    expect(result.current.isEditing).toBe(false);
  });

  // State Management Tests
  it('maintains initial state correctly', () => {
    const { result } = renderHook(() => useCharacters());

    expect(result.current.characters).toEqual([]);
    expect(result.current.selectedId).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isEditing).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.filters).toEqual({
      search: '',
      roles: [],
      arcs: [],
      validationStatus: 'all'
    });
  });

  it('clears error state on successful operation', async () => {
    mockCharacterService.getAll.mockRejectedValue(new Error('Load error'));

    const { result } = renderHook(() => useCharacters());

    await act(async () => {
      await result.current.load('test-project-id');
    });

    expect(result.current.error).toBe('Load error');

    mockCharacterService.getAll.mockResolvedValue([]);

    await act(async () => {
      await result.current.load('test-project-id');
    });

    expect(result.current.error).toBeNull();
  });
});
