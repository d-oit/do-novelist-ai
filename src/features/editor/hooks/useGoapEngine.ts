
import React, { useState, useEffect, useCallback } from 'react';
import { Project, AgentAction, AgentMode, LogEntry, Chapter, ChapterStatus, RefineOptions, WorldState } from '../../../types';
import {
  generateOutline,
  writeChapterContent,
  refineChapterContent,
  analyzeConsistency,
  continueWriting,
  developCharacters,
  buildWorld,
  enhancePlot,
  polishDialogue
} from '../../../lib/ai';

const INITIAL_ACTIONS: AgentAction[] = [
  {
    name: 'create_outline',
    label: 'Architect: Generate Outline',
    description: 'Analyzes the core idea and generates a structural chapter outline based on the hero\'s journey.',
    cost: 150,
    agentMode: AgentMode.SINGLE,
    preconditions: { hasOutline: false },
    effects: { hasOutline: true },
    promptTemplate: '...',
    category: 'generation' as const,
    estimatedDuration: 120,
    requiredPermissions: [],
    tags: ['outline', 'planning']
  },
  {
    name: 'deepen_plot',
    label: 'Architect: Deepen Plot',
    description: 'Analyzes current idea to inject twists, higher stakes, and thematic depth.',
    cost: 100,
    agentMode: AgentMode.SINGLE,
    preconditions: { hasTitle: true },
    effects: {}, // Enhances Idea state
    promptTemplate: '...',
    category: 'analysis' as const,
    estimatedDuration: 90,
    requiredPermissions: [],
    tags: ['plot', 'enhancement']
  },
  {
    name: 'develop_characters',
    label: 'Profiler: Develop Cast',
    description: 'Creates psychological profiles, motivations, and conflicts for main characters.',
    cost: 120,
    agentMode: AgentMode.SINGLE,
    preconditions: { hasTitle: true },
    effects: {},
    promptTemplate: '...',
    category: 'generation' as const,
    estimatedDuration: 100,
    requiredPermissions: [],
    tags: ['characters', 'profiling']
  },
  {
    name: 'build_world',
    label: 'Builder: Expand Setting',
    description: 'Establishes lore, magic systems, technology rules, and key locations.',
    cost: 120,
    agentMode: AgentMode.SINGLE,
    preconditions: { hasTitle: true },
    effects: {},
    promptTemplate: '...',
    category: 'generation' as const,
    estimatedDuration: 110,
    requiredPermissions: [],
    tags: ['worldbuilding', 'setting']
  },
  {
    name: 'write_chapter_parallel',
    label: 'Writers: Parallel Draft',
    description: 'Spawns multiple writing agents to draft pending chapters simultaneously.',
    cost: 50,
    agentMode: 'PARALLEL' as const,
    preconditions: { hasOutline: true },
    effects: { chaptersCompleted: 1 },
    promptTemplate: '...',
    category: 'generation' as const,
    estimatedDuration: 180,
    requiredPermissions: [],
    tags: ['writing', 'parallel']
  },
  {
    name: 'dialogue_doctor',
    label: 'Doctor: Polish Dialogue',
    description: 'Specialized rewrite of the selected chapter focusing on subtext and voice.',
    cost: 80,
    agentMode: AgentMode.HYBRID,
    preconditions: { chaptersCount: 1 }, // At least one chapter to fix
    effects: {},
    promptTemplate: '...',
    category: 'editing' as const,
    estimatedDuration: 75,
    requiredPermissions: [],
    tags: ['dialogue', 'polish']
  },
  {
    name: 'editor_review',
    label: 'Editor: Consistency Check',
    description: 'Analyzes the outline for plot holes and suggests specific rewrites to resolve them.',
    cost: 300,
    agentMode: AgentMode.HYBRID,
    preconditions: { hasOutline: true },
    effects: {},
    promptTemplate: '...',
    category: 'analysis' as const,
    estimatedDuration: 150,
    requiredPermissions: [],
    tags: ['consistency', 'review']
  }
];

