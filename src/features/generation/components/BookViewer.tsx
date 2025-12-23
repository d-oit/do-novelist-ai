/**
 * BookViewer - Refactored with sub-components
 * Main container for chapter editing and project management
 */
import { BookOpen, Menu, X, Maximize2, Minimize2 } from 'lucide-react';
import type { FC } from 'react';
import { useState, useEffect, useRef } from 'react';

import PublishPanel from '@/features/publishing/components/PublishPanel';
import { cn } from '@/lib/utils';
import { type RefineOptions } from '@/types';

import type { Project, Chapter } from '@shared/types';

import ChapterContentEditor from './ChapterContentEditor';
import ChapterSidebar from './ChapterSidebar';
import ProjectOverviewPanel from './ProjectOverviewPanel';

interface BookViewerProps {
  project: Project;
  selectedChapterId: string | null;
  onSelectChapter: (id: string) => void;
  onRefineChapter?: (chapterId: string, options: RefineOptions, currentContent?: string) => void;
  onUpdateChapter?: (chapterId: string, updates: Partial<Chapter>) => void;
  onUpdateProject?: (updates: Partial<Project>) => void;
  onAddChapter?: () => void;
  onContinueChapter?: (chapterId: string) => void;
}

const getWordCount = (text: string): number =>
  text
    .trim()
    .split(/\s+/)
    .filter(w => w.length > 0).length;

