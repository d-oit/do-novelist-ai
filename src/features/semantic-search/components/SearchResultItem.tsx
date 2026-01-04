import { FileText, User, Globe, Folder, ArrowRight } from 'lucide-react';
import React from 'react';

import { cn } from '@/lib/utils';
import type { HydratedSearchResult, VectorEntityType } from '@/types/embeddings';

interface SearchResultItemProps {
  result: HydratedSearchResult;
  onClick: (result: HydratedSearchResult) => void;
  className?: string;
}

const getIcon = (type: VectorEntityType) => {
  switch (type) {
    case 'character':
      return <User className='h-4 w-4' />;
    case 'chapter':
      return <FileText className='h-4 w-4' />;
    case 'world_building':
      return <Globe className='h-4 w-4' />;
    case 'project':
      return <Folder className='h-4 w-4' />;
    default:
      return <FileText className='h-4 w-4' />;
  }
};

const getTypeLabel = (type: VectorEntityType) => {
  switch (type) {
    case 'world_building':
      return 'World Building';
    default:
      return type.charAt(0).toUpperCase() + type.slice(1);
  }
};

interface SearchEntity {
  title?: string;
  name?: string;
  summary?: string;
  description?: string;
  content?: string;
}

export const SearchResultItem: React.FC<SearchResultItemProps> = ({
  result,
  onClick,
  className,
}) => {
  const entity = result.entity as SearchEntity;
  const entityType = result.entityType as VectorEntityType;

  return (
    <div
      onClick={() => onClick(result)}
      className={cn(
        'group flex cursor-pointer items-start gap-3 rounded-lg border border-transparent p-3 transition-colors hover:border-border hover:bg-accent/50',
        className,
      )}
    >
      <div className='mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary'>
        {getIcon(entityType)}
      </div>

      <div className='flex-1 overflow-hidden'>
        <div className='flex items-center gap-2'>
          <span className='text-xs font-medium text-muted-foreground'>
            {getTypeLabel(entityType)}
          </span>
          <span className='text-xs text-muted-foreground/50'>•</span>
          <span className='text-xs text-muted-foreground/50'>
            {Math.round(result.similarity * 100)}% match
          </span>
        </div>

        <h4 className='truncate font-medium text-foreground'>
          {entity.title || entity.name || 'Untitled'}
        </h4>

        <p className='line-clamp-2 text-sm text-muted-foreground'>
          {/* Try to extract some meaningful text preview */}
          {entity.summary ||
            entity.description ||
            entity.content?.substring(0, 150) ||
            result.content.substring(0, 150)}
        </p>
      </div>

      <ArrowRight className='mt-2 h-4 w-4 opacity-0 transition-opacity group-hover:opacity-50' />
    </div>
  );
};
