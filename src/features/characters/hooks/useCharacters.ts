import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

import { characterService } from '../services/characterService';
import { type Character, type CharacterFilters } from '../types';

interface CharactersState {
  // Data
  characters: Character[];
  selectedId: string | null;
  filters: CharacterFilters;

  // UI State
  isLoading: boolean;
  isEditing: boolean;
  error: string | null;

  // Actions
  init: () => Promise<void>;
  load: (projectId: string) => Promise<void>;
  create: (character: Omit<Character, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  update: (id: string, data: Partial<Character>) => Promise<void>;
  delete: (id: string) => Promise<void>;
  select: (id: string | null) => void;
  setFilters: (filters: Partial<CharacterFilters>) => void;
  setEditing: (isEditing: boolean) => void;
}

export const useCharacters = create<CharactersState>()(
  devtools(
    set => ({
      // Initial State
      characters: [],
      selectedId: null,
      filters: {
        search: '',
        roles: [],
        arcs: [],
        validationStatus: 'all',
      },
      isLoading: false,
      isEditing: false,
      error: null,

      // Initialize service
      init: async (): Promise<void> => {
        try {
          set({ isLoading: true });
          await characterService.init();
          set({ isLoading: false });
        } catch (err) {
          set({
            error: err instanceof Error ? err.message : 'Failed to initialize',
            isLoading: false,
          });
        }
      },

      // Load characters
      load: async (projectId: string): Promise<void> => {
        try {
          set({ isLoading: true, error: null });
          const characters = await characterService.getAll(projectId);
          set({ characters, isLoading: false });
        } catch (err) {
          set({
            error: err instanceof Error ? err.message : 'Failed to load characters',
            isLoading: false,
          });
        }
      },

      // Create character
      create: async (
        characterData: Omit<Character, 'id' | 'createdAt' | 'updatedAt'>,
      ): Promise<void> => {
        try {
          set({ isLoading: true, error: null });
          const newCharacter: Character = {
            ...characterData,
            id: crypto.randomUUID(),
            createdAt: Date.now(),
            updatedAt: Date.now(),
          } as Character;
          await characterService.create(newCharacter);
          set(state => ({
            characters: [...state.characters, newCharacter],
            isLoading: false,
            isEditing: false,
          }));
        } catch (err) {
          set({
            error: err instanceof Error ? err.message : 'Failed to create character',
            isLoading: false,
          });
        }
      },

      // Update character
      update: async (id: string, data: Partial<Character>): Promise<void> => {
        try {
          set({ isLoading: true, error: null });
          const updated = await characterService.update(id, data);
          set(state => ({
            characters: state.characters.map(c => (c.id === id ? updated : c)),
            isLoading: false,
            isEditing: false,
          }));
        } catch (err) {
          set({
            error: err instanceof Error ? err.message : 'Failed to update character',
            isLoading: false,
          });
        }
      },

      // Delete character
      delete: async (id: string): Promise<void> => {
        try {
          set({ isLoading: true, error: null });
          await characterService.delete(id);
          set(state => ({
            characters: state.characters.filter(c => c.id !== id),
            selectedId: state.selectedId === id ? null : state.selectedId,
            isLoading: false,
          }));
        } catch (err) {
          set({
            error: err instanceof Error ? err.message : 'Failed to delete character',
            isLoading: false,
          });
        }
      },

      // Select character
      select: (id: string | null): void => {
        set({ selectedId: id });
      },

      // Set filters
      setFilters: (newFilters: Partial<CharacterFilters>): void => {
        set(state => ({
          filters: { ...state.filters, ...newFilters },
        }));
      },

      // Set editing mode
      setEditing: (isEditing: boolean): void => {
        set({ isEditing });
      },
    }),
    { name: 'CharactersStore' },
  ),
);
