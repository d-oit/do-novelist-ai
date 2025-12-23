import {
  BookOpen,
  CheckCircle2,
  Clock,
  Edit3,
  RefreshCw,
  AlignLeft,
  UploadCloud,
  Plus,
} from 'lucide-react';
import type { FC } from 'react';

import { cn } from '@/lib/utils';

import type { Project, Chapter } from '@shared/types';
import { ChapterStatus } from '@shared/types';

interface ChapterSidebarProps {
  project: Project;
  selectedChapterId: string | null;
  onSelectChapter: (id: string) => void;
  onAddChapter?: () => void;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
  isFocusMode: boolean;
}

const getWordCount = (text: string): number =>
  text
    .trim()
    .split(/\s+/)
    .filter(w => w.length > 0).length;

const getStatusIcon = (status: ChapterStatus): React.ReactElement => {
  switch (status) {
    case ChapterStatus.COMPLETE:
      return <CheckCircle2 className='h-3 w-3 text-green-500' />;
    case ChapterStatus.DRAFTING:
      return <Edit3 className='h-3 w-3 text-blue-500' />;
    case ChapterStatus.REVIEW:
      return <RefreshCw className='h-3 w-3 text-yellow-500' />;
    default:
      return <Clock className='h-3 w-3 text-muted-foreground' />;
  }
};

export const ChapterSidebar: FC<ChapterSidebarProps> = ({
  project,
  selectedChapterId,
  onSelectChapter,
  onAddChapter,
  isSidebarOpen,
  setIsSidebarOpen,
  isFocusMode,
}) => {
  return (
    <>
      {/* Sidebar */}
      <div
        className={cn(
          'absolute inset-y-0 left-0 z-20 flex w-64 flex-col border-r border-border bg-card shadow-2xl transition-all duration-300 ease-in-out md:relative md:bg-secondary/10 md:shadow-none',
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
          isFocusMode ? 'md:w-0 md:-translate-x-full md:border-none' : '',
        )}
        data-testid='chapter-sidebar'
      >
        <div className='hidden border-b border-border bg-secondary/10 p-4 md:block'>
          <h3 className='flex items-center gap-2 text-sm font-semibold text-foreground'>
            <BookOpen className='h-4 w-4 text-primary' />
            Structure
          </h3>
        </div>
        <div className='custom-scrollbar flex flex-1 flex-col space-y-1 overflow-y-auto p-2'>
          {/* Management Section */}
          <div className='mb-2 shrink-0 space-y-1'>
            <button
              onClick={() => onSelectChapter('overview')}
              className={cn(
                'flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-xs font-bold uppercase tracking-wider transition-colors',
                selectedChapterId === 'overview'
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
              )}
              data-testid='chapter-item-overview'
            >
              <AlignLeft className='h-3 w-3 shrink-0' /> Project Overview
            </button>
            <button
              onClick={() => onSelectChapter('publish')}
              className={cn(
                'flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-xs font-bold uppercase tracking-wider transition-colors',
                selectedChapterId === 'publish'
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
              )}
              data-testid='chapter-item-publish'
            >
              <UploadCloud className='h-3 w-3 shrink-0' /> Publish & Export
            </button>
          </div>

          <div className='mx-1 my-2 h-px shrink-0 bg-border/50' />

          {/* Chapters List */}
          <div className='flex-1 space-y-1 overflow-y-auto'>
            {project.chapters.length === 0 && (
              <div className='p-4 text-center text-xs italic text-muted-foreground opacity-70'>
                Waiting for Outline...
              </div>
            )}
            {project.chapters.map((chapter: Chapter) => (
              <button
                key={chapter.id}
                onClick={() => onSelectChapter(chapter.id)}
                className={cn(
                  'flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-xs transition-colors',
                  selectedChapterId === chapter.id
                    ? 'bg-primary/10 font-medium text-primary'
                    : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
                )}
                data-testid={`chapter-item-order-${chapter.orderIndex}`}
              >
                {getStatusIcon(chapter.status)}
                <span className='flex-1 truncate'>
                  {chapter.orderIndex}. {chapter.title}
                </span>
                <span className='text-[9px] text-muted-foreground opacity-60'>
                  {getWordCount(chapter.content)}w
                </span>
              </button>
            ))}
          </div>

          {/* Add Chapter Button */}
          {onAddChapter && (
            <div className='mt-2 shrink-0 border-t border-border/50 pt-2'>
              <button
                onClick={onAddChapter}
                className='flex w-full items-center justify-center gap-2 rounded-md border border-dashed border-border px-3 py-2 text-xs font-medium text-muted-foreground transition-all hover:border-primary/50 hover:bg-secondary/50 hover:text-primary'
                title='Manually add a new empty chapter'
                data-testid='add-chapter-btn'
              >
                <Plus className='h-3 w-3' /> Add Chapter
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Overlay for Mobile Sidebar */}
      {isSidebarOpen && (
        <div
          className='fixed inset-0 z-10 bg-black/50 md:hidden'
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </>
  );
};

export default ChapterSidebar;
