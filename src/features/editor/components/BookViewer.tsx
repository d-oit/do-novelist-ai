import React, { useEffect, useRef } from 'react';

import { Project, Chapter, ChapterStatus, RefineOptions } from '../../../types/index';
import { AIModel } from '../types';

// ...

const getStatusConfig = (
  status: ChapterStatus,
): {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  color: string;
  bg: string;
  border: string;
  label: string;
} => {
  switch (status) {
    case ChapterStatus.COMPLETE:
      return {
        icon: CheckCircle2,
        color: 'text-emerald-600',
        bg: 'bg-emerald-500/10',
        border: 'border-emerald-500/20',
        label: 'Complete',
      };
    case ChapterStatus.DRAFTING:
      return {
        icon: PenLine,
        color: 'text-blue-600',
        bg: 'bg-blue-500/10',
        border: 'border-blue-500/20',
        label: 'Drafting',
      };
    case ChapterStatus.REVIEW:
      return {
        icon: Eye,
        color: 'text-amber-600',
        bg: 'bg-amber-500/10',
        border: 'border-amber-500/20',
        label: 'Review',
      };
    default:
      return {
        icon: CircleDashed,
        color: 'text-slate-500',
        bg: 'bg-slate-500/10',
        border: 'border-slate-500/20',
        label: 'Pending',
      };
  }
};
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
  Timer,
  ChevronDown,
  CircleDashed,
  PenLine,
  Eye,
  Plus,
  Sparkles,
  Image as ImageIcon,
  RefreshCw,
  GitBranch,
  History,
  BarChart3,
} from 'lucide-react';

import { AnalyticsDashboard, useAnalytics } from '../../analytics';
import { VersionHistory, VersionComparison, useVersioning } from '../../versioning';
import { useEditorState } from '../hooks/useEditorState';

import CoverGenerator from './CoverGenerator';
import PublishPanel from './PublishPanel';

