import { Project, Chapter, ChapterStatus } from '@shared/types';
import {
  BookOpen,
  CheckCircle2,
  Wand2,
  Loader2,
  Menu,
  X,
  Maximize2,
  Minimize2,
  AlignLeft,
  Type,
  UploadCloud,
  RefreshCw,
  Clock,
  Edit3,
  Plus,
  Sparkles,
} from 'lucide-react';
import React, { useState, useEffect, useRef } from 'react';

import CoverGenerator from '../../publishing/components/CoverGenerator';
import PublishPanel from '../../publishing/components/PublishPanel';

import { type RefineOptions } from '@/types';

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

const BookViewer: React.FC<BookViewerProps> = ({
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

  useEffect(() => {
    currentSummaryRef.current = summary;
  }, [summary]);
  useEffect(() => {
    currentContentRef.current = content;
  }, [content]);
  useEffect(() => {
    currentChapterIdRef.current = selectedChapterId;
  }, [selectedChapterId]);

  useEffect(() => {
    if (selectedChapter) {
      setSummary(selectedChapter.summary || '');
      setContent(selectedChapter.content || '');
      lastSavedSummary.current = selectedChapter.summary || '';
      lastSavedContent.current = selectedChapter.content || '';
      setHasUnsavedChanges(false);
    } else {
      setSummary('');
      setContent('');
    }
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  }, [selectedChapter?.id]);

  // Only update from props if the change didn't originate from local edit (avoid cursor jumping/overwrite)
  // But we do need to catch AI generation updates.
  useEffect(() => {
    if (selectedChapter) {
      if (
        selectedChapter.summary !== lastSavedSummary.current &&
        selectedChapter.summary !== summary
      ) {
        setSummary(selectedChapter.summary || '');
        lastSavedSummary.current = selectedChapter.summary || '';
      }
      if (
        selectedChapter.content !== lastSavedContent.current &&
        selectedChapter.content !== content
      ) {
        setContent(selectedChapter.content || '');
        lastSavedContent.current = selectedChapter.content || '';
      }
    }
  }, [selectedChapter?.summary, selectedChapter?.content]);

  useEffect(() => {
    if (
      !selectedChapterId ||
      !onUpdateChapter ||
      selectedChapterId === 'overview' ||
      selectedChapterId === 'publish'
    )
      return;
    const timer = setTimeout(() => {
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

  useEffect(() => {
    return () => {
      const chapterId = currentChapterIdRef.current;
      if (!chapterId || !onUpdateChapter || chapterId === 'overview' || chapterId === 'publish')
        return;
      const finalSummary = currentSummaryRef.current;
      const finalContent = currentContentRef.current;
      // Force save on unmount/change
      if (finalSummary !== lastSavedSummary.current || finalContent !== lastSavedContent.current) {
        onUpdateChapter(chapterId, { summary: finalSummary, content: finalContent });
      }
    };
  }, [selectedChapterId]);

  const handleSummaryChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setSummary(e.target.value);
    setHasUnsavedChanges(true);
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    setHasUnsavedChanges(true);
  };

  const getWordCount = (text: string) =>
    text
      .trim()
      .split(/\s+/)
      .filter(w => w.length > 0).length;
  const currentWordCount = getWordCount(content);

  const getStatusIcon = (status: ChapterStatus) => {
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

  return (
    <div
      className={`relative flex h-full flex-col overflow-hidden rounded-lg border border-border bg-card transition-all duration-500 md:flex-row ${isFocusMode ? 'fixed inset-0 z-50 m-0 rounded-none border-none' : ''}`}
    >
      {/* Mobile Header */}
      <div
        className={`flex items-center justify-between border-b border-border bg-secondary/10 p-4 md:hidden ${isFocusMode ? 'hidden' : ''}`}
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
      <div
        className={`absolute inset-y-0 left-0 z-20 flex w-64 flex-col border-r border-border bg-card shadow-2xl transition-all duration-300 ease-in-out md:relative md:bg-secondary/10 md:shadow-none ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'} ${isFocusMode ? 'md:w-0 md:-translate-x-full md:border-none' : ''} `}
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
              className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-xs font-bold uppercase tracking-wider transition-colors ${selectedChapterId === 'overview' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-secondary hover:text-foreground'}`}
              data-testid='chapter-item-overview'
            >
              <AlignLeft className='h-3 w-3 shrink-0' /> Project Overview
            </button>
            <button
              onClick={() => onSelectChapter('publish')}
              className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-xs font-bold uppercase tracking-wider transition-colors ${selectedChapterId === 'publish' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-secondary hover:text-foreground'}`}
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
            {project.chapters.map(chapter => (
              <button
                key={chapter.id}
                onClick={() => onSelectChapter(chapter.id)}
                className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-xs transition-colors ${selectedChapterId === chapter.id ? 'bg-primary/10 font-medium text-primary' : 'text-muted-foreground hover:bg-secondary hover:text-foreground'}`}
                data-testid={`chapter-item-${chapter.id}`}
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

      {/* Content Area */}
      <div className='custom-scrollbar relative flex h-[calc(100vh-10rem)] flex-1 flex-col overflow-y-auto bg-background md:h-auto'>
        {/* Focus Mode Toggle (Absolute) */}
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
        {selectedChapterId === 'overview' && onUpdateProject ? (
          <div
            className='mx-auto min-h-full w-full max-w-3xl p-6 md:p-8'
            data-testid='overview-panel'
          >
            <div className='mb-8 flex flex-col items-start justify-between gap-4 border-b border-border pb-4 md:flex-row md:items-center'>
              <div>
                <h1 className='font-serif text-2xl font-bold text-foreground md:text-3xl'>
                  {project.title}
                </h1>
                <p className='mt-1 text-sm text-muted-foreground'>{project.style}</p>
              </div>
            </div>
            <div className='space-y-8'>
              <CoverGenerator project={project} onUpdateProject={onUpdateProject} />
              <section className='mt-8 rounded-lg border border-border bg-secondary/10 p-4'>
                <h4 className='mb-2 text-xs font-bold uppercase text-muted-foreground'>
                  Core Idea
                </h4>
                <p className='whitespace-pre-wrap font-mono text-sm text-foreground'>
                  {project.idea}
                </p>
              </section>
            </div>
          </div>
        ) : selectedChapterId === 'publish' && onUpdateProject && onUpdateChapter ? (
          <PublishPanel
            project={project}
            onUpdateProject={onUpdateProject}
            onUpdateChapter={onUpdateChapter}
          />
        ) : selectedChapter ? (
          <div
            className={`mx-auto flex min-h-full w-full flex-col p-6 transition-all duration-500 md:p-12 ${isFocusMode ? 'max-w-4xl pt-20' : 'max-w-3xl'}`}
            data-testid='chapter-editor'
          >
            <div
              className={`mb-6 flex flex-col gap-2 ${isFocusMode ? 'opacity-50 transition-opacity hover:opacity-100' : ''}`}
            >
              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground'>
                  Chapter {selectedChapter.orderIndex}
                  {onUpdateChapter && (
                    <div className='relative inline-block'>
                      <select
                        value={selectedChapter.status}
                        onChange={e =>
                          onUpdateChapter(selectedChapter.id, {
                            status: e.target.value as ChapterStatus,
                          })
                        }
                        className={`cursor-pointer appearance-none rounded bg-transparent py-0.5 pl-2 pr-4 text-[10px] font-bold uppercase focus:outline-none ${
                          selectedChapter.status === ChapterStatus.COMPLETE
                            ? 'text-green-500'
                            : selectedChapter.status === ChapterStatus.DRAFTING
                              ? 'text-blue-500'
                              : selectedChapter.status === ChapterStatus.REVIEW
                                ? 'text-yellow-500'
                                : 'text-muted-foreground'
                        }`}
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
                      className={`h-1.5 w-1.5 rounded-full transition-colors ${hasUnsavedChanges ? 'animate-pulse bg-yellow-500' : 'bg-green-500/50'}`}
                    />
                    <span className='hidden text-[10px] uppercase tracking-wider opacity-70 md:inline'>
                      {hasUnsavedChanges ? 'Saving' : 'Saved'}
                    </span>
                  </div>
                </div>
              </div>
              <h1 className='border-b border-border pb-4 font-serif text-2xl font-bold text-foreground md:text-3xl'>
                {selectedChapter.title}
              </h1>
            </div>

            <div className='flex flex-1 flex-col gap-6'>
              <div
                className={`group transition-all duration-500 ${isFocusMode ? 'hidden' : 'block'}`}
              >
                <label className='mb-2 block text-xs font-semibold uppercase tracking-wider text-muted-foreground opacity-70'>
                  Summary / Goal
                </label>
                <textarea
                  className='min-h-[80px] w-full resize-y rounded-md border border-border/50 bg-secondary/5 p-3 text-sm italic text-muted-foreground transition-colors focus:bg-background focus:text-foreground focus:outline-none focus:ring-1 focus:ring-primary'
                  value={summary}
                  onChange={handleSummaryChange}
                  data-testid='chapter-summary-input'
                />
              </div>

              {onRefineChapter && !isFocusMode && (
                <div className='rounded-lg border border-border/40 bg-secondary/5 p-4'>
                  <div className='mb-4 flex items-center gap-2'>
                    <Wand2 className='h-4 w-4 text-primary' />
                    <h4 className='text-sm font-semibold text-foreground'>AI Tools</h4>
                  </div>
                  <div className='flex flex-col items-end gap-4 xl:flex-row'>
                    <div className='grid w-full flex-1 grid-cols-1 gap-4 md:grid-cols-2'>
                      <div className='space-y-1'>
                        <label className='text-[10px] font-bold uppercase text-muted-foreground'>
                          Model
                        </label>
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
                        onClick={() => onRefineChapter(selectedChapter.id, refineSettings, content)}
                        disabled={project.isGenerating || !content}
                        className='flex h-[34px] flex-1 items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-all hover:bg-primary/90 disabled:opacity-50 xl:flex-none'
                        data-testid='refine-chapter-btn'
                      >
                        {project.isGenerating && selectedChapterId === selectedChapter.id ? (
                          <Loader2 className='h-4 w-4 animate-spin' />
                        ) : (
                          <Wand2 className='h-4 w-4' />
                        )}{' '}
                        Refine
                      </button>

                      {/* Continue Button */}
                      {onContinueChapter && (
                        <button
                          onClick={() => onContinueChapter(selectedChapter.id)}
                          disabled={project.isGenerating}
                          className='flex h-[34px] flex-1 items-center justify-center gap-2 rounded-md border border-border bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground shadow-sm transition-all hover:bg-secondary/80 disabled:opacity-50 xl:flex-none'
                          data-testid='continue-chapter-btn'
                          title='Continue writing from current content'
                        >
                          {project.isGenerating && selectedChapterId === selectedChapter.id ? (
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
              )}

              <div className='relative flex flex-1 flex-col'>
                {!isFocusMode && (
                  <label className='mb-2 block text-xs font-semibold uppercase tracking-wider text-muted-foreground opacity-70'>
                    Chapter Content
                  </label>
                )}
                <textarea
                  className={`w-full flex-1 resize-y rounded-md bg-transparent p-4 font-serif text-lg leading-relaxed text-foreground transition-all focus:outline-none ${isFocusMode ? 'min-h-[80vh] border-none text-xl shadow-none ring-0' : 'min-h-[400px] border border-border/50 shadow-inner hover:border-border focus:border-primary/50 focus:ring-1 focus:ring-primary/20'}`}
                  value={content}
                  onChange={handleContentChange}
                  placeholder='Start writing or wait for the AI...'
                  data-testid='chapter-content-input'
                />
              </div>
            </div>
          </div>
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
