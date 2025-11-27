/**
 * Book Viewer - Refactored to use smaller components
 * Main container for chapter editing and project overview
 */

import React from 'react';
import { Project, Chapter } from '../../../types';
import ChapterList from './ChapterList';
import ChapterEditor from './ChapterEditor';
import ProjectOverview from './ProjectOverview';

interface BookViewerProps {
  project: Project;
  selectedChapterId: string | null;
  onSelectChapter: (id: string) => void;
  onUpdateChapter: (chapterId: string, updates: Partial<Chapter>) => void;
  onUpdateProject: (updates: Partial<Project>) => void;
  onAddChapter: () => void;
  onRefineChapter?: (chapterId: string, options: any) => void;
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
  onContinueChapter
}) => {
  return (
    <div className="h-full flex bg-background/50 rounded-lg border border-border/50 overflow-hidden">
      {/* Left Sidebar - Chapter List */}
      <div className="w-80 border-r border-border/50 bg-card/30 p-4 overflow-y-auto">
        <ChapterList
          project={project}
          selectedChapterId={selectedChapterId}
          onSelectChapter={onSelectChapter}
          onAddChapter={onAddChapter}
        />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 max-w-4xl mx-auto">
          {selectedChapterId === 'overview' ? (
            <ProjectOverview
              project={project}
              onUpdateProject={onUpdateProject}
            />
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