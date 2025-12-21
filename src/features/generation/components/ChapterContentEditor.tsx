import { Type } from 'lucide-react';
import type { FC } from 'react';

import { cn } from '@/lib/utils';
import type { Chapter, Project, RefineOptions } from '@/types';

import { ChapterStatus } from '@shared/types';

import AIToolsPanel from './AIToolsPanel';

interface ChapterContentEditorProps {
  chapter: Chapter;
  project: Project;
  summary: string;
  content: string;
  hasUnsavedChanges: boolean;
  isFocusMode: boolean;
  refineSettings: RefineOptions;
  setRefineSettings: React.Dispatch<React.SetStateAction<RefineOptions>>;
  onSummaryChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onContentChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onUpdateChapter?: (chapterId: string, updates: Partial<Chapter>) => void;
  onRefineChapter?: (chapterId: string, options: RefineOptions, currentContent?: string) => void;
  onContinueChapter?: (chapterId: string) => void;
}

const getWordCount = (text: string): number =>
  text
    .trim()
    .split(/\s+/)
    .filter(w => w.length > 0).length;

export const ChapterContentEditor: FC<ChapterContentEditorProps> = ({
  chapter,
  project,
  summary,
  content,
  hasUnsavedChanges,
  isFocusMode,
  refineSettings,
  setRefineSettings,
  onSummaryChange,
  onContentChange,
  onUpdateChapter,
  onRefineChapter,
  onContinueChapter,
}) => {
  const currentWordCount = getWordCount(content);

  return (
    <div
      className={cn(
        'mx-auto flex min-h-full w-full flex-col p-6 transition-all duration-500 md:p-12',
        isFocusMode ? 'max-w-4xl pt-20' : 'max-w-3xl',
      )}
      data-testid='chapter-editor'
    >
      <div
        className={cn(
          'mb-6 flex flex-col gap-2',
          isFocusMode ? 'opacity-50 transition-opacity hover:opacity-100' : '',
        )}
      >
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground'>
            Chapter {chapter.orderIndex}
            {onUpdateChapter && (
              <div className='relative inline-block'>
                <select
                  value={chapter.status}
                  onChange={e =>
                    onUpdateChapter(chapter.id, {
                      status: e.target.value as ChapterStatus,
                    })
                  }
                  className={cn(
                    'cursor-pointer appearance-none rounded bg-transparent py-0.5 pl-2 pr-4 text-[10px] font-bold uppercase focus:outline-none',
                    chapter.status === ChapterStatus.COMPLETE
                      ? 'text-green-500'
                      : chapter.status === ChapterStatus.DRAFTING
                        ? 'text-blue-500'
                        : chapter.status === ChapterStatus.REVIEW
                          ? 'text-yellow-500'
                          : 'text-muted-foreground',
                  )}
                >
                  {Object.values(ChapterStatus).map(s => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className='flex items-center gap-3 text-xs text-muted-foreground'>
            <span className='flex items-center gap-1.5 rounded-md bg-secondary/50 px-2 py-0.5 font-mono'>
              <Type className='h-3 w-3' /> {currentWordCount} words
            </span>
            <div
              className='flex items-center gap-1.5'
              title={hasUnsavedChanges ? 'Unsaved changes' : 'All changes saved'}
              data-testid='save-status-indicator'
            >
              <div
                className={cn(
                  'h-1.5 w-1.5 rounded-full transition-colors',
                  hasUnsavedChanges ? 'animate-pulse bg-yellow-500' : 'bg-green-500/50',
                )}
              />
              <span className='hidden text-[10px] uppercase tracking-wider opacity-70 md:inline'>
                {hasUnsavedChanges ? 'Saving' : 'Saved'}
              </span>
            </div>
          </div>
        </div>
        <h2 className='border-b border-border pb-4 font-serif text-2xl font-bold text-foreground md:text-3xl'>
          {chapter.title}
        </h2>
      </div>

      <div className='flex flex-1 flex-col gap-6'>
        <div className={cn('group transition-all duration-500', isFocusMode ? 'hidden' : 'block')}>
          <label className='mb-2 block text-xs font-semibold uppercase tracking-wider text-muted-foreground opacity-70'>
            Summary / Goal
          </label>
          <textarea
            className='min-h-[80px] w-full resize-y rounded-md border border-border/50 bg-secondary/5 p-3 text-sm italic text-muted-foreground transition-colors focus:bg-background focus:text-foreground focus:outline-none focus:ring-1 focus:ring-primary'
            value={summary}
            onChange={onSummaryChange}
            data-testid='chapter-summary-input'
          />
        </div>

        {onRefineChapter && !isFocusMode && (
          <AIToolsPanel
            project={project}
            selectedChapterId={chapter.id}
            content={content}
            refineSettings={refineSettings}
            setRefineSettings={setRefineSettings}
            onRefineChapter={onRefineChapter}
            onContinueChapter={onContinueChapter}
          />
        )}

        <div className='relative flex flex-1 flex-col'>
          {!isFocusMode && (
            <label className='mb-2 block text-xs font-semibold uppercase tracking-wider text-muted-foreground opacity-70'>
              Chapter Content
            </label>
          )}
          <textarea
            className={cn(
              'w-full flex-1 resize-y rounded-md bg-transparent p-4 font-serif text-lg leading-relaxed text-foreground transition-all focus:outline-none',
              isFocusMode
                ? 'min-h-[80vh] border-none text-xl shadow-none ring-0'
                : 'min-h-[400px] border border-border/50 shadow-inner hover:border-border focus:border-primary/50 focus:ring-1 focus:ring-primary/20',
            )}
            value={content}
            onChange={onContentChange}
            placeholder='Start writing or wait for the AI...'
            data-testid='chapter-content-input'
          />
        </div>
      </div>
    </div>
  );
};

export default ChapterContentEditor;
