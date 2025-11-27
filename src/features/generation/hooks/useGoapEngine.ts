import React, { useState, useEffect, useCallback } from 'react';
import { Project, AgentAction, AgentMode, LogEntry, Chapter, ChapterStatus, RefineOptions } from '@shared/types';
import { generateOutline, writeChapterContent, refineChapterContent, analyzeConsistency, continueWriting } from '../services/geminiService';

const INITIAL_ACTIONS: AgentAction[] = [
  {
    name: 'create_outline',
    label: 'Architect: Generate Outline',
    description: 'Analyzes the core idea and generates a structural chapter outline based on the hero\'s journey.',
    cost: 150,
    agentMode: AgentMode.SINGLE,
    preconditions: { hasOutline: false },
    effects: { hasOutline: true },
    promptTemplate: '...'
  },
  {
    name: 'write_chapter_parallel',
    label: 'Writers: Parallel Draft',
    description: 'Spawns multiple writing agents to draft pending chapters simultaneously.',
    cost: 50,
    agentMode: AgentMode.PARALLEL,
    preconditions: { hasOutline: true },
    effects: { chaptersCompleted: 1 },
    promptTemplate: '...'
  },
  {
    name: 'editor_review',
    label: 'Editor: Consistency Check',
    description: 'Reads executed chapters and flags inconsistencies.',
    cost: 300,
    agentMode: AgentMode.HYBRID,
    preconditions: { hasOutline: true },
    effects: { },
    promptTemplate: '...'
  }
];

