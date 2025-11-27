
import React, { useState, useEffect, useRef } from 'react';
import { Project, Chapter, ChapterStatus, RefineOptions } from '@shared/types';
import { BookOpen, Lock, CheckCircle2, Wand2, Loader2, Menu, X, Maximize2, Minimize2, AlignLeft, Type, UploadCloud, RefreshCw, Clock, Edit3, Plus, Sparkles } from 'lucide-react';
import CoverGenerator from './CoverGenerator';
import PublishPanel from './PublishPanel';

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
  const [refineSettings, setRefineSettings] = useState<RefineOptions>({
    model: 'gemini-2.5-flash',
    temperature: 0.3
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

  useEffect(() => { currentSummaryRef.current = summary; }, [summary]);
  useEffect(() => { currentContentRef.current = content; }, [content]);
  useEffect(() => { currentChapterIdRef.current = selectedChapterId; }, [selectedChapterId]);

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
      if (selectedChapter.summary !== lastSavedSummary.current && selectedChapter.summary !== summary) {
        setSummary(selectedChapter.summary || '');
        lastSavedSummary.current = selectedChapter.summary || '';
      }
      if (selectedChapter.content !== lastSavedContent.current && selectedChapter.content !== content) {
        setContent(selectedChapter.content || '');
        lastSavedContent.current = selectedChapter.content || '';
      }
    }
  }, [selectedChapter?.summary, selectedChapter?.content]);

  useEffect(() => {
    if (!selectedChapterId || !onUpdateChapter || selectedChapterId === 'overview' || selectedChapterId === 'publish') return;
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
      if (!chapterId || !onUpdateChapter || chapterId === 'overview' || chapterId === 'publish') return;
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

  const getWordCount = (text: string) => text.trim().split(/\s+/).filter(w => w.length > 0).length;
  const currentWordCount = getWordCount(content);

  const getStatusIcon = (status: ChapterStatus) => {
    switch (status) {
      case ChapterStatus.COMPLETE: return <CheckCircle2 className="w-3 h-3 text-green-500" />;
      case ChapterStatus.DRAFTING: return <Edit3 className="w-3 h-3 text-blue-500" />;
      case ChapterStatus.REVIEW: return <RefreshCw className="w-3 h-3 text-yellow-500" />;
      default: return <Clock className="w-3 h-3 text-muted-foreground" />;
    }
  };

  return (
    <div className={`flex flex-col md:flex-row h-full border border-border rounded-lg overflow-hidden bg-card relative transition-all duration-500 ${isFocusMode ? 'fixed inset-0 z-50 m-0 rounded-none border-none' : ''}`}>
      
      {/* Mobile Header */}
      <div className={`md:hidden flex items-center justify-between p-4 border-b border-border bg-secondary/10 ${isFocusMode ? 'hidden' : ''}`}>
        <div className="flex items-center gap-2 font-semibold text-sm">
          <BookOpen className="w-4 h-4 text-primary" />
          <span>
            {selectedChapterId === 'overview' ? 'Project Overview' : 
             selectedChapterId === 'publish' ? 'Publish & Export' :
             selectedChapter ? `Ch. ${selectedChapter.orderIndex}` : 'Select Chapter'}
          </span>
        </div>
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-1 text-muted-foreground hover:text-foreground">
          {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Sidebar */}
      <div className={`
        absolute md:relative z-20 inset-y-0 left-0 w-64 bg-card md:bg-secondary/10 border-r border-border flex flex-col transition-all duration-300 ease-in-out shadow-2xl md:shadow-none
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        ${isFocusMode ? 'md:-translate-x-full md:w-0 md:border-none' : ''}
      `} data-testid="chapter-sidebar">
        <div className="p-4 border-b border-border bg-secondary/10 hidden md:block">
          <h3 className="font-semibold text-sm text-foreground flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-primary" />
            Structure
          </h3>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar flex flex-col">
          
          {/* Management Section */}
          <div className="mb-2 space-y-1 shrink-0">
            <button
              onClick={() => onSelectChapter('overview')}
              className={`w-full text-left px-3 py-2 rounded-md text-xs transition-colors flex items-center gap-2 font-bold uppercase tracking-wider ${selectedChapterId === 'overview' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-secondary hover:text-foreground'}`}
              data-testid="chapter-item-overview"
            >
              <AlignLeft className="w-3 h-3 shrink-0" /> Project Overview
            </button>
            <button
              onClick={() => onSelectChapter('publish')}
              className={`w-full text-left px-3 py-2 rounded-md text-xs transition-colors flex items-center gap-2 font-bold uppercase tracking-wider ${selectedChapterId === 'publish' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-secondary hover:text-foreground'}`}
              data-testid="chapter-item-publish"
            >
              <UploadCloud className="w-3 h-3 shrink-0" /> Publish & Export
            </button>
          </div>

          <div className="h-px bg-border/50 my-2 mx-1 shrink-0"></div>
          
          {/* Chapters List */}
          <div className="flex-1 overflow-y-auto space-y-1">
            {project.chapters.length === 0 && (
              <div className="p-4 text-xs text-muted-foreground text-center italic opacity-70">Waiting for Outline...</div>
            )}
            {project.chapters.map((chapter) => (
              <button
                key={chapter.id}
                onClick={() => onSelectChapter(chapter.id)}
                className={`w-full text-left px-3 py-2 rounded-md text-xs transition-colors flex items-center gap-2 ${selectedChapterId === chapter.id ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:bg-secondary hover:text-foreground'}`}
                data-testid={`chapter-item-${chapter.id}`}
              >
                {getStatusIcon(chapter.status)}
                <span className="truncate flex-1">{chapter.orderIndex}. {chapter.title}</span>
                <span className="text-[9px] text-muted-foreground opacity-60">{getWordCount(chapter.content)}w</span>
              </button>
            ))}
          </div>
          
          {/* Add Chapter Button */}
          {onAddChapter && (
             <div className="mt-2 pt-2 border-t border-border/50 shrink-0">
                <button 
                    onClick={onAddChapter}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-md text-xs font-medium border border-dashed border-border text-muted-foreground hover:text-primary hover:border-primary/50 hover:bg-secondary/50 transition-all"
                    title="Manually add a new empty chapter"
                    data-testid="add-chapter-btn"
                >
                    <Plus className="w-3 h-3" /> Add Chapter
                </button>
             </div>
          )}
        </div>
      </div>

      {/* Overlay for Mobile Sidebar */}
      {isSidebarOpen && <div className="md:hidden fixed inset-0 bg-black/50 z-10" onClick={() => setIsSidebarOpen(false)}></div>}

      {/* Content Area */}
      <div className="flex-1 bg-background overflow-y-auto relative custom-scrollbar h-[calc(100vh-10rem)] md:h-auto flex flex-col">
        
        {/* Focus Mode Toggle (Absolute) */}
        <div className="absolute top-4 right-6 z-30 flex gap-2">
           {isFocusMode && (
              <div className="px-3 py-1 bg-secondary/80 backdrop-blur rounded-full text-xs font-mono text-muted-foreground border border-border animate-in fade-in">
                 {currentWordCount} words
              </div>
           )}
           <button 
             onClick={() => setIsFocusMode(!isFocusMode)}
             className="p-2 bg-card/50 hover:bg-card backdrop-blur border border-border rounded-full text-muted-foreground hover:text-foreground transition-all shadow-sm"
             title={isFocusMode ? "Exit Focus Mode" : "Enter Focus Mode"}
           >
             {isFocusMode ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
           </button>
        </div>

        {/* View Routing */}
        {selectedChapterId === 'overview' && onUpdateProject ? (
          <div className="max-w-3xl mx-auto p-6 md:p-8 min-h-full w-full" data-testid="overview-panel">
             <div className="mb-8 border-b border-border pb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
               <div>
                 <h1 className="text-2xl md:text-3xl font-serif font-bold text-foreground">{project.title}</h1>
                 <p className="text-muted-foreground mt-1 text-sm">{project.style}</p>
               </div>
             </div>
             <div className="space-y-8">
               <CoverGenerator project={project} onUpdateProject={onUpdateProject} />
               <section className="mt-8 p-4 bg-secondary/10 rounded-lg border border-border">
                 <h4 className="text-xs font-bold uppercase text-muted-foreground mb-2">Core Idea</h4>
                 <p className="text-sm text-foreground font-mono whitespace-pre-wrap">{project.idea}</p>
               </section>
             </div>
          </div>
        ) : selectedChapterId === 'publish' && onUpdateProject && onUpdateChapter ? (
           <PublishPanel project={project} onUpdateProject={onUpdateProject} onUpdateChapter={onUpdateChapter} />
        ) : selectedChapter ? (
          <div className={`mx-auto p-6 md:p-12 min-h-full w-full flex flex-col transition-all duration-500 ${isFocusMode ? 'max-w-4xl pt-20' : 'max-w-3xl'}`} data-testid="chapter-editor">
            
            <div className={`mb-6 flex flex-col gap-2 ${isFocusMode ? 'opacity-50 hover:opacity-100 transition-opacity' : ''}`}>
               <div className="flex items-center justify-between">
                  <div className="text-xs text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                    Chapter {selectedChapter.orderIndex}
                    
                    {onUpdateChapter && (
                      <div className="relative inline-block">
                        <select
                          value={selectedChapter.status}
                          onChange={(e) => onUpdateChapter(selectedChapter.id, { status: e.target.value as ChapterStatus })}
                          className={`appearance-none bg-transparent font-bold uppercase text-[10px] pl-2 pr-4 py-0.5 rounded cursor-pointer focus:outline-none ${
                            selectedChapter.status === ChapterStatus.COMPLETE ? 'text-green-500' :
                            selectedChapter.status === ChapterStatus.DRAFTING ? 'text-blue-500' :
                            selectedChapter.status === ChapterStatus.REVIEW ? 'text-yellow-500' :
                            'text-muted-foreground'
                          }`}
                        >
                          {Object.values(ChapterStatus).map(s => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                     <span className="font-mono flex items-center gap-1.5 bg-secondary/50 px-2 py-0.5 rounded-md">
                        <Type className="w-3 h-3" /> {currentWordCount} words
                     </span>
                     <div className="flex items-center gap-1.5" title={hasUnsavedChanges ? "Unsaved changes" : "All changes saved"} data-testid="save-status-indicator">
                        <div className={`w-1.5 h-1.5 rounded-full transition-colors ${hasUnsavedChanges ? 'bg-yellow-500 animate-pulse' : 'bg-green-500/50'}`}></div>
                        <span className="hidden md:inline uppercase tracking-wider opacity-70 text-[10px]">{hasUnsavedChanges ? 'Saving' : 'Saved'}</span>
                     </div>
                  </div>
               </div>
               <h1 className="text-2xl md:text-3xl font-serif font-bold text-foreground pb-4 border-b border-border">{selectedChapter.title}</h1>
            </div>
            
            <div className="flex flex-col gap-6 flex-1">
              <div className={`group transition-all duration-500 ${isFocusMode ? 'hidden' : 'block'}`}>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block opacity-70">Summary / Goal</label>
                  <textarea 
                    className="w-full p-3 text-sm text-muted-foreground italic bg-secondary/5 rounded-md border border-border/50 focus:outline-none focus:ring-1 focus:ring-primary focus:bg-background focus:text-foreground resize-y min-h-[80px] transition-colors"
                    value={summary}
                    onChange={handleSummaryChange}
                    data-testid="chapter-summary-input"
                  />
              </div>

              {onRefineChapter && !isFocusMode && (
                <div className="bg-secondary/5 p-4 rounded-lg border border-border/40">
                  <div className="flex items-center gap-2 mb-4">
                     <Wand2 className="w-4 h-4 text-primary" />
                     <h4 className="text-sm font-semibold text-foreground">AI Tools</h4>
                  </div>
                  <div className="flex flex-col xl:flex-row gap-4 items-end">
                    <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase font-bold text-muted-foreground">Model</label>
                        <select className="w-full bg-background text-xs px-3 py-2 rounded border border-border focus:outline-none focus:border-primary" value={refineSettings.model} onChange={(e) => setRefineSettings(prev => ({ ...prev, model: e.target.value }))} disabled={project.isGenerating}>
                          <option value="gemini-2.5-flash">Flash 2.5 (Fast)</option>
                          <option value="gemini-3-pro-preview">Pro 3.0 (Quality)</option>
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-bold text-muted-foreground">Temp: {refineSettings.temperature}</label>
                        <input type="range" min="0" max="1" step="0.1" value={refineSettings.temperature} onChange={(e) => setRefineSettings(prev => ({ ...prev, temperature: parseFloat(e.target.value) }))} className="w-full h-1.5 bg-secondary rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:bg-primary" disabled={project.isGenerating} />
                        <div className="flex justify-between text-[9px] text-muted-foreground px-0.5"><span>Focused</span><span>Creative</span></div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 w-full xl:w-auto">
                        {/* Refine Button */}
                        <button onClick={() => onRefineChapter(selectedChapter.id, refineSettings, content)} disabled={project.isGenerating || !content} className="flex-1 xl:flex-none flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 rounded-md transition-all disabled:opacity-50 shadow-sm h-[34px]" data-testid="refine-chapter-btn">
                        {project.isGenerating && selectedChapterId === selectedChapter.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />} Refine
                        </button>
                        
                        {/* Continue Button */}
                        {onContinueChapter && (
                           <button onClick={() => onContinueChapter(selectedChapter.id)} disabled={project.isGenerating} className="flex-1 xl:flex-none flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium bg-secondary hover:bg-secondary/80 text-secondary-foreground border border-border rounded-md transition-all disabled:opacity-50 shadow-sm h-[34px]" data-testid="continue-chapter-btn" title="Continue writing from current content">
                           {project.isGenerating && selectedChapterId === selectedChapter.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 text-primary" />} Continue
                           </button>
                        )}
                    </div>
                  </div>
                </div>
              )}

              <div className="flex-1 flex flex-col relative">
                {!isFocusMode && <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block opacity-70">Chapter Content</label>}
                <textarea
                  className={`flex-1 w-full p-4 bg-transparent rounded-md focus:outline-none font-serif text-lg leading-relaxed text-foreground resize-y transition-all ${isFocusMode ? 'border-none ring-0 shadow-none min-h-[80vh] text-xl' : 'border border-border/50 hover:border-border focus:border-primary/50 focus:ring-1 focus:ring-primary/20 shadow-inner min-h-[400px]'}`}
                  value={content}
                  onChange={handleContentChange}
                  placeholder="Start writing or wait for the AI..."
                  data-testid="chapter-content-input"
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground min-h-[300px]">
            <div className="text-center">
               <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-20" />
               <p>Select a chapter or Project Overview.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookViewer;