import { generateChapterIllustration } from '../../../lib/ai';

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

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

  // Use the new reducer-based state hook
  const { state, actions } = useEditorState();

  // Version history hook
  const versioning = useVersioning(selectedChapter?.id);

  // Analytics hook
  const analytics = useAnalytics();

  const currentChapterIdRef = useRef(selectedChapterId);

  // Sync refs for auto-save logic (still needed for timeout/unmount logic)
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);
  useEffect(() => {
    currentChapterIdRef.current = selectedChapterId;
  }, [selectedChapterId]);

  // Initialize state when chapter changes
  useEffect(() => {
    if (selectedChapter) {
      actions.setChapter(selectedChapter.summary ?? '', selectedChapter.content ?? '');

      // Start analytics session when switching chapters
      if (!analytics.isTracking) {
        analytics.startSession(project.id, selectedChapter.id).catch(console.error);
      }
    } else {
      actions.setChapter('', '');

      // End session when no chapter is selected
      if (analytics.isTracking) {
        analytics.endSession().catch(console.error);
      }
    }
    if (window.innerWidth < 768) actions.toggleSidebar(); // Close sidebar on mobile
  }, [
    selectedChapter?.id,
    selectedChapter?.content,
    selectedChapter?.summary,
    project.id,
    analytics.isTracking,
  ]); // Removed analytics from dependency to avoid loops if analytics changes often

  // Auto-save logic
  useEffect(() => {
    if (
      selectedChapterId == null ||
      !onUpdateChapter ||
      selectedChapterId === 'overview' ||
      selectedChapterId === 'publish'
    )
      return;

    const timer = setTimeout(() => {
      const { summary, content, lastSavedSummary, lastSavedContent } = stateRef.current;
      const needsSaveSummary = summary !== lastSavedSummary;
      const needsSaveContent = content !== lastSavedContent;

      if (needsSaveSummary || needsSaveContent) {
        onUpdateChapter(selectedChapterId, { summary, content });
        actions.markSaved();

        // Auto-save version if there's substantial content change
        if (selectedChapter && content && content !== lastSavedContent && content.length > 50) {
          void saveVersion('auto');
        }
      }
    }, 3000);
    return (): void => clearTimeout(timer);
  }, [state.summary, state.content, selectedChapterId, onUpdateChapter]);

  // Save on unmount/change chapter
  useEffect((): (() => void) => {
    return (): void => {
      const chapterId = currentChapterIdRef.current;
      if (
        chapterId == null ||
        !onUpdateChapter ||
        chapterId === 'overview' ||
        chapterId === 'publish'
      )
        return;

      const { summary, content, lastSavedSummary, lastSavedContent } = stateRef.current;
      if (summary !== lastSavedSummary || content !== lastSavedContent) {
        onUpdateChapter(chapterId, { summary, content });
      }
    };
  }, [selectedChapterId]);

  const handleSummaryChange = (e: React.ChangeEvent<HTMLTextAreaElement>): void => {
    actions.updateSummary(e.target.value);
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>): void => {
    actions.updateContent(e.target.value);
  };

  const getWordCount = (text: string): number =>
    text
      .trim()
      .split(/\s+/)
      .filter(w => w.length > 0).length;
  const currentWordCount = getWordCount(state.content);
  const readingTime = Math.max(1, Math.ceil(currentWordCount / 230));

  const handleGenerateIllustration = (): void => {
    if (!selectedChapter || !onUpdateChapter) return;
    actions.setGeneratingImage(true);
    try {
      const image = generateChapterIllustration(
        selectedChapter.title,
        selectedChapter.summary,
        project.style,
      );
      if (image != null) {
        onUpdateChapter(selectedChapter.id, { illustration: image });
      } else {
        alert('Failed to generate illustration. Please try again.');
      }
    } catch (e) {
      console.error(e);
      alert('Error generating illustration.');
    } finally {
      actions.setGeneratingImage(false);
    }
  };

  const saveVersion = (
    type: 'manual' | 'auto' | 'ai-generated' | 'restore' = 'manual',
    message?: string,
  ): void => {
    if (!selectedChapter) return;

    const currentChapter: Chapter = {
      ...selectedChapter,
      summary: state.summary,
      content: state.content,
    };

    versioning.saveVersion(currentChapter, message, type).catch(error => {
      console.error('Failed to save version:', error);
    });
  };

  const handleRestoreVersion = (restoredChapter: Chapter): void => {
    if (!onUpdateChapter) return;

    actions.setChapter(restoredChapter.summary, restoredChapter.content);
    onUpdateChapter(restoredChapter.id, {
      summary: restoredChapter.summary,
      content: restoredChapter.content,
    });

    // Save a restore version
    void saveVersion('restore', `Restored version: ${restoredChapter.title}`);
  };

  return (
    <div
      className={cn(
        'relative flex h-full flex-col overflow-hidden rounded-lg border border-border bg-card transition-all duration-500 md:flex-row',
        state.isFocusMode && 'fixed inset-0 z-50 m-0 rounded-none border-none',
      )}
    >
      {/* Mobile Header */}
      <div
        className={cn(
          'flex items-center justify-between border-b border-border bg-secondary/10 p-4 md:hidden',
          state.isFocusMode && 'hidden',
        )}
      >
        <div className='flex items-center gap-2 text-sm font-semibold'>
          <BookOpen className='h-4 w-4 text-primary' />
          <span className='max-w-[200px] truncate'>
            {selectedChapterId === 'overview'
              ? 'Project Overview'
              : selectedChapterId === 'publish'
                ? 'Publish & Export'
                : selectedChapter
                  ? `Ch. ${selectedChapter.orderIndex}: ${selectedChapter.title}`
                  : 'Select Chapter'}
          </span>
        </div>
        <button
          onClick={actions.toggleSidebar}
          className='p-1 text-muted-foreground hover:text-foreground'
          data-testid='mobile-sidebar-toggle'
        >
          {state.isSidebarOpen ? <X className='h-5 w-5' /> : <Menu className='h-5 w-5' />}
        </button>
      </div>

      {/* Sidebar */}
      <div
        className={cn(
          'absolute inset-y-0 left-0 z-20 flex w-64 flex-col border-r border-border bg-card shadow-2xl transition-all duration-300 ease-in-out md:relative md:bg-secondary/5 md:shadow-none',
          state.isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
          state.isFocusMode && 'md:w-0 md:-translate-x-full md:border-none',
        )}
        data-testid='chapter-sidebar'
      >
        <div className='hidden border-b border-border bg-secondary/10 p-4 md:block'>
          <h3 className='flex items-center gap-2 text-sm font-semibold text-foreground'>
            <BookOpen className='h-4 w-4 text-primary' /> Structure
          </h3>
        </div>
        <div className='custom-scrollbar flex flex-1 flex-col space-y-1 overflow-y-auto p-2'>
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
          <div className='flex-1 space-y-1 overflow-y-auto'>
            {project.chapters.length === 0 && (
              <div className='p-4 text-center text-xs italic text-muted-foreground opacity-70'>
                Waiting for Outline...
              </div>
            )}
            {project.chapters.map(chapter => {
              const StatusIcon = getStatusConfig(chapter.status).icon;
              return (
                <button
                  key={chapter.id}
                  onClick={() => onSelectChapter(chapter.id)}
                  className={cn(
                    'group flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-xs transition-colors',
                    selectedChapterId === chapter.id
                      ? 'bg-primary/10 font-medium text-primary'
                      : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
                  )}
                  data-testid={`chapter-item-order-${chapter.orderIndex}`}
                >
                  <StatusIcon
                    className={cn(
                      'h-3 w-3 shrink-0',
                      selectedChapterId === chapter.id
                        ? 'text-primary'
                        : 'text-muted-foreground group-hover:text-foreground',
                    )}
                  />
                  <span className='flex-1 truncate'>
                    {chapter.orderIndex}. {chapter.title}
                  </span>
                  <span className='text-[9px] text-muted-foreground opacity-60'>
                    {getWordCount(chapter.content)}w
                  </span>
                </button>
              );
            })}
          </div>
          {onAddChapter && (
            <div className='mt-2 shrink-0 border-t border-border/50 pt-2'>
              <button
                onClick={onAddChapter}
                className='flex w-full items-center justify-center gap-2 rounded-md border border-dashed border-border px-3 py-2 text-xs font-medium text-muted-foreground transition-all hover:border-primary/50 hover:bg-secondary/50 hover:text-primary'
                data-testid='add-chapter-btn'
              >
                <Plus className='h-3 w-3' /> Add Chapter
              </button>
            </div>
          )}
        </div>
      </div>

      {state.isSidebarOpen && (
        <div className='fixed inset-0 z-10 bg-black/50 md:hidden' onClick={actions.toggleSidebar} />
      )}

      {/* Main Content */}
      <div className='custom-scrollbar relative flex h-[calc(100vh-10rem)] flex-1 flex-col overflow-y-auto bg-background md:h-auto'>
        {/* Focus Mode & Stats Overlay */}
        <div className='absolute right-6 top-4 z-30 flex gap-2'>
          {state.isFocusMode && (
            <div className='animate-in fade-in flex items-center gap-2 rounded-full border border-border bg-secondary/80 px-3 py-1 font-mono text-xs text-muted-foreground backdrop-blur'>
              <span>{currentWordCount} words</span>
              <span className='h-3 w-px bg-border' />
              <span className='flex items-center gap-1'>
                <Timer className='h-3 w-3' /> {readingTime} min
              </span>
            </div>
          )}
          <button
            onClick={actions.toggleFocusMode}
            className='rounded-full border border-border bg-card/50 p-2 text-muted-foreground shadow-sm backdrop-blur transition-all hover:bg-card hover:text-foreground'
            data-testid='focus-mode-toggle'
          >
            {state.isFocusMode ? (
              <Minimize2 className='h-4 w-4' />
            ) : (
              <Maximize2 className='h-4 w-4' />
            )}
          </button>
        </div>

        {selectedChapterId === 'overview' && onUpdateProject ? (
          <div
            className='mx-auto min-h-full w-full max-w-3xl p-6 md:p-8'
            data-testid='overview-panel'
          >
            <div className='mb-8 border-b border-border pb-4'>
              <h1 className='font-serif text-2xl font-bold text-foreground md:text-3xl'>
                {project.title}
              </h1>
              <p className='mt-1 text-sm text-muted-foreground'>{project.style}</p>
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
            className={cn(
              'mx-auto flex min-h-full w-full flex-col transition-all duration-500',
              state.isFocusMode ? 'max-w-4xl px-6 pt-20 md:px-12' : 'max-w-3xl p-6 md:p-12',
            )}
            data-testid='chapter-editor'
          >
            {/* Cinematic Chapter Illustration */}
            {selectedChapter.illustration != null && (
              <div
                className={cn(
                  'group relative mb-8 aspect-[21/9] w-full overflow-hidden rounded-xl border border-white/5 shadow-2xl',
                  state.isFocusMode && 'mx-auto max-w-5xl',
                )}
              >
                <img
                  src={selectedChapter.illustration}
                  alt='Chapter Illustration'
                  className='h-full w-full object-cover transition-transform duration-1000 group-hover:scale-105'
                />
                <div className='absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent opacity-80' />

                <div className='absolute bottom-4 left-4 z-10'>
                  <p className='mb-1 text-[10px] font-bold uppercase tracking-widest text-white/70'>
                    Visualized by Imagen
                  </p>
                </div>

                <button
                  onClick={() => void handleGenerateIllustration()}
                  disabled={state.isGeneratingImage || project.isGenerating}
                  className='absolute right-3 top-3 rounded-lg border border-white/10 bg-black/40 p-2 text-white opacity-0 backdrop-blur-md transition-all duration-300 hover:border-white/30 hover:bg-black/60 disabled:opacity-0 group-hover:opacity-100'
                  title='Regenerate Illustration'
                >
                  <RefreshCw className={cn('h-4 w-4', state.isGeneratingImage && 'animate-spin')} />
                </button>
              </div>
            )}

            {/* Chapter Header Info */}
            <div
              className={cn(
                'mb-6 flex flex-col gap-3',
                state.isFocusMode && 'opacity-50 transition-opacity hover:opacity-100',
              )}
            >
              <div className='flex flex-col justify-between gap-4 sm:flex-row sm:items-center'>
                <div className='flex items-center gap-3'>
                  <span className='text-xs font-bold uppercase tracking-widest text-muted-foreground/70'>
                    Chapter {selectedChapter.orderIndex}
                  </span>
                  {onUpdateChapter && (
                    <>
                      <div className='hidden h-4 w-px bg-border sm:block' />
                      <div className='group relative'>
                        {((): React.JSX.Element => {
                          const config = getStatusConfig(selectedChapter.status);
                          const StatusIcon = config.icon;
                          return (
                            <>
                              <div
                                className={cn(
                                  'flex cursor-pointer items-center gap-2 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide transition-all hover:shadow-sm',
                                  config.bg,
                                  config.color,
                                  config.border,
                                )}
                              >
                                <StatusIcon className='h-3 w-3' />
                                <span>{config.label}</span>
                                <ChevronDown className='h-3 w-3 opacity-50' />
                              </div>
                              <select
                                value={selectedChapter.status}
                                onChange={e =>
                                  onUpdateChapter(selectedChapter.id, {
                                    status: e.target.value as ChapterStatus,
                                  })
                                }
                                className='absolute inset-0 h-full w-full cursor-pointer opacity-0'
                              >
                                {Object.values(ChapterStatus).map(s => (
                                  <option key={s} value={s}>
                                    {s}
                                  </option>
                                ))}
                              </select>
                            </>
                          );
                        })()}
                      </div>
                    </>
                  )}
                </div>
                <div className='flex items-center gap-3 text-xs text-muted-foreground'>
                  <span className='flex items-center gap-1.5 rounded-md border border-border/50 bg-secondary/30 px-2 py-1 font-mono'>
                    <Type className='h-3 w-3 opacity-70' /> {currentWordCount}
                  </span>
                  <span className='flex items-center gap-1.5 rounded-md border border-border/50 bg-secondary/30 px-2 py-1 font-mono'>
                    <Timer className='h-3 w-3 opacity-70' /> ~{readingTime}m
                  </span>
                  <div
                    className='flex items-center gap-1.5 pl-2'
                    data-testid='save-status-indicator'
                  >
                    <div
                      className={cn(
                        'h-1.5 w-1.5 rounded-full transition-colors',
                        state.hasUnsavedChanges
                          ? 'animate-pulse bg-amber-500'
                          : 'bg-emerald-500/50',
                      )}
                    />
                    <span className='hidden text-[10px] font-semibold uppercase tracking-wider opacity-70 md:inline'>
                      {state.hasUnsavedChanges ? 'Saving' : 'Saved'}
                    </span>
                  </div>
                </div>
              </div>
              <h1 className='pb-2 font-serif text-3xl font-bold leading-tight tracking-tight text-foreground md:text-5xl'>
                {selectedChapter.title}
              </h1>
              <div className='h-px w-full bg-gradient-to-r from-border via-border/50 to-transparent' />
            </div>

            <div className='flex flex-1 flex-col gap-8'>
              {/* Summary Box */}
              <div
                className={cn(
                  'group transition-all duration-500',
                  state.isFocusMode ? 'hidden' : 'block',
                )}
              >
                <label className='mb-2 block text-xs font-semibold uppercase tracking-wider text-muted-foreground opacity-70'>
                  Chapter Goal
                </label>
                <textarea
                  className='min-h-[80px] w-full resize-y rounded-md border border-border/50 bg-secondary/5 p-3 text-sm italic text-muted-foreground transition-colors focus:bg-background focus:text-foreground focus:outline-none focus:ring-1 focus:ring-primary'
                  value={state.summary}
                  onChange={handleSummaryChange}
                  data-testid='chapter-summary-input'
                />
              </div>

              {/* AI Toolbar */}
              {onRefineChapter && !state.isFocusMode && (
                <div className='rounded-xl border border-border/60 bg-secondary/5 p-4 backdrop-blur-sm'>
                  <div className='mb-4 flex items-center gap-2'>
                    <Wand2 className='h-4 w-4 text-primary' />
                    <h4 className='text-sm font-semibold text-foreground'>Creative Suite</h4>
                  </div>
                  <div className='flex flex-col items-end gap-4 xl:flex-row'>
                    <div className='grid w-full flex-1 grid-cols-1 gap-4 md:grid-cols-2'>
                      <div className='space-y-1'>
                        <label className='text-[10px] font-bold uppercase text-muted-foreground'>
                          Model
                        </label>
                        <select
                          className='w-full rounded border border-border bg-background px-3 py-2 text-xs focus:border-primary focus:outline-none'
                          value={state.refineSettings.model}
                          onChange={e =>
                            actions.updateRefineSettings({ model: e.target.value as AIModel })
                          }
                          disabled={project.isGenerating}
                        >
                          <option value='gemini-2.5-flash'>Flash 2.5 (Fast)</option>
                          <option value='gemini-3-pro-preview'>Pro 3.0 (Reasoning)</option>
                        </select>
                      </div>
                      <div className='space-y-1.5'>
                        <label className='text-[10px] font-bold uppercase text-muted-foreground'>
                          Creativity
                        </label>
                        <input
                          type='range'
                          min='0'
                          max='1'
                          step='0.1'
                          value={state.refineSettings.temperature}
                          onChange={e =>
                            actions.updateRefineSettings({
                              temperature: parseFloat(e.target.value),
                            })
                          }
                          className='h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-secondary [&::-webkit-slider-thumb]:bg-primary'
                          disabled={project.isGenerating}
                        />
                        <div className='flex justify-between px-0.5 text-[9px] text-muted-foreground'>
                          <span>Focused</span>
                          <span>Wild</span>
                        </div>
                      </div>
                    </div>
                    <div className='flex w-full gap-2 xl:w-auto'>
                      <button
                        onClick={() =>
                          onRefineChapter(selectedChapter.id, state.refineSettings, state.content)
                        }
                        disabled={project.isGenerating || !state.content}
                        className='flex h-[36px] flex-1 items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-xs font-bold uppercase tracking-wide text-primary-foreground shadow-md transition-all hover:bg-primary/90 disabled:opacity-50 xl:flex-none'
                        data-testid='refine-chapter-btn'
                      >
                        {project.isGenerating && selectedChapterId === selectedChapter.id ? (
                          <Loader2 className='h-4 w-4 animate-spin' />
                        ) : (
                          <Wand2 className='h-4 w-4' />
                        )}{' '}
                        Refine
                      </button>
                      {onContinueChapter && (
                        <button
                          onClick={() => onContinueChapter(selectedChapter.id)}
                          disabled={project.isGenerating}
                          className='flex h-[36px] flex-1 items-center justify-center gap-2 rounded-md border border-border bg-secondary px-4 py-2 text-xs font-bold uppercase tracking-wide text-secondary-foreground shadow-sm transition-all hover:bg-secondary/80 disabled:opacity-50 xl:flex-none'
                          data-testid='continue-chapter-btn'
                        >
                          {project.isGenerating && selectedChapterId === selectedChapter.id ? (
                            <Loader2 className='h-4 w-4 animate-spin' />
                          ) : (
                            <Sparkles className='h-4 w-4 text-primary' />
                          )}{' '}
                          Continue
                        </button>
                      )}
                      <button
                        onClick={() => void handleGenerateIllustration()}
                        disabled={state.isGeneratingImage || project.isGenerating}
                        className='flex h-[36px] flex-1 items-center justify-center gap-2 rounded-md border border-violet-500/20 bg-violet-500/10 px-4 py-2 text-xs font-bold uppercase tracking-wide text-violet-500 shadow-sm transition-all hover:bg-violet-500/20 disabled:opacity-50 xl:flex-none'
                        title='Generate Scene Illustration'
                      >
                        {state.isGeneratingImage ? (
                          <Loader2 className='h-4 w-4 animate-spin' />
                        ) : (
                          <ImageIcon className='h-4 w-4' />
                        )}{' '}
                        Visualize
                      </button>

                      <button
                        onClick={() => void saveVersion('manual')}
                        disabled={project.isGenerating || !state.content}
                        className='flex h-[36px] flex-1 items-center justify-center gap-2 rounded-md border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-xs font-bold uppercase tracking-wide text-emerald-600 shadow-sm transition-all hover:bg-emerald-500/20 disabled:opacity-50 xl:flex-none'
                        title='Save Version Checkpoint'
                      >
                        <GitBranch className='h-4 w-4' /> Save Version
                      </button>

                      <button
                        onClick={() => actions.setShowVersionHistory(true)}
                        disabled={project.isGenerating}
                        className='flex h-[36px] flex-1 items-center justify-center gap-2 rounded-md border border-blue-500/20 bg-blue-500/10 px-4 py-2 text-xs font-bold uppercase tracking-wide text-blue-600 shadow-sm transition-all hover:bg-blue-500/20 disabled:opacity-50 xl:flex-none'
                        title='View Version History'
                      >
                        <History className='h-4 w-4' /> History
                      </button>

                      <button
                        onClick={() => actions.setShowAnalytics(true)}
                        disabled={project.isGenerating}
                        className='flex h-[36px] flex-1 items-center justify-center gap-2 rounded-md border border-indigo-500/20 bg-indigo-500/10 px-4 py-2 text-xs font-bold uppercase tracking-wide text-indigo-600 shadow-sm transition-all hover:bg-indigo-500/20 disabled:opacity-50 xl:flex-none'
                        title='View Analytics Dashboard'
                      >
                        <BarChart3 className='h-4 w-4' /> Analytics
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Main Text Editor */}
              <div className='relative flex flex-1 flex-col'>
                {!state.isFocusMode && (
                  <label className='mb-2 block text-xs font-semibold uppercase tracking-wider text-muted-foreground opacity-70'>
                    Manuscript
                  </label>
                )}
                <textarea
                  className={cn(
                    'w-full flex-1 resize-y rounded-md bg-transparent p-4 font-serif text-lg leading-relaxed text-foreground transition-all placeholder:text-muted-foreground/30 focus:outline-none',
                    state.isFocusMode
                      ? 'min-h-[80vh] border-none text-xl leading-loose shadow-none ring-0 md:text-2xl'
                      : 'min-h-[500px] border border-border/50 shadow-inner hover:border-border focus:border-primary/50 focus:ring-1 focus:ring-primary/20',
                  )}
                  value={state.content}
                  onChange={handleContentChange}
                  onBlur={() => {
                    if (
                      state.content !== state.lastSavedContent &&
                      onUpdateChapter &&
                      selectedChapterId != null
                    ) {
                      onUpdateChapter(selectedChapterId, { content: state.content });
                      actions.markSaved();
                    }
                  }}
                  placeholder='The story begins...'
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

      {/* Version History Modal */}
      {state.showVersionHistory && selectedChapter && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm'>
          <div className='h-[80dvh] w-full max-w-4xl overflow-hidden rounded-lg bg-card shadow-2xl'>
            <VersionHistory
              chapter={selectedChapter}
              onRestoreVersion={handleRestoreVersion}
              onClose={() => actions.setShowVersionHistory(false)}
              className='h-full w-full'
            />
          </div>
        </div>
      )}

      {/* Version Comparison Modal */}
      {state.showVersionComparison && state.comparisonVersions && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm'>
          <div className='h-[85dvh] w-full max-w-6xl overflow-hidden rounded-lg bg-card shadow-2xl'>
            <VersionComparison
              version1={state.comparisonVersions[0]}
              version2={state.comparisonVersions[1]}
              onClose={actions.closeComparison}
              className='h-full w-full'
            />
          </div>
        </div>
      )}

      {/* Analytics Dashboard Modal */}
      {state.showAnalytics && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm'>
          <div className='h-[90dvh] w-full max-w-7xl overflow-hidden rounded-lg bg-card shadow-2xl'>
            <AnalyticsDashboard
              project={project}
              onClose={() => actions.setShowAnalytics(false)}
              className='h-full w-full'
            />
          </div>
        </div>
      )}
    </div>
  );
};
export default BookViewer;