export const useGoapEngine = (
  project: Project,
  setProject: React.Dispatch<React.SetStateAction<Project>>,
  setSelectedChapterId: (id: string) => void
) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [availableActions] = useState<AgentAction[]>(INITIAL_ACTIONS);
  const [currentAction, setCurrentAction] = useState<AgentAction | null>(null);
  const [autoPilot, setAutoPilot] = useState(false);

  const addLog = useCallback((agentName: string, message: string, type: LogEntry['type'] = 'info') => {
    setLogs(prev => [...prev, {
      id: Math.random().toString(36).substring(7),
      timestamp: new Date(),
      agentName,
      message,
      type
    }]);
  }, []);

  const executeAction = async (action: AgentAction) => {
    if (project.isGenerating) return;

    setProject(p => ({ ...p, isGenerating: true }));
    setCurrentAction(action);

    try {
      if (action.name === 'create_outline') {
        addLog('Planner', 'Selected Strategy: Architect (Single Agent Mode)', 'thought');
        addLog('Architect', `Analyzing Idea: "${project.idea.substring(0, 100)}..."`, 'info');

        const result = await generateOutline(project.idea, project.style);

        addLog('Architect', `Outline generated with ${result.chapters.length} chapters.`, 'success');

        // FIX: Unique Chapter IDs based on Project ID to prevent collisions in DB
        const newChapters: Chapter[] = result.chapters.map((c: any) => ({
          id: `${project.id}_ch_${c.orderIndex}`,
          orderIndex: c.orderIndex,
          title: c.title,
          summary: c.summary,
          content: '',
          status: ChapterStatus.PENDING
        }));

        setProject(prev => ({
          ...prev,
          title: result.title,
          chapters: newChapters,
          worldState: {
            ...prev.worldState,
            hasOutline: true,
            chaptersCount: newChapters.length
          }
        }));
      }
      else if (action.name === 'write_chapter_parallel') {
        const pendingChapter = project.chapters.find(c => c.status === ChapterStatus.PENDING);
        if (!pendingChapter) {
          addLog('Planner', 'No pending chapters found.', 'warning');
          setProject(p => ({ ...p, isGenerating: false }));
          setCurrentAction(null);
          return;
        }

        addLog('Planner', `Delegating Chapter ${pendingChapter.orderIndex} to Writer Agent.`, 'thought');
        setProject(prev => ({
          ...prev,
          chapters: prev.chapters.map(c => c.id === pendingChapter.id ? { ...c, status: ChapterStatus.DRAFTING } : c)
        }));
        setSelectedChapterId(pendingChapter.id);
        addLog('Writer', `Drafting "${pendingChapter.title}"...`, 'info');

        const prevIndex = pendingChapter.orderIndex - 2;
        const prevSummary = prevIndex >= 0 ? project.chapters[prevIndex]?.summary : undefined;
        const content = await writeChapterContent(pendingChapter.title, pendingChapter.summary, project.style, prevSummary);

        addLog('Writer', `Chapter ${pendingChapter.orderIndex} completed (${content.length} chars).`, 'success');
        setProject(prev => ({
          ...prev,
          chapters: prev.chapters.map(c => c.id === pendingChapter.id ? { ...c, content, status: ChapterStatus.COMPLETE } : c),
          worldState: { ...prev.worldState, chaptersCompleted: prev.worldState.chaptersCompleted + 1 }
        }));
      }
      else if (action.name === 'editor_review') {
         addLog('Planner', 'Selected Strategy: Editor (Consistency Check)', 'thought');
         const analysis = await analyzeConsistency(project.chapters, project.style);
         addLog('Editor', `Analysis Report:\n${analysis}`, 'success');
      }
    } catch (err) {
      addLog('System', `Action Failed: ${  (err as Error).message}`, 'error');
    } finally {
      setProject(p => ({ ...p, isGenerating: false }));
      setCurrentAction(null);
    }
  };

  const handleRefineChapter = async (chapterId: string, options: RefineOptions, currentContent?: string) => {
    if (project.isGenerating) return;
    const chapter = project.chapters.find(c => c.id === chapterId);
    const contentToRefine = currentContent !== undefined ? currentContent : chapter?.content;

    if (!chapter || !contentToRefine) return;
    setProject(p => ({ ...p, isGenerating: true }));
    addLog('Editor', `Starting refinement for "${chapter.title}"...`, 'info');

    try {
      const refinedContent = await refineChapterContent(contentToRefine, chapter.summary, project.style, options);
      setProject(prev => ({
        ...prev,
        chapters: prev.chapters.map(c => c.id === chapterId ? { ...c, content: refinedContent } : c)
      }));
      addLog('Editor', `Refinement complete.`, 'success');
    } catch (err) {
      addLog('Editor', `Refinement failed: ${(err as Error).message}`, 'error');
    } finally {
      setProject(p => ({ ...p, isGenerating: false }));
    }
  };

  const handleContinueChapter = async (chapterId: string) => {
    if (project.isGenerating) return;
    const chapter = project.chapters.find(c => c.id === chapterId);
    if (!chapter) return;

    setProject(p => ({ ...p, isGenerating: true }));
    addLog('Writer', `Continuing story for "${chapter.title}"...`, 'info');

    try {
      const newContent = await continueWriting(chapter.content, chapter.summary, project.style);

      // Append with a double newline if content exists, otherwise just the content
      const updatedContent = chapter.content ? `${chapter.content}\n\n${newContent}` : newContent;

      setProject(prev => ({
        ...prev,
        chapters: prev.chapters.map(c => c.id === chapterId ? {
            ...c,
            content: updatedContent,
            status: ChapterStatus.DRAFTING
        } : c)
      }));
      addLog('Writer', `Added ${newContent.length} chars to Chapter ${chapter.orderIndex}.`, 'success');
    } catch (err) {
      addLog('Writer', `Failed to continue chapter: ${(err as Error).message}`, 'error');
    } finally {
      setProject(p => ({ ...p, isGenerating: false }));
    }
  };

  // Autopilot Loop
  useEffect(() => {
    if (!autoPilot || project.isGenerating) return;
    const timer = setTimeout(() => {
      if (!project.worldState.hasOutline) {
        const outlineAction = availableActions.find(a => a.name === 'create_outline');
        if (outlineAction) executeAction(outlineAction);
      } else if (project.worldState.chaptersCompleted < project.worldState.chaptersCount) {
        const writeAction = availableActions.find(a => a.name === 'write_chapter_parallel');
        if (writeAction) executeAction(writeAction);
      } else {
        addLog('Planner', 'Goal Reached: Book Draft Complete.', 'success');
        setAutoPilot(false);
      }
    }, 1500);
    return () => clearTimeout(timer);
  }, [autoPilot, project.isGenerating, project.worldState, availableActions]);

  const isActionAvailable = (action: AgentAction) => {
    if (action.preconditions.hasOutline !== undefined && action.preconditions.hasOutline !== project.worldState.hasOutline) return false;
    if (action.name === 'write_chapter_parallel' && project.worldState.chaptersCompleted >= project.worldState.chaptersCount && project.worldState.chaptersCount > 0) return false;
    return true;
  };

  return {
    logs,
    availableActions,
    currentAction,
    autoPilot,
    setAutoPilot,
    executeAction,
    handleRefineChapter,
    handleContinueChapter,
    addLog,
    isActionAvailable
  };
};