export type GoapEngine = {
  logs: LogEntry[];
  availableActions: AgentAction[];
  currentAction: AgentAction | null;
  autoPilot: boolean;
  setAutoPilot: React.Dispatch<React.SetStateAction<boolean>>;
  executeAction: (action: AgentAction) => Promise<void>;
  handleRefineChapter: (chapterId: string, options: RefineOptions, currentContent?: string) => Promise<void>;
  handleContinueChapter: (chapterId: string) => Promise<void>;
  addLog: (agentName: string, message: string, type: LogEntry['type']) => void;
  isActionAvailable: (action: AgentAction) => boolean;
};

export const useGoapEngine = (
  project: Project,
  setProject: React.Dispatch<React.SetStateAction<Project>>,
  setSelectedChapterId: (id: string) => void
): GoapEngine => {
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
      type,
      level: 'info' as const
    }]);
  }, []);

  const executeAction = async (action: AgentAction) => {
    if (project.isGenerating) return;

    setProject(p => ({ ...p, isGenerating: true }));
    setCurrentAction(action);

    try {
      // --- ARCHITECT: OUTLINE ---
      if (action.name === 'create_outline') {
        addLog('Planner', 'Selected Strategy: Architect (Single Agent Mode)', 'thought');
        addLog('Architect', `Analyzing Idea: "${project.idea.substring(0, 100)}..."`, 'info');

        const result = await generateOutline(project.idea, project.style);

        addLog('Architect', `Outline generated with ${result.chapters.length} chapters.`, 'success');

        const newChapters: Chapter[] = result.chapters.map((c: any) => ({
          id: `${project.id}_ch_${c.orderIndex}`,
          orderIndex: c.orderIndex,
          title: c.title,
          summary: c.summary,
          content: '',
          status: ChapterStatus.PENDING,
          illustration: '',
          wordCount: 0,
          characterCount: 0,
          estimatedReadingTime: 0,
          tags: [],
          notes: '',
          createdAt: new Date(),
          updatedAt: new Date()
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
      // --- ARCHITECT: PLOT ---
      else if (action.name === 'deepen_plot') {
        addLog('Planner', 'Tasking Narrative Structuralist to review stakes...', 'thought');
        const improvements = await enhancePlot(project.idea, project.style);
        setProject(prev => ({ ...prev, idea: prev.idea + "\n\n--- PLOT ENHANCEMENTS ---\n" + improvements }));
        addLog('Architect', 'Plot beats refined and appended to Project Notes.', 'success');
      }
      // --- PROFILER: CHARACTERS ---
      else if (action.name === 'develop_characters') {
        addLog('Planner', 'Spawning Psychologist Agent for Character Profiling...', 'thought');
        const cast = await developCharacters(project.idea, project.style);
        setProject(prev => ({ ...prev, idea: prev.idea + "\n\n--- CHARACTER PROFILES ---\n" + cast }));
        addLog('Profiler', 'Character cast list generated and saved.', 'success');
      }
      // --- BUILDER: WORLD ---
      else if (action.name === 'build_world') {
        addLog('Planner', 'Consulting Historian Agent for World Building...', 'thought');
        const lore = await buildWorld(project.idea, project.style);
        setProject(prev => ({ ...prev, idea: prev.idea + "\n\n--- WORLD BIBLE ---\n" + lore }));
        addLog('Builder', 'Series Bible expanded with setting details.', 'success');
      }
      // --- WRITERS: DRAFTING ---
      else if (action.name === 'write_chapter_parallel') {
        // Select up to 3 pending chapters
        const pendingChapters = project.chapters
          .filter(c => c.status === ChapterStatus.PENDING)
          .slice(0, 3);

        if (pendingChapters.length === 0) {
          addLog('Planner', 'No pending chapters found.', 'warning');
          setProject(p => ({ ...p, isGenerating: false }));
          setCurrentAction(null);
          return;
        }

        addLog('Planner', `Delegating ${pendingChapters.length} chapters to Writer Agents (Parallel Mode).`, 'thought');

        // Mark selected as drafting
        setProject(prev => ({
          ...prev,
          chapters: prev.chapters.map(c =>
            pendingChapters.some(pc => pc.id === c.id)
              ? { ...c, status: ChapterStatus.DRAFTING }
              : c
          )
        }));

        // Execute in parallel
        const results = await Promise.all(pendingChapters.map(async (chapter) => {
          addLog('Writer', `Drafting "${chapter.title}"...`, 'info');
          const prevIndex = chapter.orderIndex - 2;
          const prevSummary = prevIndex >= 0 ? project.chapters[prevIndex]?.summary : undefined;

          try {
            const content = await writeChapterContent(chapter.title, chapter.summary, project.style, prevSummary);
            return { id: chapter.id, content, success: true };
          } catch (e) {
            addLog('Writer', `Failed to draft "${chapter.title}"`, 'error');
            return { id: chapter.id, content: '', success: false };
          }
        }));

        const successCount = results.filter(r => r.success).length;
        addLog('Writer', `Batch complete. ${successCount}/${pendingChapters.length} chapters written.`, 'success');

        setProject(prev => ({
          ...prev,
          chapters: prev.chapters.map(c => {
            const result = results.find(r => r.id === c.id);
            if (result && result.success) {
              return { ...c, content: result.content, status: ChapterStatus.COMPLETE };
            }
            // If failed, revert to PENDING so it can be retried
            if (result && !result.success) {
              return { ...c, status: ChapterStatus.PENDING };
            }
            return c;
          }),
          worldState: { ...prev.worldState, chaptersCompleted: prev.worldState.chaptersCompleted + successCount }
        }));
      }
      // --- DOCTOR: DIALOGUE ---
      else if (action.name === 'dialogue_doctor') {
        // Find a drafting or complete chapter to polish
        const chapterToFix = project.chapters.find(c => c.content.length > 0);
        if (!chapterToFix) {
          addLog('Planner', 'No content available to polish dialogue.', 'warning');
          return;
        }

        addLog('Planner', `Assigning Dialogue Coach to Chapter ${chapterToFix.orderIndex}...`, 'thought');
        setSelectedChapterId(chapterToFix.id);
        const polished = await polishDialogue(chapterToFix.content, project.style);

        setProject(prev => ({
          ...prev,
          chapters: prev.chapters.map(c => c.id === chapterToFix.id ? { ...c, content: polished } : c)
        }));
        addLog('Doctor', 'Dialogue polish complete. Script tightened.', 'success');
      }
      // --- EDITOR: REVIEW ---
      else if (action.name === 'editor_review') {
        addLog('Planner', 'Selected Strategy: Editor (Consistency Check & Fixer)', 'thought');
        addLog('Editor', 'Analyzing outline for inconsistencies...', 'info');
        const analysis = await analyzeConsistency(project.chapters, project.style);
        addLog('Editor', `Review Complete. Suggestions:\n${analysis}`, 'success');
      }
    } catch (err) {
      addLog('System', 'Action Failed: ' + (err as Error).message, 'error');
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

  // Autopilot Loop with cleanup
  useEffect(() => {
    const controller = new AbortController();

    if (!autoPilot || project.isGenerating) return;

    const timer = setTimeout(() => {
      // Check if aborted before executing
      if (controller.signal.aborted) return;

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

    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [autoPilot, project.isGenerating, project.worldState, availableActions, executeAction, addLog, setAutoPilot]);

  const isActionAvailable = (action: AgentAction) => {
    // 1. Check if Action is explicitly disabled or specialized logic
    if (action.name === 'write_chapter_parallel') {
      // Don't draft if all chapters are done or no chapters exist
      if (project.worldState.chaptersCount === 0) return false;
      if (project.worldState.chaptersCompleted >= project.worldState.chaptersCount) return false;
    }

    // 2. Dynamic Precondition Checker
    // Iterates through every precondition defined in the action
    const preconditionsMet = Object.entries(action.preconditions).every(([key, requiredValue]) => {
      const currentValue = project.worldState[key as keyof WorldState];

      // Boolean check (e.g., hasOutline: true)
      if (typeof requiredValue === 'boolean') {
        return currentValue === requiredValue;
      }

      // Numeric check (e.g., chaptersCompleted: 1) - treated as "at least"
      if (typeof requiredValue === 'number' && typeof currentValue === 'number') {
        return currentValue >= requiredValue;
      }

      return false;
    });

    return preconditionsMet;
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
