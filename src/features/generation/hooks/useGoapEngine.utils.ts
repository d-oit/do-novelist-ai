import { Project, AgentAction, Chapter, ChapterStatus, ProcessedAction, ActionResult } from '@shared/types';
import {
  analyzeConsistency,
  generateOutline,
  writeChapterContent,
} from '../services/geminiService';

/**
 * Validates if an action can be executed based on project state
 * @param action - The action to validate
 * @param project - Current project state
 * @param addLog - Logging function for warnings
 * @returns True if action is valid and can proceed
 */
export function validateAction(
  action: AgentAction,
  project: Project,
  addLog?: (agentName: string, message: string, type?: 'info' | 'success' | 'warning' | 'error' | 'thought' | 'debug') => void
): boolean {
  // Check if project is already generating - prevent concurrent actions
  if (project.isGenerating) {
    return false;
  }

  // For write_chapter_parallel action, verify there are pending chapters
  if (action.name === 'write_chapter_parallel') {
    const pendingChapters = project.chapters.filter(c => c.status === ChapterStatus.PENDING);
    if (pendingChapters.length === 0) {
      if (addLog) {
        addLog('Planner', 'No pending chapters found.', 'warning');
      }
      return false;
    }
  }

  return true;
}

/**
 * Preprocesses action data before execution
 * @param action - The action to preprocess
 * @param project - Current project state
 * @param setSelectedChapterId - Callback to set selected chapter
 * @returns Processed action data
 */
export function preprocessAction(
  action: AgentAction,
  project: Project,
  setSelectedChapterId: (id: string) => void
): ProcessedAction {
  const processedAction: ProcessedAction = {
    action,
    project,
  };

  if (action.name === 'write_chapter_parallel') {
    const pendingChapters = project.chapters.filter(c => c.status === ChapterStatus.PENDING);
    processedAction.pendingChapters = pendingChapters;

    // Set the first pending chapter as selected for UI focus
    if (pendingChapters.length > 0) {
      setSelectedChapterId(pendingChapters[0].id);
    }
  }

  return processedAction;
}

/**
 * Executes the core logic for the action
 * @param processedAction - Preprocessed action data
 * @param addLog - Logging function
 * @returns Action execution result
 */
export async function executeActionLogic(
  processedAction: ProcessedAction,
  addLog: (agentName: string, message: string, type?: 'info' | 'success' | 'warning' | 'error' | 'thought' | 'debug') => void
): Promise<ActionResult> {
  const { action, project, pendingChapters } = processedAction;

  try {
    if (action.name === 'create_outline') {
      return await executeCreateOutline(project, addLog);
    } else if (action.name === 'write_chapter_parallel' && pendingChapters) {
      return await executeWriteChaptersParallel(pendingChapters, project, addLog);
    } else if (action.name === 'editor_review') {
      return await executeEditorReview(project, addLog);
    }

    return { success: false, error: new Error(`Unknown action: ${action.name}`) };
  } catch (error) {
    return { success: false, error: error as Error };
  }
}

/**
 * Post-processes action results and updates project state
 * @param processedAction - Preprocessed action data
 * @param actionResult - Result from action execution
 * @param setProject - Project state setter
 */
export function postprocessAction(
  processedAction: ProcessedAction,
  actionResult: ActionResult,
  setProject: React.Dispatch<React.SetStateAction<Project>>
): void {
  const { action, project, pendingChapters } = processedAction;

  if (!actionResult.success) {
    return;
  }

  if (action.name === 'create_outline') {
    handleCreateOutlinePostprocess(actionResult, project, setProject);
  } else if (action.name === 'write_chapter_parallel' && pendingChapters) {
    handleWriteChaptersPostprocess(actionResult, project, setProject, pendingChapters);
  }
  // editor_review doesn't require postprocessing
}

/**
 * Logs action execution results
 * @param action - The executed action
 * @param actionResult - The result to log
 * @param addLog - Logging function
 */
export function logActionResult(
  action: AgentAction,
  actionResult: ActionResult,
  addLog: (agentName: string, message: string, type?: 'info' | 'success' | 'warning' | 'error' | 'thought' | 'debug') => void
): void {
  if (!actionResult.success && actionResult.error) {
    addLog('System', `Action Failed: ${actionResult.error.message}`, 'error');
  }
}

/**
 * Execute create_outline action
 */
async function executeCreateOutline(
  project: Project,
  addLog: (agentName: string, message: string, type?: 'info' | 'success' | 'warning' | 'error' | 'thought' | 'debug') => void
): Promise<ActionResult> {
  addLog('Planner', 'Selected Strategy: Architect (Single Agent Mode)', 'thought');
  addLog('Architect', `Analyzing Idea: "${project.idea.substring(0, 100)}..."`, 'info');

  const result = await generateOutline(project.idea, project.style);

  addLog('Architect', `Outline generated with ${result.chapters.length} chapters.`, 'success');

  return { success: true, data: result };
}

/**
 * Execute write_chapter_parallel action
 */
