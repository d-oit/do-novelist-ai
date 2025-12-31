import { ChevronDown, Loader2, Sparkles, Wand2 } from 'lucide-react';
import React from 'react';

import { GENRES } from './project-wizard-constants';

interface BasicFieldsSectionProps {
  title: string;
  style: string;
  brainstorming: Record<string, boolean>;
  onTitleChange: (value: string) => void;
  onStyleChange: (value: string) => void;
  onBrainstormTitle: () => void;
  onBrainstormStyle: () => void;
}

export const BasicFieldsSection: React.FC<BasicFieldsSectionProps> = ({
  title,
  style,
  brainstorming,
  onTitleChange,
  onStyleChange,
  onBrainstormTitle,
  onBrainstormStyle,
}) => {
  return (
    <>
      {/* Title */}
      <div className='space-y-2'>
        <label className='flex items-center justify-between text-xs font-bold uppercase text-muted-foreground'>
          <span>2. Book Title</span>
          <button
            onClick={onBrainstormTitle}
            disabled={brainstorming.title}
            className='flex items-center gap-1.5 rounded border border-primary bg-primary px-2 py-1 text-[10px] text-primary-foreground transition-all hover:bg-primary/80 disabled:opacity-50'
            data-testid='wizard-brainstorm-title'
          >
            {brainstorming.title === true ? (
              <Loader2 className='h-3 w-3 animate-spin' />
            ) : (
              <Wand2 className='h-3 w-3' />
            )}
            Generate Title
          </button>
        </label>
        <input
          className='w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary'
          placeholder='e.g. The Last Kingdom'
          value={title}
          onChange={e => onTitleChange(e.target.value)}
          data-testid='wizard-title-input'
        />
      </div>

      {/* Genre/Style */}
      <div className='space-y-2'>
        <label className='flex items-center justify-between text-xs font-bold uppercase text-muted-foreground'>
          <span>3. Genre / Writing Style</span>
          <button
            onClick={onBrainstormStyle}
            disabled={brainstorming.style}
            className='flex items-center gap-1.5 rounded border border-primary bg-primary px-2 py-1 text-[10px] text-primary-foreground transition-all hover:bg-primary/80 disabled:opacity-50'
            data-testid='wizard-brainstorm-style'
          >
            {brainstorming.style === true ? (
              <Loader2 className='h-3 w-3 animate-spin' />
            ) : (
              <Sparkles className='h-3 w-3' />
            )}
            Suggest Style
          </button>
        </label>
        <div className='flex gap-2'>
          <input
            className='flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary'
            placeholder='e.g. Dark Fantasy with Mystery elements'
            value={style}
            onChange={e => onStyleChange(e.target.value)}
            data-testid='wizard-style-input'
          />
          <div className='relative shrink-0'>
            <select
              className='h-full w-28 cursor-pointer appearance-none rounded-md border border-border bg-secondary px-3 py-2 pr-8 text-sm outline-none hover:bg-secondary/80 focus:border-primary'
              onChange={e => {
                if (e.target.value) onStyleChange(e.target.value);
                e.target.value = '';
              }}
            >
              <option value=''>Genres</option>
              {GENRES.map(genre => (
                <option key={genre} value={genre}>
                  {genre}
                </option>
              ))}
            </select>
            <ChevronDown className='pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 opacity-50' />
          </div>
        </div>
      </div>
    </>
  );
};
