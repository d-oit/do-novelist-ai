/**
 * Dialogue Feature Public API
 */

// Components
export {
  DialogueDashboard,
  DialogueEditor,
  ConversationFlow,
  CharacterVoiceCard,
} from './components';

// Hooks
export { useDialogue } from './hooks';

// Services
export {
  extractDialogueLines,
  extractActionBeats,
  linkCharacterIds,
  groupIntoConversations,
  analyzeDialogue,
  buildVoiceProfile,
} from './services';

// Types
export type {
  DialogueLine,
  DialogueTag,
  CharacterVoiceProfile,
  SpeechPattern,
  DialogueAnalysisResult,
  DialogueIssue,
  Conversation,
  ConversationTurn,
  DialogueSuggestion,
  DialogueFilters,
  DialogueEditorSettings,
} from './types';
