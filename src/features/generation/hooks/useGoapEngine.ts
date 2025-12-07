import type { Project, AgentAction, LogEntry, Chapter } from '@shared/types';
import { AgentMode, ChapterStatus } from '@shared/types';
import { createChapter } from '@shared/utils';
import type React from 'react';
import { useState, useEffect, useCallback, useMemo } from 'react';

import {
  generateOutline,
  writeChapterContent,
  refineChapterContent,
  analyzeConsistency,
  continueWriting,
} from '@/lib/ai';
import type { RefineOptions } from '@/shared/types';

const INITIAL_ACTIONS: AgentAction[] = [
  {
    name: 'create_outline',
    label: 'Architect: Generate Outline',
    description:
      "Analyzes the core idea and generates a structural chapter outline based on the hero's journey.",
    cost: 150,
    agentMode: AgentMode.SINGLE,
    preconditions: { hasOutline: false },
    effects: { hasOutline: true },
    promptTemplate: '...',
    category: 'generation',
    estimatedDuration: 30000,
    requiredPermissions: ['ai_generation'],
    tags: ['outline', 'structure'],
  },
  {
    name: 'write_chapter_parallel',
    label: 'Writers: Parallel Draft',
    description: 'Spawns multiple writing agents to draft pending chapters simultaneously.',
    cost: 50,
    agentMode: AgentMode.PARALLEL,
    preconditions: { hasOutline: true },
    effects: { chaptersCompleted: 1 },
    promptTemplate: '...',
    category: 'generation',
    estimatedDuration: 60000,
    requiredPermissions: ['ai_generation'],
    tags: ['draft', 'writing'],
  },
  {
    name: 'editor_review',
    label: 'Editor: Consistency Check',
    description: 'Reads executed chapters and flags inconsistencies.',
    cost: 300,
    agentMode: AgentMode.HYBRID,
    preconditions: { hasOutline: true },
    effects: {},
    promptTemplate: '...',
    category: 'analysis',
    estimatedDuration: 45000,
    requiredPermissions: ['ai_analysis'],
    tags: ['review', 'consistency'],
  },
];

