import { Users, Plus, AlertCircle } from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';

import { Button } from '../../../components/ui/Button';
import { validateCharacter } from '../../../lib/character-validation';
import { cn } from '../../../lib/utils';
import { useCharacters } from '../hooks/useCharacters';
import { type Character } from '../types';

import { CharacterEditor } from './CharacterEditor';
import { CharacterFilters } from './CharacterFilters';
import { CharacterGrid } from './CharacterGrid';
import { CharacterStats } from './CharacterStats';

interface CharacterManagerProps {
  projectId: string;
  className?: string;
}

export const CharacterManager: React.FC<CharacterManagerProps> = ({ projectId, className }) => {
  const {
    characters,
    filters,
    isLoading,
    error,
    isEditing,
    load,
    select,
    setFilters,
    setEditing,
    create,
    update,
    delete: deleteCharacter,
  } = useCharacters();

  // Local state for the character being edited (null = creating new)
  const [editingChar, setEditingChar] = useState<Character | undefined>(undefined);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Load characters on mount
  useEffect(() => {
    void load(projectId);
  }, [projectId, load]);

  // Helper function to get character validation status
  const getCharacterValidationStatus = (char: Character): 'valid' | 'warnings' | 'errors' => {
    try {
      const validation = validateCharacter.create(char, char.projectId);
      if (!validation.success) return 'errors';
      // For now, consider all successful validations as 'valid'
      // This can be enhanced later with actual warning detection
      return 'valid';
    } catch {
      return 'errors';
    }
  };

  // Filter logic
  const filteredCharacters = useMemo(() => {
    return characters.filter(char => {
      // Search
      if (filters.search && filters.search.length > 0) {
        const term = filters.search.toLowerCase();
        if (
          !char.name.toLowerCase().includes(term) &&
          !char.motivation.toLowerCase().includes(term)
        ) {
          return false;
        }
      }

      // Roles
      if (filters.roles.length > 0 && !filters.roles.includes(char.role)) {
        return false;
      }

      // Arcs
      if (filters.arcs.length > 0 && !filters.arcs.includes(char.arc)) {
        return false;
      }

      // Validation Status filtering
      if (filters.validationStatus !== 'all') {
        const hasValidation = getCharacterValidationStatus(char);
        switch (filters.validationStatus) {
          case 'valid':
            if (hasValidation !== 'valid') return false;
            break;
          case 'warnings':
            if (hasValidation !== 'warnings') return false;
            break;
          case 'errors':
            if (hasValidation !== 'errors') return false;
            break;
        }
      }

      return true;
    });
  }, [characters, filters]);

  const handleCreate = (): void => {
    setEditingChar(undefined);
    setEditing(true);
  };

  const handleEdit = (char: Character): void => {
    setEditingChar(char);
    setEditing(true);
  };

  const handleSave = async (data: Partial<Character>): Promise<void> => {
    if (editingChar) {
      await update(editingChar.id, data);
    } else {
      await create({ ...data, projectId } as Omit<Character, 'id' | 'createdAt' | 'updatedAt'>);
    }
    setEditing(false);
  };

  const handleToggleSelection = (id: string): void => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  if (error !== null) {
    return (
      <div className='flex items-center gap-2 rounded-lg bg-destructive/10 p-4 text-destructive'>
        <AlertCircle className='h-5 w-5' />
        {error}
      </div>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h2 className='flex items-center gap-2 text-2xl font-bold'>
            <Users className='h-6 w-6' />
            Character Management
          </h2>
          <p className='text-muted-foreground'>Manage your story's cast and their relationships</p>
        </div>
        <Button onClick={() => handleCreate()}>
          <Plus className='mr-2 h-4 w-4' />
          New Character
        </Button>
      </div>

      {/* Stats */}
      <CharacterStats characters={characters} />

      {/* Filters */}
      <CharacterFilters filters={filters} onFilterChange={setFilters} />

      {/* Grid */}
      <CharacterGrid
        characters={filteredCharacters}
        selectedIds={selectedIds}
        loading={isLoading}
        onSelect={char => void select(char.id)}
        onToggleSelection={handleToggleSelection}
        onEdit={handleEdit}
        onDelete={id => void deleteCharacter(id)}
        onCreate={handleCreate}
      />

      {/* Editor Modal */}
      <CharacterEditor
        isOpen={isEditing}
        onClose={() => setEditing(false)}
        onSave={handleSave}
        {...(editingChar ? { character: editingChar } : {})}
      />
    </div>
  );
};

export default CharacterManager;
