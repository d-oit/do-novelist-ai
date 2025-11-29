import React, { useEffect, useRef } from 'react';
import { Project, Chapter, ChapterStatus, RefineOptions } from '../../../types/index';

// ...

const getStatusConfig = (status: ChapterStatus) => {
  switch (status) {
    case ChapterStatus.COMPLETE: return { icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', label: 'Complete' };
    case ChapterStatus.DRAFTING: return { icon: PenLine, color: 'text-blue-600', bg: 'bg-blue-500/10', border: 'border-blue-500/20', label: 'Drafting' };
    case ChapterStatus.REVIEW: return { icon: Eye, color: 'text-amber-600', bg: 'bg-amber-500/10', border: 'border-amber-500/20', label: 'Review' };
    default: return { icon: CircleDashed, color: 'text-slate-500', bg: 'bg-slate-500/10', border: 'border-slate-500/20', label: 'Pending' };
  }
};
import { BookOpen, CheckCircle2, Wand2, Loader2, Menu, X, Maximize2, Minimize2, AlignLeft, Type, UploadCloud, Timer, ChevronDown, CircleDashed, PenLine, Eye, Plus, Sparkles, Image as ImageIcon, RefreshCw, GitBranch, History, BarChart3 } from 'lucide-react';
import CoverGenerator from './CoverGenerator';
import PublishPanel from './PublishPanel';
import { VersionHistory, VersionComparison, useVersioning } from '../../versioning';
import { AnalyticsDashboard, useAnalytics } from '../../analytics';
import { generateChapterIllustration } from '../../../lib/ai';
import { useEditorState } from '../hooks/useEditorState';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }

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
  onContinueChapter
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
  useEffect(() => { stateRef.current = state; }, [state]);
  useEffect(() => { currentChapterIdRef.current = selectedChapterId; }, [selectedChapterId]);

  // Initialize state when chapter changes
  useEffect(() => {
    if (selectedChapter) {
      actions.setChapter(selectedChapter.summary || '', selectedChapter.content || '');

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
  }, [selectedChapter?.id, selectedChapter?.content, selectedChapter?.summary, project.id, analytics.isTracking]); // Removed analytics from dependency to avoid loops if analytics changes often

  // Auto-save logic
  useEffect(() => {
    if (!selectedChapterId || !onUpdateChapter || selectedChapterId === 'overview' || selectedChapterId === 'publish') return;

    const timer = setTimeout(() => {
      const { summary, content, lastSavedSummary, lastSavedContent } = stateRef.current;
      const needsSaveSummary = summary !== lastSavedSummary;
      const needsSaveContent = content !== lastSavedContent;

      if (needsSaveSummary || needsSaveContent) {
        onUpdateChapter(selectedChapterId, { summary, content });
        actions.markSaved();

        // Auto-save version if there's substantial content change
        if (selectedChapter && content && content !== lastSavedContent && content.length > 50) {
          saveVersion('auto');
        }
      }
    }, 3000);
    return () => clearTimeout(timer);
  }, [state.summary, state.content, selectedChapterId, onUpdateChapter]);

  // Save on unmount/change chapter
  useEffect(() => {
    return () => {
      const chapterId = currentChapterIdRef.current;
      if (!chapterId || !onUpdateChapter || chapterId === 'overview' || chapterId === 'publish') return;

      const { summary, content, lastSavedSummary, lastSavedContent } = stateRef.current;
      if (summary !== lastSavedSummary || content !== lastSavedContent) {
        onUpdateChapter(chapterId, { summary, content });
      }
    };
  }, [selectedChapterId]);

  const handleSummaryChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    actions.updateSummary(e.target.value);
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    actions.updateContent(e.target.value);
  };

  const getWordCount = (text: string) => text.trim().split(/\s+/).filter(w => w.length > 0).length;
  const currentWordCount = getWordCount(state.content);
  const readingTime = Math.max(1, Math.ceil(currentWordCount / 230));

  const handleGenerateIllustration = async () => {
    if (!selectedChapter || !onUpdateChapter) return;
    actions.setGeneratingImage(true);
    try {
      const image = await generateChapterIllustration(selectedChapter.title, selectedChapter.summary, project.style);
      if (image) {
        onUpdateChapter(selectedChapter.id, { illustration: image });
      } else {
        alert("Failed to generate illustration. Please try again.");
      }
    } catch (e) {
      console.error(e);
      alert("Error generating illustration.");
    } finally {
      actions.setGeneratingImage(false);
    }
  };

  const saveVersion = async (type: 'manual' | 'auto' | 'ai-generated' | 'restore' = 'manual', message?: string) => {
    if (!selectedChapter) return;

    const currentChapter: Chapter = {
      ...selectedChapter,
      summary: state.summary,
      content: state.content,
    };

    try {
      await versioning.saveVersion(currentChapter, message, type);
    } catch (error) {
      console.error('Failed to save version:', error);
    }
  };

  const handleRestoreVersion = (restoredChapter: Chapter) => {
    if (!onUpdateChapter) return;

    actions.setChapter(restoredChapter.summary, restoredChapter.content);
    onUpdateChapter(restoredChapter.id, {
      summary: restoredChapter.summary,
      content: restoredChapter.content,
    });

    // Save a restore version
    saveVersion('restore', `Restored version: ${restoredChapter.title}`);
  };

  return (
    <div className={cn("flex flex-col md:flex-row h-full border border-border rounded-lg overflow-hidden bg-card relative transition-all duration-500", state.isFocusMode && "fixed inset-0 z-50 m-0 rounded-none border-none")}>
      {/* Mobile Header */}
      <div className={cn("md:hidden flex items-center justify-between p-4 border-b border-border bg-secondary/10", state.isFocusMode && "hidden")}>
        <div className="flex items-center gap-2 font-semibold text-sm"><BookOpen className="w-4 h-4 text-primary" /><span className="truncate max-w-[200px]">{selectedChapterId === 'overview' ? 'Project Overview' : selectedChapterId === 'publish' ? 'Publish & Export' : selectedChapter ? `Ch. ${selectedChapter.orderIndex}: ${selectedChapter.title}` : 'Select Chapter'}</span></div>
        <button onClick={actions.toggleSidebar} className="p-1 text-muted-foreground hover:text-foreground" data-testid="mobile-sidebar-toggle">{state.isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}</button>
      </div>

      {/* Sidebar */}
      <div className={cn("absolute md:relative z-20 inset-y-0 left-0 w-64 bg-card md:bg-secondary/5 border-r border-border flex flex-col transition-all duration-300 ease-in-out shadow-2xl md:shadow-none", state.isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0", state.isFocusMode && "md:-translate-x-full md:w-0 md:border-none")} data-testid="chapter-sidebar">
        <div className="p-4 border-b border-border bg-secondary/10 hidden md:block"><h3 className="font-semibold text-sm text-foreground flex items-center gap-2"><BookOpen className="w-4 h-4 text-primary" /> Structure</h3></div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar flex flex-col">
          <div className="mb-2 space-y-1 shrink-0">
            <button onClick={() => onSelectChapter('overview')} className={cn("w-full text-left px-3 py-2 rounded-md text-xs transition-colors flex items-center gap-2 font-bold uppercase tracking-wider", selectedChapterId === 'overview' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-secondary hover:text-foreground')} data-testid="chapter-item-overview"><AlignLeft className="w-3 h-3 shrink-0" /> Project Overview</button>
            <button onClick={() => onSelectChapter('publish')} className={cn("w-full text-left px-3 py-2 rounded-md text-xs transition-colors flex items-center gap-2 font-bold uppercase tracking-wider", selectedChapterId === 'publish' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-secondary hover:text-foreground')} data-testid="chapter-item-publish"><UploadCloud className="w-3 h-3 shrink-0" /> Publish & Export</button>
          </div>
          <div className="h-px bg-border/50 my-2 mx-1 shrink-0"></div>
          <div className="flex-1 overflow-y-auto space-y-1">
            {project.chapters.length === 0 && <div className="p-4 text-xs text-muted-foreground text-center italic opacity-70">Waiting for Outline...</div>}
            {project.chapters.map((chapter) => {
              const StatusIcon = getStatusConfig(chapter.status).icon;
              return (
                <button key={chapter.id} onClick={() => onSelectChapter(chapter.id)} className={cn("w-full text-left px-3 py-2 rounded-md text-xs transition-colors flex items-center gap-2 group", selectedChapterId === chapter.id ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:bg-secondary hover:text-foreground')} data-testid={`chapter-item-order-${chapter.orderIndex}`}>
                  <StatusIcon className={cn("w-3 h-3 shrink-0", selectedChapterId === chapter.id ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
                  <span className="truncate flex-1">{chapter.orderIndex}. {chapter.title}</span>
                  <span className="text-[9px] text-muted-foreground opacity-60">{getWordCount(chapter.content)}w</span>
                </button>
              );
            })}
          </div>
          {onAddChapter && <div className="mt-2 pt-2 border-t border-border/50 shrink-0"><button onClick={onAddChapter} className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-md text-xs font-medium border border-dashed border-border text-muted-foreground hover:text-primary hover:border-primary/50 hover:bg-secondary/50 transition-all" data-testid="add-chapter-btn"><Plus className="w-3 h-3" /> Add Chapter</button></div>}
        </div>
      </div>

      {state.isSidebarOpen && <div className="md:hidden fixed inset-0 bg-black/50 z-10" onClick={actions.toggleSidebar}></div>}

      {/* Main Content */}
      <div className="flex-1 bg-background overflow-y-auto relative custom-scrollbar h-[calc(100vh-10rem)] md:h-auto flex flex-col">

        {/* Focus Mode & Stats Overlay */}
        <div className="absolute top-4 right-6 z-30 flex gap-2">
          {state.isFocusMode && <div className="px-3 py-1 bg-secondary/80 backdrop-blur rounded-full text-xs font-mono text-muted-foreground border border-border animate-in fade-in flex items-center gap-2"><span>{currentWordCount} words</span><span className="w-px h-3 bg-border"></span><span className="flex items-center gap-1"><Timer className="w-3 h-3" /> {readingTime} min</span></div>}
          <button onClick={actions.toggleFocusMode} className="p-2 bg-card/50 hover:bg-card backdrop-blur border border-border rounded-full text-muted-foreground hover:text-foreground transition-all shadow-sm" data-testid="focus-mode-toggle">{state.isFocusMode ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}</button>
        </div>

        {selectedChapterId === 'overview' && onUpdateProject ? (
          <div className="max-w-3xl mx-auto p-6 md:p-8 min-h-full w-full" data-testid="overview-panel">
            <div className="mb-8 border-b border-border pb-4"><h1 className="text-2xl md:text-3xl font-serif font-bold text-foreground">{project.title}</h1><p className="text-muted-foreground mt-1 text-sm">{project.style}</p></div>
            <div className="space-y-8"><CoverGenerator project={project} onUpdateProject={onUpdateProject} /><section className="mt-8 p-4 bg-secondary/10 rounded-lg border border-border"><h4 className="text-xs font-bold uppercase text-muted-foreground mb-2">Core Idea</h4><p className="text-sm text-foreground font-mono whitespace-pre-wrap">{project.idea}</p></section></div>
          </div>
        ) : selectedChapterId === 'publish' && onUpdateProject && onUpdateChapter ? (
          <PublishPanel project={project} onUpdateProject={onUpdateProject} onUpdateChapter={onUpdateChapter} />
        ) : selectedChapter ? (
          <div className={cn("mx-auto min-h-full w-full flex flex-col transition-all duration-500", state.isFocusMode ? "max-w-4xl pt-20 px-6 md:px-12" : "max-w-3xl p-6 md:p-12")} data-testid="chapter-editor">

            {/* Cinematic Chapter Illustration */}
            {selectedChapter.illustration && (
              <div className={cn("relative w-full aspect-[21/9] rounded-xl overflow-hidden shadow-2xl mb-8 group border border-white/5", state.isFocusMode && "max-w-5xl mx-auto")}>
                <img
                  src={selectedChapter.illustration}
                  alt="Chapter Illustration"
                  className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent opacity-80"></div>

                <div className="absolute bottom-4 left-4 z-10">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/70 mb-1">Visualized by Imagen</p>
                </div>

                <button
                  onClick={handleGenerateIllustration}
                  disabled={state.isGeneratingImage || project.isGenerating}
                  className="absolute top-3 right-3 p-2 bg-black/40 hover:bg-black/60 backdrop-blur-md text-white rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 disabled:opacity-0 border border-white/10 hover:border-white/30"
                  title="Regenerate Illustration"
                >
                  <RefreshCw className={cn("w-4 h-4", state.isGeneratingImage && "animate-spin")} />
                </button>
              </div>
            )}

            {/* Chapter Header Info */}
            <div className={cn("mb-6 flex flex-col gap-3", state.isFocusMode && "opacity-50 hover:opacity-100 transition-opacity")}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3"><span className="text-xs font-bold uppercase tracking-widest text-muted-foreground/70">Chapter {selectedChapter.orderIndex}</span>{onUpdateChapter && <><div className="h-4 w-px bg-border hidden sm:block"></div><div className="relative group">{(() => { const config = getStatusConfig(selectedChapter.status); const StatusIcon = config.icon; return (<><div className={cn("flex items-center gap-2 px-2.5 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wide cursor-pointer transition-all hover:shadow-sm", config.bg, config.color, config.border)}><StatusIcon className="w-3 h-3" /><span>{config.label}</span><ChevronDown className="w-3 h-3 opacity-50" /></div><select value={selectedChapter.status} onChange={(e) => onUpdateChapter(selectedChapter.id, { status: e.target.value as ChapterStatus })} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full">{Object.values(ChapterStatus).map(s => <option key={s} value={s}>{s}</option>)}</select></>); })()}</div></>}</div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground"><span className="font-mono flex items-center gap-1.5 bg-secondary/30 border border-border/50 px-2 py-1 rounded-md"><Type className="w-3 h-3 opacity-70" /> {currentWordCount}</span><span className="font-mono flex items-center gap-1.5 bg-secondary/30 border border-border/50 px-2 py-1 rounded-md"><Timer className="w-3 h-3 opacity-70" /> ~{readingTime}m</span><div className="flex items-center gap-1.5 pl-2" data-testid="save-status-indicator"><div className={cn("w-1.5 h-1.5 rounded-full transition-colors", state.hasUnsavedChanges ? "bg-amber-500 animate-pulse" : "bg-emerald-500/50")}></div><span className="hidden md:inline uppercase tracking-wider opacity-70 text-[10px] font-semibold">{state.hasUnsavedChanges ? 'Saving' : 'Saved'}</span></div></div>
              </div>
              <h1 className="text-3xl md:text-5xl font-serif font-bold text-foreground leading-tight pb-2 tracking-tight">{selectedChapter.title}</h1>
              <div className="h-px w-full bg-gradient-to-r from-border via-border/50 to-transparent"></div>
            </div>

            <div className="flex flex-col gap-8 flex-1">
              {/* Summary Box */}
              <div className={cn("group transition-all duration-500", state.isFocusMode ? "hidden" : "block")}>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block opacity-70">Chapter Goal</label>
                <textarea className="w-full p-3 text-sm text-muted-foreground italic bg-secondary/5 rounded-md border border-border/50 focus:outline-none focus:ring-1 focus:ring-primary focus:bg-background focus:text-foreground resize-y min-h-[80px] transition-colors" value={state.summary} onChange={handleSummaryChange} data-testid="chapter-summary-input" />
              </div>

              {/* AI Toolbar */}
              {onRefineChapter && !state.isFocusMode && (
                <div className="bg-secondary/5 p-4 rounded-xl border border-border/60 backdrop-blur-sm">
                  <div className="flex items-center gap-2 mb-4"><Wand2 className="w-4 h-4 text-primary" /><h4 className="text-sm font-semibold text-foreground">Creative Suite</h4></div>
                  <div className="flex flex-col xl:flex-row gap-4 items-end">
                    <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1"><label className="text-[10px] uppercase font-bold text-muted-foreground">Model</label><select className="w-full bg-background text-xs px-3 py-2 rounded border border-border focus:outline-none focus:border-primary" value={state.refineSettings.model} onChange={(e) => actions.updateRefineSettings({ model: e.target.value as any })} disabled={project.isGenerating}><option value="gemini-2.5-flash">Flash 2.5 (Fast)</option><option value="gemini-3-pro-preview">Pro 3.0 (Reasoning)</option></select></div>
                      <div className="space-y-1.5"><label className="text-[10px] uppercase font-bold text-muted-foreground">Creativity</label><input type="range" min="0" max="1" step="0.1" value={state.refineSettings.temperature} onChange={(e) => actions.updateRefineSettings({ temperature: parseFloat(e.target.value) })} className="w-full h-1.5 bg-secondary rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:bg-primary" disabled={project.isGenerating} /><div className="flex justify-between text-[9px] text-muted-foreground px-0.5"><span>Focused</span><span>Wild</span></div></div>
                    </div>
                    <div className="flex gap-2 w-full xl:w-auto">
                      <button onClick={() => onRefineChapter(selectedChapter.id, state.refineSettings, state.content)} disabled={project.isGenerating || !state.content} className="flex-1 xl:flex-none flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wide text-primary-foreground bg-primary hover:bg-primary/90 rounded-md transition-all disabled:opacity-50 shadow-md h-[36px]" data-testid="refine-chapter-btn">{project.isGenerating && selectedChapterId === selectedChapter.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />} Refine</button>
                      {onContinueChapter && <button onClick={() => onContinueChapter(selectedChapter.id)} disabled={project.isGenerating} className="flex-1 xl:flex-none flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wide bg-secondary hover:bg-secondary/80 text-secondary-foreground border border-border rounded-md transition-all disabled:opacity-50 shadow-sm h-[36px]" data-testid="continue-chapter-btn">{project.isGenerating && selectedChapterId === selectedChapter.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 text-primary" />} Continue</button>}
                      <button
                        onClick={handleGenerateIllustration}
                        disabled={state.isGeneratingImage || project.isGenerating}
                        className="flex-1 xl:flex-none flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wide bg-violet-500/10 hover:bg-violet-500/20 text-violet-500 border border-violet-500/20 rounded-md transition-all disabled:opacity-50 shadow-sm h-[36px]"
                        title="Generate Scene Illustration"
                      >
                        {state.isGeneratingImage ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />} Visualize
                      </button>

                      <button
                        onClick={() => saveVersion('manual')}
                        disabled={project.isGenerating || !state.content}
                        className="flex-1 xl:flex-none flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wide bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 border border-emerald-500/20 rounded-md transition-all disabled:opacity-50 shadow-sm h-[36px]"
                        title="Save Version Checkpoint"
                      >
                        <GitBranch className="w-4 h-4" /> Save Version
                      </button>

                      <button
                        onClick={() => actions.setShowVersionHistory(true)}
                        disabled={project.isGenerating}
                        className="flex-1 xl:flex-none flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wide bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 border border-blue-500/20 rounded-md transition-all disabled:opacity-50 shadow-sm h-[36px]"
                        title="View Version History"
                      >
                        <History className="w-4 h-4" /> History
                      </button>

                      <button
                        onClick={() => actions.setShowAnalytics(true)}
                        disabled={project.isGenerating}
                        className="flex-1 xl:flex-none flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wide bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 border border-indigo-500/20 rounded-md transition-all disabled:opacity-50 shadow-sm h-[36px]"
                        title="View Analytics Dashboard"
                      >
                        <BarChart3 className="w-4 h-4" /> Analytics
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Main Text Editor */}
              <div className="flex-1 flex flex-col relative">
                {!state.isFocusMode && <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block opacity-70">Manuscript</label>}
                <textarea
                  className={cn(
                    "flex-1 w-full p-4 bg-transparent rounded-md focus:outline-none font-serif text-lg leading-relaxed text-foreground resize-y transition-all placeholder:text-muted-foreground/30",
                    state.isFocusMode ? "border-none ring-0 shadow-none min-h-[80vh] text-xl md:text-2xl leading-loose" : "border border-border/50 hover:border-border focus:border-primary/50 focus:ring-1 focus:ring-primary/20 shadow-inner min-h-[500px]"
                  )}
                  value={state.content}
                  onChange={handleContentChange}
                  onBlur={() => {
                    if (state.content !== state.lastSavedContent && onUpdateChapter && selectedChapterId) {
                      onUpdateChapter(selectedChapterId, { content: state.content });
                      actions.markSaved();
                    }
                  }}
                  placeholder="The story begins..."
                  data-testid="chapter-content-input"
                />
              </div>
            </div>
          </div>
        ) : <div className="flex items-center justify-center h-full text-muted-foreground min-h-[300px]"><div className="text-center"><BookOpen className="w-12 h-12 mx-auto mb-4 opacity-20" /><p>Select a chapter or Project Overview.</p></div></div>}
      </div>

      {/* Version History Modal */}
      {state.showVersionHistory && selectedChapter && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-4xl h-[80dvh] bg-card rounded-lg shadow-2xl overflow-hidden">
            <VersionHistory
              chapter={selectedChapter}
              onRestoreVersion={handleRestoreVersion}
              onClose={() => actions.setShowVersionHistory(false)}
              className="w-full h-full"
            />
          </div>
        </div>
      )}

      {/* Version Comparison Modal */}
      {state.showVersionComparison && state.comparisonVersions && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-6xl h-[85dvh] bg-card rounded-lg shadow-2xl overflow-hidden">
            <VersionComparison
              version1={state.comparisonVersions[0]}
              version2={state.comparisonVersions[1]}
              onClose={actions.closeComparison}
              className="w-full h-full"
            />
          </div>
        </div>
      )}

      {/* Analytics Dashboard Modal */}
      {state.showAnalytics && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-7xl h-[90dvh] bg-card rounded-lg shadow-2xl overflow-hidden">
            <AnalyticsDashboard
              project={project}
              onClose={() => actions.setShowAnalytics(false)}
              className="w-full h-full"
            />
          </div>
        </div>
      )}
    </div>
  );
};
export default BookViewer;