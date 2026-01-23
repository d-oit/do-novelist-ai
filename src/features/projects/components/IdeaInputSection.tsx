import { AlertCircle, Book, FileText, Loader2, Sparkles, Upload, X } from 'lucide-react';
import React from 'react';

import { cn } from '@/lib/utils';
import { FormField } from '@/shared/components/forms/FormField';

interface IdeaInputSectionProps {
  idea: string;
  activeTab: 'write' | 'upload';
  files: File[];
  isReading: boolean;
  brainstorming: Record<string, boolean>;
  brainstormError: string | null;
  tone: string;
  audience: string;
  onIdeaChange: (value: string) => void;
  onTabChange: (tab: 'write' | 'upload') => void;
  onBrainstorm: () => void;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveFile: (index: number) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  ideaTextareaRef: React.RefObject<HTMLTextAreaElement | null>;
}

export const IdeaInputSection: React.FC<IdeaInputSectionProps> = ({
  idea,
  activeTab,
  files,
  isReading,
  brainstorming,
  brainstormError,
  tone,
  audience,
  onIdeaChange,
  onTabChange,
  onBrainstorm,
  onFileChange,
  onRemoveFile,
  onKeyDown,
  fileInputRef,
  ideaTextareaRef,
}) => {
  return (
    <div className='space-y-2'>
      <label className='flex items-center justify-between text-xs font-bold uppercase text-muted-foreground'>
        <span>1. Core Idea / Source Material</span>
        <button
          onClick={onBrainstorm}
          disabled={(!idea && !tone && !audience) || brainstorming.idea}
          className='flex items-center gap-1.5 rounded border border-primary bg-primary px-2 py-1 text-[10px] text-primary-foreground transition-all hover:bg-primary/80 disabled:opacity-50'
          data-testid='wizard-brainstorm-idea'
        >
          {brainstorming.idea === true ? (
            <Loader2 className='h-3 w-3 animate-spin' />
          ) : (
            <Sparkles className='h-3 w-3' />
          )}
          Enhance Idea
        </button>
      </label>

      {brainstormError && (
        <div className='flex items-start gap-2 rounded-md bg-destructive/10 p-3 text-xs text-destructive'>
          <AlertCircle className='h-4 w-4 shrink-0' />
          <span>{brainstormError}</span>
        </div>
      )}

      <div className='overflow-hidden rounded-lg border border-border'>
        <div className='flex border-b border-border bg-secondary/20'>
          <button
            onClick={() => onTabChange('write')}
            className={cn(
              'flex flex-1 items-center justify-center gap-2 px-4 py-2 text-xs font-medium transition-colors',
              activeTab === 'write'
                ? 'border-r border-border bg-card text-primary'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <Book className='h-3 w-3' /> Write Idea
          </button>
          <button
            onClick={() => onTabChange('upload')}
            className={cn(
              'flex flex-1 items-center justify-center gap-2 px-4 py-2 text-xs font-medium transition-colors',
              activeTab === 'upload'
                ? 'border-l border-border bg-card text-primary'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <Upload className='h-3 w-3' /> Upload Files
          </button>
        </div>

        <div className='min-h-[200px] flex-1 bg-card p-4'>
          {activeTab === 'write' ? (
            <FormField
              id='wizard-idea-input'
              label='Core Idea'
              type='textarea'
              value={idea}
              onChange={onIdeaChange}
              onKeyDown={
                onKeyDown as (
                  e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>,
                ) => void
              }
              textareaRef={ideaTextareaRef}
              placeholder='Describe your plot, characters, and themes here...

Examples:
• A story about a detective who can see ghosts...
• In a world where dreams are currency...
• Two rival chefs fall in love during a cooking competition...'
              validationRules={[
                { type: 'required', message: 'Core idea is required' },
                { type: 'minLength', value: 10, message: 'Idea must be at least 10 characters' },
              ]}
              required
              validateOnBlur={true}
              textareaRows={8}
              className='h-full'
            />
          ) : (
            <div className='space-y-3'>
              <input
                type='file'
                ref={fileInputRef}
                onChange={onFileChange}
                multiple
                className='hidden'
                accept='.txt,.md,.json,text/*'
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isReading}
                className='flex w-full items-center justify-center gap-2 rounded-md border border-dashed border-border bg-secondary/20 px-4 py-8 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-foreground disabled:opacity-50'
              >
                {isReading ? (
                  <>
                    <Loader2 className='h-4 w-4 animate-spin' />
                    Reading files...
                  </>
                ) : (
                  <>
                    <Upload className='h-4 w-4' />
                    Click to upload files (TXT, MD, JSON)
                  </>
                )}
              </button>

              {files.length > 0 && (
                <div className='space-y-2'>
                  <p className='text-xs font-medium text-muted-foreground'>Uploaded Files:</p>
                  {files.map((file, idx) => (
                    <div
                      key={idx}
                      className='flex items-center justify-between rounded-md bg-secondary/50 px-3 py-2'
                    >
                      <div className='flex items-center gap-2'>
                        <FileText className='h-4 w-4 text-muted-foreground' />
                        <span className='text-xs'>{file.name}</span>
                      </div>
                      <button
                        onClick={() => onRemoveFile(idx)}
                        className='text-muted-foreground transition-colors hover:text-destructive'
                      >
                        <X className='h-3 w-3' />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
