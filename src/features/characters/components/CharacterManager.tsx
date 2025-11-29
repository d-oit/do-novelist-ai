import React, { useEffect, useMemo, useState } from 'react';
import { Users, Plus, AlertCircle } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { cn } from '../../../lib/utils';
import { useCharacters } from '../hooks/useCharacters';
import { CharacterFilters } from './CharacterFilters';
import { CharacterGrid } from './CharacterGrid';
import { CharacterEditor } from './CharacterEditor';
import { CharacterStats } from './CharacterStats';
import type { Character } from '../types';
import { validateCharacter } from '../../../lib/character-validation';

interface CharacterManagerProps {
  projectId: string;
  className?: string;
}

export const CharacterManager: React.FC<CharacterManagerProps> = ({
  projectId,
  className
}) => {
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
    delete: deleteCharacter
  } = useCharacters();

  // Local state for the character being edited (null = creating new)
  const [editingChar, setEditingChar] = useState<Character | undefined>(undefined);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Load characters on mount
  useEffect(() => {
    load(projectId);
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
      if (filters.search) {
        const term = filters.search.toLowerCase();
        if (!char.name.toLowerCase().includes(term) &&
          !char.motivation.toLowerCase().includes(term)) {
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

  const handleCreate = () => {
    setEditingChar(undefined);
    setEditing(true);
  };

  const handleEdit = (char: Character) => {
    setEditingChar(char);
    setEditing(true);
  };

  const handleSave = async (data: Partial<Character>) => {
    if (editingChar) {
      await update(editingChar.id, data);
    } else {
      await create({ ...data, projectId } as any);
    }
    setEditing(false);
  };

  const handleToggleSelection = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  if (error) {
    return (
      <div className="p-4 bg-destructive/10 text-destructive rounded-lg flex items-center gap-2">
        <AlertCircle className="w-5 h-5" />
        {error}
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Users className="w-6 h-6" />
            Character Management
          </h2>
          <p className="text-muted-foreground">
            Manage your story's cast and their relationships
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="w-4 h-4 mr-2" />
          New Character
        </Button>
      </div>

      {/* Stats */}
      <CharacterStats characters={characters} />

      {/* Filters */}
      <CharacterFilters
        filters={filters}
        onFilterChange={setFilters}
      />

      {/* Grid */}
      <CharacterGrid
        characters={filteredCharacters}
        selectedIds={selectedIds}
        loading={isLoading}
        onSelect={(char) => select(char.id)}
        onToggleSelection={handleToggleSelection}
        onEdit={handleEdit}
        onDelete={deleteCharacter}
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