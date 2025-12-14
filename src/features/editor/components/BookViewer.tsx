/**
 * Book Viewer - Refactored to use smaller components
 * Main container for chapter editing and project overview
 */

import React from 'react';

import ChapterEditor from '@/features/editor/components/ChapterEditor';
import ChapterList from '@/features/editor/components/ChapterList';
import ProjectOverview from '@/features/editor/components/ProjectOverview';
import type { Project, Chapter, RefineOptions } from '@/types';

interface BookViewerProps {
  project: Project;
  selectedChapterId: string | null;
  onSelectChapter: (id: string) => void;
  onUpdateChapter: (chapterId: string, updates: Partial<Chapter>) => void;
  onUpdateProject: (updates: Partial<Project>) => void;
  onAddChapter: () => void;
  onRefineChapter?: (chapterId: string, options: RefineOptions) => void;
  onContinueChapter?: (chapterId: string) => void;
}

const BookViewerRefactored: React.FC<BookViewerProps> = ({
  project,
  selectedChapterId,
  onSelectChapter,
  onUpdateChapter,
  onUpdateProject,
  onAddChapter,
  onRefineChapter,
  onContinueChapter,
}) => {
  return (
    <div className='flex h-full overflow-hidden rounded-lg border border-border/50 bg-background/50'>
      {/* Left Sidebar - Chapter List */}
      <div className='w-80 overflow-y-auto border-r border-border/50 bg-card/30 p-4'>
        <ChapterList
          project={project}
          selectedChapterId={selectedChapterId}
          onSelectChapter={onSelectChapter}
          onAddChapter={onAddChapter}
        />
      </div>

      {/* Main Content Area */}
      <div className='flex-1 overflow-y-auto'>
        <div className='mx-auto max-w-4xl p-6'>
          {selectedChapterId === 'overview' ? (
            <ProjectOverview project={project} onUpdateProject={onUpdateProject} />
          ) : (
            <ChapterEditor
              project={project}
              selectedChapterId={selectedChapterId}
              onUpdateChapter={onUpdateChapter}
              onRefineChapter={onRefineChapter}
              onContinueChapter={onContinueChapter}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default BookViewerRefactored;
