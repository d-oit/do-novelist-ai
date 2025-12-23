import { Wand2, Loader2, Sparkles } from 'lucide-react';
import type { FC } from 'react';

import type { Project, RefineOptions } from '@/types';

interface AIToolsPanelProps {
  project: Project;
  selectedChapterId: string;
  content: string;
  refineSettings: RefineOptions;
  setRefineSettings: React.Dispatch<React.SetStateAction<RefineOptions>>;
  onRefineChapter: (chapterId: string, options: RefineOptions, currentContent?: string) => void;
  onContinueChapter?: (chapterId: string) => void;
}

export const AIToolsPanel: FC<AIToolsPanelProps> = ({
  project,
  selectedChapterId,
  content,
  refineSettings,
  setRefineSettings,
  onRefineChapter,
  onContinueChapter,
}) => {
  return (
    <div className='rounded-lg border border-border/40 bg-secondary/5 p-4'>
      <div className='mb-4 flex items-center gap-2'>
        <Wand2 className='h-4 w-4 text-primary' />
        <h4 className='text-sm font-semibold text-foreground'>AI Tools</h4>
      </div>
      <div className='flex flex-col items-end gap-4 xl:flex-row'>
        <div className='grid w-full flex-1 grid-cols-1 gap-4 md:grid-cols-2'>
          <div className='space-y-1'>
            <label className='text-[10px] font-bold uppercase text-muted-foreground'>Model</label>
            <select
              className='w-full rounded border border-border bg-background px-3 py-2 text-xs focus:border-primary focus:outline-none'
              value={refineSettings.model}
              onChange={e =>
                setRefineSettings(prev => ({
                  ...prev,
                  model: e.target.value as RefineOptions['model'],
                }))
              }
              disabled={project.isGenerating}
            >
              <option value='gemini-2.5-flash'>Flash 2.5 (Fast)</option>
              <option value='gemini-3-pro-preview'>Pro 3.0 (Quality)</option>
            </select>
          </div>
          <div className='space-y-1.5'>
            <label className='text-[10px] font-bold uppercase text-muted-foreground'>
              Temp: {refineSettings.temperature}
            </label>
            <input
              type='range'
              min='0'
              max='1'
              step='0.1'
              value={refineSettings.temperature}
              onChange={e =>
                setRefineSettings(prev => ({
                  ...prev,
                  temperature: parseFloat(e.target.value),
                }))
              }
              className='h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-secondary [&::-webkit-slider-thumb]:bg-primary'
              disabled={project.isGenerating}
            />
            <div className='flex justify-between px-0.5 text-[9px] text-muted-foreground'>
              <span>Focused</span>
              <span>Creative</span>
            </div>
          </div>
        </div>

        <div className='flex w-full gap-2 xl:w-auto'>
          {/* Refine Button */}
          <button
            onClick={() => onRefineChapter(selectedChapterId, refineSettings, content)}
            disabled={project.isGenerating || !content}
            className='flex h-[34px] flex-1 items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-all hover:bg-primary/90 disabled:opacity-50 xl:flex-none'
            data-testid='refine-chapter-btn'
          >
            {project.isGenerating ? (
              <Loader2 className='h-4 w-4 animate-spin' />
            ) : (
              <Wand2 className='h-4 w-4' />
            )}{' '}
            Refine
          </button>

          {/* Continue Button */}
          {onContinueChapter && (
            <button
              onClick={() => onContinueChapter(selectedChapterId)}
              disabled={project.isGenerating}
              className='flex h-[34px] flex-1 items-center justify-center gap-2 rounded-md border border-border bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground shadow-sm transition-all hover:bg-secondary/80 disabled:opacity-50 xl:flex-none'
              data-testid='continue-chapter-btn'
              title='Continue writing from current content'
            >
              {project.isGenerating ? (
                <Loader2 className='h-4 w-4 animate-spin' />
              ) : (
                <Sparkles className='h-4 w-4 text-primary' />
              )}{' '}
              Continue
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIToolsPanel;
