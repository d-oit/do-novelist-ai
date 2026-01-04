import React from 'react';

import { cn } from '@/lib/utils';
import type { HydratedSearchResult } from '@/types/embeddings';

import { SearchResultItem } from './SearchResultItem';

interface SearchResultsProps {
  results: HydratedSearchResult[];
  isLoading?: boolean;
  onSelect: (result: HydratedSearchResult) => void;
  className?: string;
}

export const SearchResults: React.FC<SearchResultsProps> = ({
  results,
  isLoading,
  onSelect,
  className,
}) => {
  if (isLoading) {
    return (
      <div className={cn('space-y-3 p-2', className)}>
        {[1, 2, 3].map(i => (
          <div key={i} className='flex animate-pulse gap-3 p-2'>
            <div className='h-8 w-8 rounded-full bg-secondary' />
            <div className='flex-1 space-y-2'>
              <div className='h-4 w-1/3 rounded bg-secondary' />
              <div className='h-3 w-3/4 rounded bg-secondary/70' />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className='flex flex-col items-center justify-center py-12 text-center text-muted-foreground'>
        <p>No results found matching your query.</p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-1', className)}>
      {results.map(result => (
        <SearchResultItem
          key={`${result.entityType}-${result.entityId}`}
          result={result}
          onClick={onSelect}
        />
      ))}
    </div>
  );
};
