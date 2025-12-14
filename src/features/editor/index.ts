/**
 * Editor Feature
 *
 * Manages content editing, version control, image generation, and AI-powered
 * refinement for the Novelist GOAP engine.
 */

// Types
export type {
  RefineOptions,
  EditorContent,
  EditorUIState,
  EditorState,
  ImageGenerationOptions,
  GeneratedImage,
  EditorAction,
  DraftMetadata,
  SavedDraft,
} from './types';

// Services
export { editorService } from './services/editorService';

// Hooks
export { useGoapEngine } from './hooks/useGoapEngine';
export { useEditorState } from './hooks/useEditorState';

// Components
export { default as BookViewer } from './components/BookViewer';
export { default as ChapterList } from './components/ChapterList';
export { default as ChapterEditor } from './components/ChapterEditor';
export { default as ProjectOverview } from './components/ProjectOverview';
export { default as CoverGenerator } from './components/CoverGenerator';
export { default as PublishPanel } from './components/PublishPanel';
