import { useReducer, useCallback } from 'react';

import { RefineOptions } from '../../../types';

// State Interface
interface EditorState {
  // Content State
  summary: string;
  content: string;
  lastSavedSummary: string;
  lastSavedContent: string;
  hasUnsavedChanges: boolean;

  // UI State
  isSidebarOpen: boolean;
  isFocusMode: boolean;
  isGeneratingImage: boolean;

  // Feature State
  showVersionHistory: boolean;
  showVersionComparison: boolean;
  comparisonVersions: [any, any] | null;
  showAnalytics: boolean;

  // Settings
  refineSettings: RefineOptions;
}

// Action Types
type EditorAction =
  | { type: 'SET_CHAPTER'; payload: { summary: string; content: string } }
  | { type: 'UPDATE_SUMMARY'; payload: string }
  | { type: 'UPDATE_CONTENT'; payload: string }
  | { type: 'MARK_SAVED' }
  | { type: 'TOGGLE_SIDEBAR' }
  | { type: 'TOGGLE_FOCUS_MODE' }
  | { type: 'SET_GENERATING_IMAGE'; payload: boolean }
  | { type: 'TOGGLE_VERSION_HISTORY'; payload: boolean }
  | { type: 'TOGGLE_ANALYTICS'; payload: boolean }
  | { type: 'SHOW_COMPARISON'; payload: [any, any] }
  | { type: 'CLOSE_COMPARISON' }
  | { type: 'UPDATE_REFINE_SETTINGS'; payload: Partial<RefineOptions> }
  | { type: 'RESET' };

// Initial State
const initialState: EditorState = {
  summary: '',
  content: '',
  lastSavedSummary: '',
  lastSavedContent: '',
  hasUnsavedChanges: false,
  isSidebarOpen: false,
  isFocusMode: false,
  isGeneratingImage: false,
  showVersionHistory: false,
  showVersionComparison: false,
  comparisonVersions: null,
  showAnalytics: false,
  refineSettings: {
    model: 'gemini-2.5-flash' as const,
    temperature: 0.3,
    maxTokens: 2000,
    topP: 0.95,
    focusAreas: [],
    preserveLength: false,
  },
};

// Reducer
function editorReducer(state: EditorState, action: EditorAction): EditorState {
  switch (action.type) {
    case 'SET_CHAPTER':
      return {
        ...state,
        summary: action.payload.summary,
        content: action.payload.content,
        lastSavedSummary: action.payload.summary,
        lastSavedContent: action.payload.content,
        hasUnsavedChanges: false,
      };
    case 'UPDATE_SUMMARY':
      return {
        ...state,
        summary: action.payload,
        hasUnsavedChanges: true,
      };
    case 'UPDATE_CONTENT':
      return {
        ...state,
        content: action.payload,
        hasUnsavedChanges: true,
      };
    case 'MARK_SAVED':
      return {
        ...state,
        lastSavedSummary: state.summary,
        lastSavedContent: state.content,
        hasUnsavedChanges: false,
      };
    case 'TOGGLE_SIDEBAR':
      return { ...state, isSidebarOpen: !state.isSidebarOpen };
    case 'TOGGLE_FOCUS_MODE':
      return { ...state, isFocusMode: !state.isFocusMode };
    case 'SET_GENERATING_IMAGE':
      return { ...state, isGeneratingImage: action.payload };
    case 'TOGGLE_VERSION_HISTORY':
      return { ...state, showVersionHistory: action.payload };
    case 'TOGGLE_ANALYTICS':
      return { ...state, showAnalytics: action.payload };
    case 'SHOW_COMPARISON':
      return {
        ...state,
        showVersionComparison: true,
        comparisonVersions: action.payload,
      };
    case 'CLOSE_COMPARISON':
      return {
        ...state,
        showVersionComparison: false,
        comparisonVersions: null,
      };
    case 'UPDATE_REFINE_SETTINGS':
      return {
        ...state,
        refineSettings: { ...state.refineSettings, ...action.payload },
      };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
}

// Hook
export function useEditorState() {
  const [state, dispatch] = useReducer(editorReducer, initialState);

  const actions = {
    setChapter: useCallback(
      (summary: string, content: string) =>
        dispatch({ type: 'SET_CHAPTER', payload: { summary, content } }),
      []
    ),

    updateSummary: useCallback(
      (summary: string) => dispatch({ type: 'UPDATE_SUMMARY', payload: summary }),
      []
    ),

    updateContent: useCallback(
      (content: string) => dispatch({ type: 'UPDATE_CONTENT', payload: content }),
      []
    ),

    markSaved: useCallback(() => dispatch({ type: 'MARK_SAVED' }), []),

    toggleSidebar: useCallback(() => dispatch({ type: 'TOGGLE_SIDEBAR' }), []),

    toggleFocusMode: useCallback(() => dispatch({ type: 'TOGGLE_FOCUS_MODE' }), []),

    setGeneratingImage: useCallback(
      (isGenerating: boolean) => dispatch({ type: 'SET_GENERATING_IMAGE', payload: isGenerating }),
      []
    ),

    setShowVersionHistory: useCallback(
      (show: boolean) => dispatch({ type: 'TOGGLE_VERSION_HISTORY', payload: show }),
      []
    ),

    setShowAnalytics: useCallback(
      (show: boolean) => dispatch({ type: 'TOGGLE_ANALYTICS', payload: show }),
      []
    ),

    showComparison: useCallback(
      (v1: any, v2: any) => dispatch({ type: 'SHOW_COMPARISON', payload: [v1, v2] }),
      []
    ),

    closeComparison: useCallback(() => dispatch({ type: 'CLOSE_COMPARISON' }), []),

    updateRefineSettings: useCallback(
      (settings: Partial<RefineOptions>) =>
        dispatch({ type: 'UPDATE_REFINE_SETTINGS', payload: settings }),
      []
    ),

    reset: useCallback(() => dispatch({ type: 'RESET' }), []),
  };

  return { state, actions };
}
