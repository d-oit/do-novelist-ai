import { ChevronDown, Loader2, Sparkles, Wand2 } from 'lucide-react';
import React from 'react';

import { FormField } from '@/shared/components/forms/FormField';

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
        <FormField
          id='wizard-title-input'
          label='Book Title'
          type='text'
          value={title}
          onChange={onTitleChange}
          placeholder='e.g. The Last Kingdom'
          validationRules={[
            { type: 'required', message: 'Book title is required' },
            { type: 'minLength', value: 2, message: 'Title must be at least 2 characters' },
            { type: 'maxLength', value: 100, message: 'Title must be less than 100 characters' },
          ]}
          required
          validateOnBlur={true}
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
          <FormField
            id='wizard-style-input'
            label='Genre / Writing Style'
            type='text'
            value={style}
            onChange={onStyleChange}
            placeholder='e.g. Dark Fantasy with Mystery elements'
            validationRules={[
              { type: 'required', message: 'Genre is required' },
              { type: 'minLength', value: 2, message: 'Genre must be at least 2 characters' },
            ]}
            required
            validateOnBlur={true}
            className='flex-1'
          />
          <div className='relative shrink-0 self-start pt-6'>
            <select
              className='h-full w-28 cursor-pointer appearance-none rounded-md border border-border bg-secondary px-3 py-2 pr-8 text-sm outline-none hover:bg-secondary/80 focus:border-primary'
              onChange={e => {
                if (e.target.value) onStyleChange(e.target.value);
                e.target.value = '';
              }}
              aria-label='Select genre'
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
