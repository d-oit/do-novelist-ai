/**
 * Chapter List Component - Extracted from BookViewer
 * Handles chapter navigation and overview display
 */

import { motion } from 'framer-motion';
import { Plus, FileText, Eye } from 'lucide-react';
import React, { useCallback, useMemo } from 'react';

import { Button } from '../../../components/ui/Button';
import { cn } from '../../../lib/utils';
import { Project, Chapter } from '../../../types';
import { ChapterStatus } from '../../../shared/types';

interface ChapterListProps {
  project: Project;
  selectedChapterId: string | null;
  onSelectChapter: (id: string) => void;
  onAddChapter: () => void;
  className?: string;
}

const ChapterList = React.memo<ChapterListProps>(
  ({ project, selectedChapterId, onSelectChapter, onAddChapter, className }) => {
    const getStatusColor = useCallback((status: Chapter['status']): string => {
      switch (status) {
        case ChapterStatus.COMPLETE:
          return 'bg-green-500/20 text-green-400 ring-green-500/30';
        case ChapterStatus.DRAFTING:
          return 'bg-blue-500/20 text-blue-400 ring-blue-500/30';
        case ChapterStatus.REVIEW:
          return 'bg-yellow-500/20 text-yellow-400 ring-yellow-500/30';
        default:
          return 'bg-slate-500/20 text-slate-400 ring-slate-500/30';
      }
    }, []);

    const getStatusText = useCallback((status: Chapter['status']): string => {
      switch (status) {
        case ChapterStatus.PENDING:
          return 'Pending';
        case ChapterStatus.DRAFTING:
          return 'Drafting';
        case ChapterStatus.REVIEW:
          return 'Review';
        case ChapterStatus.COMPLETE:
          return 'Complete';
        default:
          return 'Unknown';
      }
    }, []);

    const sortedChapters = useMemo(() => {
      return [...project.chapters].sort((a, b) => a.orderIndex - b.orderIndex);
    }, [project.chapters]);

    const handleSelectOverview = useCallback(() => {
      onSelectChapter('overview');
    }, [onSelectChapter]);

    const handleSelectChapter = useCallback(
      (id: string) => {
        onSelectChapter(id);
      },
      [onSelectChapter],
    );

    const handleAddChapter = useCallback(() => {
      onAddChapter();
    }, [onAddChapter]);

    return (
      <div className={cn('space-y-3', className)}>
        <div className='flex items-center justify-between'>
          <h3 className='text-sm font-semibold text-foreground'>Chapters</h3>
          <Button
            onClick={handleAddChapter}
            size='sm'
            variant='outline'
            className='h-7 gap-1.5 text-xs'
          >
            <Plus className='h-3 w-3' />
            Add Chapter
          </Button>
        </div>

        <div className='max-h-[400px] space-y-2 overflow-y-auto'>
          {/* Overview Item */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSelectOverview}
            className={cn(
              'w-full rounded-lg p-3 text-left transition-all',
              'border border-border/50 hover:border-primary/50',
              selectedChapterId === 'overview'
                ? 'border-primary bg-primary/10 shadow-md shadow-primary/10'
                : 'bg-card/50 hover:bg-card',
            )}
          >
            <div className='flex items-center gap-3'>
              <div className='flex h-8 w-8 items-center justify-center rounded-lg bg-primary/20'>
                <Eye className='h-4 w-4 text-primary' />
              </div>
              <div className='min-w-0 flex-1'>
                <div className='flex items-center gap-2'>
                  <span className='text-sm font-medium text-foreground'>Project Overview</span>
                </div>
                <p className='mt-0.5 text-xs text-muted-foreground'>Project details and settings</p>
              </div>
            </div>
          </motion.button>

          {/* Chapter Items */}
          {sortedChapters.map((chapter, index) => (
            <motion.button
              key={chapter.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleSelectChapter(chapter.id)}
              className={cn(
                'w-full rounded-lg p-3 text-left transition-all',
                'border border-border/50 hover:border-primary/50',
                selectedChapterId === chapter.id
                  ? 'border-primary bg-primary/10 shadow-md shadow-primary/10'
                  : 'bg-card/50 hover:bg-card',
              )}
            >
              <div className='flex items-center gap-3'>
                <div className='flex h-8 w-8 items-center justify-center rounded-lg bg-card'>
                  <FileText className='h-4 w-4 text-muted-foreground' />
                </div>
                <div className='min-w-0 flex-1'>
                  <div className='flex items-center gap-2'>
                    <span className='text-sm font-medium text-foreground'>
                      {index + 1}. {chapter.title ?? 'Untitled Chapter'}
                    </span>
                    <span
                      className={cn(
                        'rounded px-1.5 py-0.5 text-xs font-medium ring-1',
                        getStatusColor(chapter.status),
                      )}
                    >
                      {getStatusText(chapter.status)}
                    </span>
                  </div>
                  <p className='mt-0.5 truncate text-xs text-muted-foreground'>
                    {(chapter.summary ?? chapter.content)
                      ? (chapter.summary ?? chapter.content.substring(0, 60) + '...')
                      : 'No content yet'}
                  </p>
                  <div className='mt-1 flex items-center gap-2'>
                    <span className='text-xs text-muted-foreground'>
                      {chapter.wordCount ?? 0} words
                    </span>
                  </div>
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    );
  },
);

ChapterList.displayName = 'ChapterList';

export default ChapterList;
export { ChapterList };
