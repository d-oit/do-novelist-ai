import React from 'react';
import { motion } from 'framer-motion';
import {
    Crown, Sword, Heart, BookOpen, Users, Zap, Target,
    Edit3, Trash2, CheckCircle2
} from 'lucide-react';

import { cn, iconButtonTarget } from '../../../lib/utils';
import type { Character, CharacterRole } from '../types';

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
const getRoleIcon = (role: CharacterRole) => {
    return CHARACTER_ROLE_ICONS[role] || Users;
};

const CHARACTER_ROLE_COLORS: Record<CharacterRole, string> = {
    protagonist: 'text-yellow-500',
    antagonist: 'text-red-500',
    supporting: 'text-blue-500',
    mentor: 'text-purple-500',
    foil: 'text-orange-500',
    'love-interest': 'text-pink-500',
    'comic-relief': 'text-green-500'
};

export const CharacterCard: React.FC<CharacterCardProps> = ({
    character,
    isSelected,
    onSelect,
    onToggleSelection,
    onEdit,
    onDelete
}) => {
    const IconComponent = getRoleIcon(character.role);
    const roleColor = CHARACTER_ROLE_COLORS[character.role] || 'text-gray-500';

    // Helper to determine tier (simplified from original)
    const getTier = (role: CharacterRole) => {
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
                "relative bg-card border rounded-xl p-4 cursor-pointer transition-all duration-200",
                isSelected ? "border-primary ring-2 ring-primary/20" : "border-border hover:border-border/60",
                "hover:shadow-lg"
            )}
            onClick={() => onSelect(character)}
        >
            {/* Selection Checkbox */}
            <motion.button
                className="absolute top-2 right-2 w-5 h-5 rounded border-2 border-border bg-background flex items-center justify-center"
                onClick={(e) => {
                    e.stopPropagation();
                    onToggleSelection(character.id);
                }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
            >
                {isSelected && <CheckCircle2 className="w-3 h-3 text-primary" />}
            </motion.button>

            {/* Character Portrait */}
            <div className="flex items-start gap-3 mb-3">
                {character.imageUrl ? (
                    <img
                        src={character.imageUrl}
                        alt={character.name}
                        className="w-12 h-12 rounded-full object-cover"
                    />
                ) : (
                    <div className={cn(
                        "w-12 h-12 rounded-full bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center",
                        roleColor
                    )}>
                        <IconComponent className="w-6 h-6" />
                    </div>
                )}

                <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate">{character.name}</h3>
                    <p className="text-sm text-muted-foreground capitalize">
                        {character.role.replace('-', ' ')}
                    </p>
                </div>
            </div>

            {/* Character Summary/Motivation */}
            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                {character.motivation}
            </p>

            {/* Character Metrics */}
            <div className="flex items-center gap-2 mb-3">
                <div className={cn(
                    "px-2 py-1 rounded text-xs font-medium",
                    tier === 'main' && "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200",
                    tier === 'supporting' && "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200",
                    tier === 'minor' && "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200"
                )}>
                    {tier}
                </div>
                <div className="text-xs text-muted-foreground">
                    {character.arc} arc
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-1 border-t pt-2 mt-2">
                <motion.button
                    onClick={(e) => {
                        e.stopPropagation();
                        onEdit(character);
                    }}
                    className={iconButtonTarget("rounded hover:bg-accent transition-colors")}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    aria-label="Edit character"
                >
                    <Edit3 className="w-4 h-4" />
                </motion.button>

                <motion.button
                    onClick={(e) => {
                        e.stopPropagation();
                        onDelete(character.id);
                    }}
                    className={iconButtonTarget("rounded hover:bg-destructive/10 hover:text-destructive transition-colors")}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    aria-label="Delete character"
                >
                    <Trash2 className="w-4 h-4" />
                </motion.button>
            </div>
        </motion.div>
    );
};