const BookViewer: FC<BookViewerProps> = ({
  project,
  selectedChapterId,
  onSelectChapter,
  onRefineChapter,
  onUpdateChapter,
  onUpdateProject,
  onAddChapter,
  onContinueChapter,
}) => {
  const selectedChapter = project.chapters.find(c => c.id === selectedChapterId);
  const [refineSettings, setRefineSettings] = useState<RefineOptions>({
    model: 'gemini-2.5-flash',
    temperature: 0.7,
    maxTokens: 2000,
    topP: 0.95,
    focusAreas: ['grammar', 'style'],
    preserveLength: false,
  });

  const [summary, setSummary] = useState('');
  const [content, setContent] = useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isFocusMode, setIsFocusMode] = useState(false);

  const lastSavedSummary = useRef('');
  const lastSavedContent = useRef('');
  const currentSummaryRef = useRef('');
  const currentContentRef = useRef('');
  const currentChapterIdRef = useRef(selectedChapterId);

  // Keep refs in sync
  useEffect(() => {
    currentSummaryRef.current = summary;
  }, [summary]);
  useEffect(() => {
    currentContentRef.current = content;
  }, [content]);
  useEffect(() => {
    currentChapterIdRef.current = selectedChapterId;
  }, [selectedChapterId]);

  // Load chapter data when selection changes
  useEffect(() => {
    if (selectedChapter) {
      setSummary(selectedChapter.summary ?? '');
      setContent(selectedChapter.content ?? '');
      lastSavedSummary.current = selectedChapter.summary ?? '';
      lastSavedContent.current = selectedChapter.content ?? '';
      setHasUnsavedChanges(false);
    } else {
      setSummary('');
      setContent('');
    }
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  }, [selectedChapter?.id, selectedChapter?.summary, selectedChapter?.content, selectedChapter]);

  // Sync with external updates (e.g., AI generation)
  useEffect(() => {
    if (selectedChapter) {
      if (
        selectedChapter.summary !== lastSavedSummary.current &&
        selectedChapter.summary !== summary
      ) {
        setSummary(selectedChapter.summary ?? '');
        lastSavedSummary.current = selectedChapter.summary ?? '';
      }
      if (
        selectedChapter.content !== lastSavedContent.current &&
        selectedChapter.content !== content
      ) {
        setContent(selectedChapter.content ?? '');
        lastSavedContent.current = selectedChapter.content ?? '';
      }
    }
  }, [selectedChapter?.summary, selectedChapter?.content, selectedChapter, summary, content]);

  // Auto-save with debounce
  useEffect((): (() => void) => {
    if (
      selectedChapterId == null ||
      onUpdateChapter == null ||
      selectedChapterId === 'overview' ||
      selectedChapterId === 'publish'
    )
      return () => {};
    const timer = setTimeout((): void => {
      const needsSaveSummary = summary !== lastSavedSummary.current;
      const needsSaveContent = content !== lastSavedContent.current;
      if (needsSaveSummary || needsSaveContent) {
        onUpdateChapter(selectedChapterId, { summary, content });
        if (needsSaveSummary) lastSavedSummary.current = summary;
        if (needsSaveContent) lastSavedContent.current = content;
        setHasUnsavedChanges(false);
      }
    }, 3000);
    return () => clearTimeout(timer);
  }, [summary, content, selectedChapterId, onUpdateChapter]);

  // Save on unmount
  useEffect((): (() => void) => {
    return () => {
      const chapterId = currentChapterIdRef.current;
      if (
        chapterId == null ||
        onUpdateChapter == null ||
        chapterId === 'overview' ||
        chapterId === 'publish'
      )
        return;
      const finalSummary = currentSummaryRef.current;
      const finalContent = currentContentRef.current;
      if (finalSummary !== lastSavedSummary.current || finalContent !== lastSavedContent.current) {
        onUpdateChapter(chapterId, { summary: finalSummary, content: finalContent });
      }
    };
  }, [selectedChapterId, onUpdateChapter]);

  const handleSummaryChange = (e: React.ChangeEvent<HTMLTextAreaElement>): void => {
    setSummary(e.target.value);
    setHasUnsavedChanges(true);
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>): void => {
    setContent(e.target.value);
    setHasUnsavedChanges(true);
  };

  const currentWordCount = getWordCount(content);

  return (
    <div
      className={cn(
        'relative flex h-full flex-col overflow-hidden rounded-lg border border-border bg-card transition-all duration-500 md:flex-row',
        isFocusMode ? 'fixed inset-0 z-50 m-0 rounded-none border-none' : '',
      )}
    >
      {/* Mobile Header */}
      <div
        className={cn(
          'flex items-center justify-between border-b border-border bg-secondary/10 p-4 md:hidden',
          isFocusMode ? 'hidden' : '',
        )}
      >
        <div className='flex items-center gap-2 text-sm font-semibold'>
          <BookOpen className='h-4 w-4 text-primary' />
          <span>
            {selectedChapterId === 'overview'
              ? 'Project Overview'
              : selectedChapterId === 'publish'
                ? 'Publish & Export'
                : selectedChapter
                  ? `Ch. ${selectedChapter.orderIndex}`
                  : 'Select Chapter'}
          </span>
        </div>
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className='p-1 text-muted-foreground hover:text-foreground'
        >
          {isSidebarOpen ? <X className='h-5 w-5' /> : <Menu className='h-5 w-5' />}
        </button>
      </div>

      {/* Sidebar */}
      <ChapterSidebar
        project={project}
        selectedChapterId={selectedChapterId}
        onSelectChapter={onSelectChapter}
        onAddChapter={onAddChapter}
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
        isFocusMode={isFocusMode}
      />

      {/* Content Area */}
      <div className='custom-scrollbar relative flex h-[calc(100vh-10rem)] flex-1 flex-col overflow-y-auto bg-background md:h-auto'>
        {/* Focus Mode Toggle */}
        <div className='absolute right-6 top-4 z-30 flex gap-2'>
          {isFocusMode && (
            <div className='animate-in fade-in rounded-full border border-border bg-secondary/80 px-3 py-1 font-mono text-xs text-muted-foreground backdrop-blur'>
              {currentWordCount} words
            </div>
          )}
          <button
            onClick={() => setIsFocusMode(!isFocusMode)}
            className='rounded-full border border-border bg-card/50 p-2 text-muted-foreground shadow-sm backdrop-blur transition-all hover:bg-card hover:text-foreground'
            title={isFocusMode ? 'Exit Focus Mode' : 'Enter Focus Mode'}
          >
            {isFocusMode ? <Minimize2 className='h-4 w-4' /> : <Maximize2 className='h-4 w-4' />}
          </button>
        </div>

        {/* View Routing */}
        {selectedChapterId === 'overview' && onUpdateProject != null ? (
          <ProjectOverviewPanel project={project} onUpdateProject={onUpdateProject} />
        ) : selectedChapterId === 'publish' && onUpdateProject && onUpdateChapter ? (
          <PublishPanel
            project={project}
            onUpdateProject={onUpdateProject}
            onUpdateChapter={onUpdateChapter}
          />
        ) : selectedChapter ? (
          <ChapterContentEditor
            chapter={selectedChapter}
            project={project}
            summary={summary}
            content={content}
            hasUnsavedChanges={hasUnsavedChanges}
            isFocusMode={isFocusMode}
            refineSettings={refineSettings}
            setRefineSettings={setRefineSettings}
            onSummaryChange={handleSummaryChange}
            onContentChange={handleContentChange}
            onUpdateChapter={onUpdateChapter}
            onRefineChapter={onRefineChapter}
            onContinueChapter={onContinueChapter}
          />
        ) : (
          <div className='flex h-full min-h-[300px] items-center justify-center text-muted-foreground'>
            <div className='text-center'>
              <BookOpen className='mx-auto mb-4 h-12 w-12 opacity-20' />
              <p>Select a chapter or Project Overview.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookViewer;