async function executeWriteChaptersParallel(
  pendingChapters: Chapter[],
  project: Project,
  addLog: (agentName: string, message: string, type?: 'info' | 'success' | 'warning' | 'error' | 'thought' | 'debug') => void
): Promise<ActionResult> {
  addLog(
    'Planner',
    `Delegating ${pendingChapters.length} chapters to Writer Agents for parallel execution.`,
    'thought'
  );

  // Create promises for concurrent chapter writing
  const chapterPromises = pendingChapters.map(async (chapter, index) => {
    try {
      addLog(`Writer ${index + 1}`, `Drafting "${chapter.title}"...`, 'info');

      const prevIndex = chapter.orderIndex - 2;
      const prevChapter =
        prevIndex >= 0 && prevIndex < project.chapters.length
          ? project.chapters[prevIndex]
          : undefined;
      const prevSummary = prevChapter?.summary;

      const content = await writeChapterContent(chapter.title, chapter.summary, project.style, prevSummary);

      addLog(
        `Writer ${index + 1}`,
        `Chapter ${chapter.orderIndex} completed (${content.length} chars).`,
        'success'
      );

      return { chapterId: chapter.id, content, success: true };
    } catch (error) {
      addLog(
        `Writer ${index + 1}`,
        `Chapter ${chapter.orderIndex} failed: ${(error as Error).message}`,
        'error'
      );
      return { chapterId: chapter.id, content: '', success: false, error: error as Error };
    }
  });

  // Execute all promises concurrently
  const results = await Promise.allSettled(chapterPromises);

  return { success: true, data: results };
}

/**
 * Execute editor_review action
 */
async function executeEditorReview(
  project: Project,
  addLog: (agentName: string, message: string, type?: 'info' | 'success' | 'warning' | 'error' | 'thought' | 'debug') => void
): Promise<ActionResult> {
  addLog('Planner', 'Selected Strategy: Editor (Consistency Check)', 'thought');
  const analysis = await analyzeConsistency(project.chapters, project.style);
  addLog('Editor', `Analysis Report:\n${analysis}`, 'success');

  return { success: true, data: analysis };
}

/**
 * Handle postprocessing for create_outline action
 */
function handleCreateOutlinePostprocess(
  actionResult: ActionResult,
  project: Project,
  setProject: React.Dispatch<React.SetStateAction<Project>>
): void {
  const result = actionResult.data;

  // FIX: Unique Chapter IDs based on Project ID to prevent collisions in DB
  const newChapters: Chapter[] = result.chapters.map((c: any) => ({
    id: `${project.id}_ch_${c.orderIndex}`,
    orderIndex: c.orderIndex,
    title: c.title,
    summary: c.summary,
    content: '',
    status: ChapterStatus.PENDING,
  }));

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
}

/**
 * Handle postprocessing for write_chapter_parallel action
 */
function handleWriteChaptersPostprocess(
  actionResult: ActionResult,
  project: Project,
  setProject: React.Dispatch<React.SetStateAction<Project>>,
  pendingChapters: Chapter[]
): void {
  const results = actionResult.data;

  // Process results and update project state
  const successfulChapters = results
    .filter(
      (
        result
      ): result is PromiseFulfilledResult<{
        chapterId: string;
        content: string;
        success: true;
      }> => result.status === 'fulfilled' && result.value.success
    )
    .map(result => result.value);

  const failedChapters = results
    .filter(
      (
        result
      ): result is PromiseFulfilledResult<{
        chapterId: string;
        content: string;
        success: false;
        error: Error;
      }> => result.status === 'fulfilled' && !result.value.success
    )
    .map(result => result.value);

  // Update project with successful chapters
  setProject(prev => ({
    ...prev,
    chapters: prev.chapters.map(c => {
      const successfulResult = successfulChapters.find(r => r.chapterId === c.id);
      if (successfulResult) {
        return { ...c, content: successfulResult.content, status: ChapterStatus.COMPLETE };
      }
      // Reset failed chapters back to pending
      const failedResult = failedChapters.find(r => r.chapterId === c.id);
      if (failedResult) {
        return { ...c, status: ChapterStatus.PENDING };
      }
      return c;
    }),
    worldState: {
      ...prev.worldState,
      chaptersCompleted: prev.worldState.chaptersCompleted + successfulChapters.length,
    },
  }));

  // Log summary
  const totalProcessed = successfulChapters.length + failedChapters.length;
  // Note: The addLog function needs to be called from the main hook context
  // This is a limitation - we'll return the summary for logging
}

/**
 * Creates a summary object for logging after action completion
 * @param action - The completed action
 * @param pendingChapters - Chapters that were processed
 * @param actionResult - The action result
 * @returns Summary object for logging
 */
export function createActionSummary(
  action: AgentAction,
  pendingChapters: Chapter[],
  actionResult: ActionResult
): { message: string; type: 'success' | 'warning' } {
  if (action.name === 'write_chapter_parallel' && actionResult.data) {
    const results = actionResult.data;
    const successfulChapters = results.filter(
      (r: PromiseFulfilledResult<any>) => r.status === 'fulfilled' && r.value.success
    ).length;
    const totalProcessed = results.length;

    return {
      message: `Parallel writing complete: ${successfulChapters}/${totalProcessed} chapters successful.`,
      type: successfulChapters === totalProcessed ? 'success' : 'warning',
    };
  }

  return { message: 'Action completed.', type: 'success' };
}
