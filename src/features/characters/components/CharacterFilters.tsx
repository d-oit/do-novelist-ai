
import { motion } from 'framer-motion';
import { Filter, Search } from 'lucide-react';
import type { FC } from 'react';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { cn } from '@/lib/utils';
import { type CharacterFilters as FilterType, type CharacterRole } from '@/types';

interface CharacterFiltersProps {
  filters: FilterType;
  onFilterChange: (filters: Partial<FilterType>) => void;
}

const ROLES: CharacterRole[] = [
  'protagonist',
  'antagonist',
  'supporting',
  'mentor',
  'foil',
  'love_interest',
  'sidekick',
  'deuteragonist',
  'tritagonist',
  'minor',
  'background',
];

export const CharacterFilters: FC<CharacterFiltersProps> = ({ filters, onFilterChange }) => {
  const toggleRole = (role: CharacterRole): void => {
    const currentRoles = filters.roles;
    const newRoles = currentRoles.includes(role)
      ? currentRoles.filter(r => r !== role)
      : [...currentRoles, role];
    onFilterChange({ roles: newRoles });
  };

  return (
    <Card className='mb-6'>
      <CardHeader className='pb-3'>
        <CardTitle className='flex items-center gap-2 text-lg'>
          <Filter className='h-5 w-5' />
          Filters & Search
        </CardTitle>
      </CardHeader>
      <CardContent className='space-y-4'>
        {/* Search */}
        <div className='relative'>
          <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-muted-foreground' />
          <input
            type='text'
            placeholder='Search characters...'
            value={filters.search}
            onChange={e => onFilterChange({ search: e.target.value })}
            className='w-full rounded-md border border-input bg-background px-3 py-2 pl-10'
          />
        </div>

        {/* Role Filters */}
        <div>
          <label className='mb-2 block text-sm font-medium'>Roles</label>
          <div className='flex flex-wrap gap-2'>
            {ROLES.map(role => (
              <motion.button
                key={role}
                onClick={() => toggleRole(role)}
                className={cn(
                  'rounded-full border px-3 py-1 text-xs transition-colors',
                  filters.roles.includes(role)
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-background hover:bg-accent',
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
          <label className='mb-2 block text-sm font-medium'>Validation Status</label>
          <div className='flex gap-2'>
            {(['all', 'valid', 'warnings', 'errors'] as const).map(status => (
              <button
                key={status}
                onClick={() => onFilterChange({ validationStatus: status })}
                className={cn(
                  'rounded-md border px-3 py-1 text-xs capitalize transition-colors',
                  filters.validationStatus === status
                    ? 'border-secondary bg-secondary text-secondary-foreground'
                    : 'border-border bg-background hover:bg-accent',
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
