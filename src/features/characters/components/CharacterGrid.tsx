import { AnimatePresence, motion } from 'framer-motion';
import { Users, Plus } from 'lucide-react';
import React from 'react';

import { Button } from '../../../components/ui/Button';
import { type Character } from '../types';

import { CharacterCard } from './CharacterCard';

interface CharacterGridProps {
  characters: Character[];
  selectedIds: Set<string>;
  loading: boolean;
  onSelect: (character: Character) => void;
  onToggleSelection: (id: string) => void;
  onEdit: (character: Character) => void;
  onDelete: (id: string) => void;
  onCreate: () => void;
}

export const CharacterGrid: React.FC<CharacterGridProps> = ({
  characters,
  selectedIds,
  loading,
  onSelect,
  onToggleSelection,
  onEdit,
  onDelete,
  onCreate,
}) => {
  if (loading) {
    return (
      <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
        {[1, 2, 3, 4].map(i => (
          <div key={i} className='h-48 animate-pulse rounded-xl bg-muted/20' />
        ))}
      </div>
    );
  }

  if (characters.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className='rounded-lg border border-dashed border-border bg-muted/20 py-12 text-center'
      >
        <Users className='mx-auto mb-4 h-12 w-12 text-muted-foreground/50' />
        <h3 className='mb-2 text-lg font-semibold'>No Characters Found</h3>
        <p className='mb-4 text-muted-foreground'>
          Start building your cast by creating your first character.
        </p>
        <Button onClick={onCreate}>
          <Plus className='mr-2 h-4 w-4' />
          Create First Character
        </Button>
      </motion.div>
    );
  }

  return (
    <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
      <AnimatePresence>
        {characters.map(character => (
          <CharacterCard
            key={character.id}
            character={character}
            isSelected={selectedIds.has(character.id)}
            onSelect={onSelect}
            onToggleSelection={onToggleSelection}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </AnimatePresence>
    </div>
  );
};