export const useGoapEngine = (
  project: Project,
  setProject: React.Dispatch<React.SetStateAction<Project>>,
  setSelectedChapterId: (id: string) => void,
): {
  logs: LogEntry[];
  availableActions: AgentAction[];
  currentAction: AgentAction | null;
  autoPilot: boolean;
  setAutoPilot: React.Dispatch<React.SetStateAction<boolean>>;
  executeAction: (action: AgentAction) => Promise<void>;
  handleRefineChapter: (
    chapterId: string,
    options: RefineOptions,
    currentContent?: string,
  ) => Promise<void>;
  handleContinueChapter: (chapterId: string) => Promise<void>;
  addLog: (agentName: string, message: string, type?: LogEntry['type']) => void;
  isActionAvailable: (action: AgentAction) => boolean;
} => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const availableActions = useMemo(() => INITIAL_ACTIONS, []);
  const [currentAction, setCurrentAction] = useState<AgentAction | null>(null);
  const [autoPilot, setAutoPilot] = useState(false);

  const addLog = useCallback(
    (agentName: string, message: string, type: LogEntry['type'] = 'info'): void => {
      setLogs(prev => [
        ...prev,
        {
          id: Math.random().toString(36).substring(7),
          timestamp: new Date(),
          agentName,
          message,
          type,
        },
      ]);
    },
    [],
  );

  const executeAction = useCallback(
    async (action: AgentAction): Promise<void> => {
      if (project.isGenerating) return;

      setProject(p => ({ ...p, isGenerating: true }));
      setCurrentAction(action);

      try {
        if (action.name === 'create_outline') {
          addLog('Planner', 'Selected Strategy: Architect (Single Agent Mode)', 'thought');
          addLog('Architect', `Analyzing Idea: "${project.idea.substring(0, 100)}..."`, 'info');

          const result = await generateOutline(project.idea, project.style);

          addLog(
            'Architect',
            `Outline generated with ${result.chapters.length} chapters.`,
            'success',
          );

          // FIX: Unique Chapter IDs based on Project ID to prevent collisions in DB
          const newChapters: Chapter[] = result.chapters.map((c: Partial<Chapter>) =>
            createChapter({
              id: `${project.id}_ch_${c.orderIndex ?? 0}`,
              orderIndex: c.orderIndex ?? 0,
              title: c.title ?? '',
              summary: c.summary ?? '',
              status: ChapterStatus.PENDING,
            }),
          );

          setProject(prev => ({
            ...prev,
            title: result.title,
            chapters: newChapters,
            worldState: {
              ...prev.worldState,
              hasOutline: true,
              chaptersCount: newChapters.length,
            },
          }));
        } else if (action.name === 'write_chapter_parallel') {
          const pendingChapter = project.chapters.find(c => c.status === ChapterStatus.PENDING);
          if (!pendingChapter) {
            addLog('Planner', 'No pending chapters found.', 'warning');
            setProject(p => ({ ...p, isGenerating: false }));
            setCurrentAction(null);
            return;
          }

          addLog(
            'Planner',
            `Delegating Chapter ${pendingChapter.orderIndex} to Writer Agent.`,
            'thought',
          );
          setProject(prev => ({
            ...prev,
            chapters: prev.chapters.map(c =>
              c.id === pendingChapter.id ? { ...c, status: ChapterStatus.DRAFTING } : c,
            ),
          }));
          setSelectedChapterId(pendingChapter.id);
          addLog('Writer', `Drafting "${pendingChapter.title}"...`, 'info');

          const prevIndex = pendingChapter.orderIndex - 2;
          const prevSummary = prevIndex >= 0 ? project.chapters[prevIndex]?.summary : undefined;
          const content = await writeChapterContent(
            pendingChapter.title,
            pendingChapter.summary,
            project.style,
            prevSummary,
          );

          addLog(
            'Writer',
            `Chapter ${pendingChapter.orderIndex} completed (${content.length} chars).`,
            'success',
          );
          setProject(prev => ({
            ...prev,
            chapters: prev.chapters.map(c =>
              c.id === pendingChapter.id ? { ...c, content, status: ChapterStatus.COMPLETE } : c,
            ),
            worldState: {
              ...prev.worldState,
              chaptersCompleted: prev.worldState.chaptersCompleted + 1,
            },
          }));
        } else if (action.name === 'editor_review') {
          addLog('Planner', 'Selected Strategy: Editor (Consistency Check)', 'thought');
          const analysis = await analyzeConsistency(project.chapters, project.style);
          addLog('Editor', `Analysis Report:\n${analysis}`, 'success');
        }
      } catch (err) {
        addLog('System', `Action Failed: ${(err as Error).message}`, 'error');
      } finally {
        setProject(p => ({ ...p, isGenerating: false }));
        setCurrentAction(null);
      }
    },
    [project, setProject, setSelectedChapterId, addLog],
  );

  const handleRefineChapter = async (
    chapterId: string,
    options: RefineOptions,
    currentContent?: string,
  ): Promise<void> => {
    if (project.isGenerating) return;
    const chapter = project.chapters.find(c => c.id === chapterId);
    const contentToRefine = currentContent ?? chapter?.content;

    if (!chapter || contentToRefine == null) return;
    setProject(p => ({ ...p, isGenerating: true }));
    addLog('Editor', `Starting refinement for "${chapter.title}"...`, 'info');

    try {
      const refinedContent = await refineChapterContent(
        contentToRefine,
        chapter.summary,
        project.style,
        options,
      );
      setProject(prev => ({
        ...prev,
        chapters: prev.chapters.map(c =>
          c.id === chapterId ? { ...c, content: refinedContent } : c,
        ),
      }));
      addLog('Editor', `Refinement complete.`, 'success');
    } catch (err) {
      addLog('Editor', `Refinement failed: ${(err as Error).message}`, 'error');
    } finally {
      setProject(p => ({ ...p, isGenerating: false }));
    }
  };

  const handleContinueChapter = async (chapterId: string): Promise<void> => {
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
        chapters: prev.chapters.map(c =>
          c.id === chapterId
            ? {
                ...c,
                content: updatedContent,
                status: ChapterStatus.DRAFTING,
              }
            : c,
        ),
      }));
      addLog(
        'Writer',
        `Added ${newContent.length} chars to Chapter ${chapter.orderIndex}.`,
        'success',
      );
    } catch (err) {
      addLog('Writer', `Failed to continue chapter: ${(err as Error).message}`, 'error');
    } finally {
      setProject(p => ({ ...p, isGenerating: false }));
    }
  };

  // Autopilot Loop
  useEffect((): (() => void) => {
    if (!autoPilot || project.isGenerating) return () => {};
    const timer = setTimeout(() => {
      if (!project.worldState.hasOutline) {
        const outlineAction = availableActions.find(a => a.name === 'create_outline');
        if (outlineAction) void executeAction(outlineAction);
      } else if (project.worldState.chaptersCompleted < project.worldState.chaptersCount) {
        const writeAction = availableActions.find(a => a.name === 'write_chapter_parallel');
        if (writeAction) void executeAction(writeAction);
      } else {
        addLog('Planner', 'Goal Reached: Book Draft Complete.', 'success');
        setAutoPilot(false);
      }
    }, 1500);
    return () => clearTimeout(timer);
  }, [
    autoPilot,
    project.isGenerating,
    project.worldState,
    availableActions,
    addLog,
    executeAction,
  ]);

  const isActionAvailable = (action: AgentAction): boolean => {
    if (
      action.preconditions.hasOutline !== undefined &&
      action.preconditions.hasOutline !== project.worldState.hasOutline
    ) {
      return false;
    }
    if (
      action.name === 'write_chapter_parallel' &&
      project.worldState.chaptersCompleted >= project.worldState.chaptersCount &&
      project.worldState.chaptersCount > 0
    ) {
      return false;
    }
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
    isActionAvailable,
  };
};
