import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Users, Plus } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { CharacterCard } from './CharacterCard';
import type { Character } from '../types';

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
    onCreate
}) => {
    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-48 bg-muted/20 animate-pulse rounded-xl" />
                ))}
            </div>
        );
    }

    if (characters.length === 0) {
        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12 border border-dashed border-border rounded-lg bg-muted/20"
            >
                <Users className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Characters Found</h3>
                <p className="text-muted-foreground mb-4">
                    Start building your cast by creating your first character.
                </p>
                <Button onClick={onCreate}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create First Character
                </Button>
            </motion.div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
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
