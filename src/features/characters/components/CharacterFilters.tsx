import React from 'react';
import { motion } from 'framer-motion';
import { Filter, Search } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card';
import { cn } from '../../../lib/utils';
import type { CharacterFilters as FilterType, CharacterRole } from '../types';

interface CharacterFiltersProps {
    filters: FilterType;
    onFilterChange: (filters: Partial<FilterType>) => void;
}

const ROLES: CharacterRole[] = [
    'protagonist', 'antagonist', 'supporting', 'mentor', 'foil', 'love-interest', 'comic-relief'
];

export const CharacterFilters: React.FC<CharacterFiltersProps> = ({
    filters,
    onFilterChange
}) => {
    const toggleRole = (role: CharacterRole) => {
        const currentRoles = filters.roles;
        const newRoles = currentRoles.includes(role)
            ? currentRoles.filter(r => r !== role)
            : [...currentRoles, role];
        onFilterChange({ roles: newRoles });
    };

    return (
        <Card className="mb-6">
            <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                    <Filter className="w-5 h-5" />
                    Filters & Search
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Search characters..."
                        value={filters.search}
                        onChange={(e) => onFilterChange({ search: e.target.value })}
                        className="pl-10 w-full px-3 py-2 border border-input rounded-md bg-background"
                    />
                </div>

                {/* Role Filters */}
                <div>
                    <label className="text-sm font-medium mb-2 block">Roles</label>
                    <div className="flex flex-wrap gap-2">
                        {ROLES.map(role => (
                            <motion.button
                                key={role}
                                onClick={() => toggleRole(role)}
                                className={cn(
                                    "px-3 py-1 text-xs rounded-full border transition-colors",
                                    filters.roles.includes(role)
                                        ? "bg-primary text-primary-foreground border-primary"
                                        : "bg-background border-border hover:bg-accent"
                                )}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                {role.replace('-', ' ')}
                            </motion.button>
                        ))}
                    </div>
                </div>

                {/* Validation Status Filter */}
                <div>
                    <label className="text-sm font-medium mb-2 block">Validation Status</label>
                    <div className="flex gap-2">
                        {(['all', 'valid', 'warnings', 'errors'] as const).map(status => (
                            <button
                                key={status}
                                onClick={() => onFilterChange({ validationStatus: status })}
                                className={cn(
                                    "px-3 py-1 text-xs rounded-md border transition-colors capitalize",
                                    filters.validationStatus === status
                                        ? "bg-secondary text-secondary-foreground border-secondary"
                                        : "bg-background border-border hover:bg-accent"
                                )}
                            >
                                {status}
                            </button>
                        ))}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};
