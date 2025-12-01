import { motion } from 'framer-motion';
import {
  Crown,
  Sword,
  Heart,
  BookOpen,
  Users,
  Zap,
  Target,
  Edit3,
  Trash2,
  CheckCircle2,
} from 'lucide-react';
import React from 'react';

import { cn, iconButtonTarget } from '../../../lib/utils';
import { type Character, type CharacterRole } from '../types';

interface CharacterCardProps {
  character: Character;
  isSelected: boolean;
  onSelect: (character: Character) => void;
  onToggleSelection: (id: string) => void;
  onEdit: (character: Character) => void;
  onDelete: (id: string) => void;
}

const CHARACTER_ROLE_ICONS: Record<CharacterRole, React.ComponentType<{ className?: string }>> = {
  protagonist: Crown,
  antagonist: Sword,
  // deuteragonist: Shield, // Not in new schema
  // tritagonist: Star, // Not in new schema
  'love-interest': Heart,
  mentor: BookOpen,
  // sidekick: Users, // Not in new schema
  foil: Zap,
  supporting: Target,
  // minor: Eye, // Not in new schema
  // background: EyeOff // Not in new schema
  'comic-relief': Users, // Added in new schema
};

// Fallback for missing icons if schema changed
const getRoleIcon = (role: CharacterRole): React.ComponentType<{ className?: string }> => {
  return CHARACTER_ROLE_ICONS[role] ?? Users;
};

const CHARACTER_ROLE_COLORS: Record<CharacterRole, string> = {
  protagonist: 'text-yellow-500',
  antagonist: 'text-red-500',
  supporting: 'text-blue-500',
  mentor: 'text-purple-500',
  foil: 'text-orange-500',
  'love-interest': 'text-pink-500',
  'comic-relief': 'text-green-500',
};

export const CharacterCard: React.FC<CharacterCardProps> = ({
  character,
  isSelected,
  onSelect,
  onToggleSelection,
  onEdit,
  onDelete,
}) => {
  const IconComponent = getRoleIcon(character.role);
  const roleColor = CHARACTER_ROLE_COLORS[character.role] || 'text-gray-500';

  // Helper to determine tier (simplified from original)
  const getTier = (role: CharacterRole): 'main' | 'supporting' | 'minor' => {
    if (role === 'protagonist' || role === 'antagonist') return 'main';
    if (role === 'supporting' || role === 'love-interest' || role === 'mentor') return 'supporting';
    return 'minor';
  };

  const tier = getTier(character.role);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      whileHover={{ y: -2 }}
      className={cn(
        'relative cursor-pointer rounded-xl border bg-card p-4 transition-all duration-200',
        isSelected
          ? 'border-primary ring-2 ring-primary/20'
          : 'border-border hover:border-border/60',
        'hover:shadow-lg',
      )}
      onClick={() => onSelect(character)}
    >
      {/* Selection Checkbox */}
      <motion.button
        className='absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded border-2 border-border bg-background'
        onClick={e => {
          e.stopPropagation();
          onToggleSelection(character.id);
        }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        {isSelected && <CheckCircle2 className='h-3 w-3 text-primary' />}
      </motion.button>

      {/* Character Portrait */}
      <div className='mb-3 flex items-start gap-3'>
        {character.imageUrl != null && character.imageUrl.length > 0 ? (
          <img
            src={character.imageUrl}
            alt={character.name}
            className='h-12 w-12 rounded-full object-cover'
          />
        ) : (
          <div
            className={cn(
              'flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-muted to-muted/50',
              roleColor,
            )}
          >
            <IconComponent className='h-6 w-6' />
          </div>
        )}

        <div className='min-w-0 flex-1'>
          <h3 className='truncate font-semibold'>{character.name}</h3>
          <p className='text-sm capitalize text-muted-foreground'>
            {character.role.replace('-', ' ')}
          </p>
        </div>
      </div>

      {/* Character Summary/Motivation */}
      <p className='mb-3 line-clamp-2 text-sm text-muted-foreground'>{character.motivation}</p>

      {/* Character Metrics */}
      <div className='mb-3 flex items-center gap-2'>
        <div
          className={cn(
            'rounded px-2 py-1 text-xs font-medium',
            tier === 'main' &&
              'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200',
            tier === 'supporting' &&
              'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200',
            tier === 'minor' &&
              'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200',
          )}
        >
          {tier}
        </div>
        <div className='text-xs text-muted-foreground'>{character.arc} arc</div>
      </div>

      {/* Action Buttons */}
      <div className='mt-2 flex items-center justify-end gap-1 border-t pt-2'>
        <motion.button
          onClick={e => {
            e.stopPropagation();
            onEdit(character);
          }}
          className={iconButtonTarget('rounded transition-colors hover:bg-accent')}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          aria-label='Edit character'
        >
          <Edit3 className='h-4 w-4' />
        </motion.button>

        <motion.button
          onClick={e => {
            e.stopPropagation();
            onDelete(character.id);
          }}
          className={iconButtonTarget(
            'rounded transition-colors hover:bg-destructive/10 hover:text-destructive',
          )}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          aria-label='Delete character'
        >
          <Trash2 className='h-4 w-4' />
        </motion.button>
      </div>
    </motion.div>
  );
};
