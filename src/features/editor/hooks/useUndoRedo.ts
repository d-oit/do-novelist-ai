import { useReducer, useCallback } from 'react';

/**
 * Undo/Redo State Interface
 */
interface UndoRedoState<T> {
  past: T[];
  present: T;
  future: T[];
}

/**
 * Undo/Redo Action Types
 */
type UndoRedoAction<T> =
  | { type: 'SET'; payload: T }
  | { type: 'UNDO' }
  | { type: 'REDO' }
  | { type: 'RESET'; payload: T };

/**
 * Options for useUndoRedo hook
 */
export interface UseUndoRedoOptions<T> {
  /** Maximum number of history states to keep */
  maxHistory?: number;
  /** Optional comparison function to detect changes */
  shouldUpdate?: (prev: T, next: T) => boolean;
}

/**
 * Return value for useUndoRedo hook
 */
export interface UseUndoRedoReturn<T> {
  /** Current state */
  state: T;
  /** Go to previous state */
  undo: () => void;
  /** Go to next state */
  redo: () => void;
  /** Can undo (has past states) */
  canUndo: boolean;
  /** Can redo (has future states) */
  canRedo: boolean;
  /** Set new state */
  set: (value: T) => void;
  /** Reset to initial state */
  reset: () => void;
  /** Clear all history */
  clear: () => void;
}

/**
 * Undo/Redo Hook
 *
 * @param initialState - Initial state value
 * @param options - Configuration options
 *
 * @example
 * ```tsx
 * const { state, undo, redo, canUndo, canRedo, set } = useUndoRedo(initialContent);
 *
 * // Update state
 * set(newContent);
 *
 * // Undo
 * <button onClick={undo} disabled={!canUndo}>Undo</button>
 * ```
 */
export function useUndoRedo<T>(
  initialState: T,
  options?: UseUndoRedoOptions<T>,
): UseUndoRedoReturn<T> {
  const { maxHistory = 50 } = options ?? {};

  const reducer = useCallback(
    (state: UndoRedoState<T>, action: UndoRedoAction<T>): UndoRedoState<T> => {
      const shouldUpdate = options?.shouldUpdate ?? ((prev: T, next: T): boolean => prev !== next);

      switch (action.type) {
        case 'SET': {
          const { payload: newPresent } = action;

          if (!shouldUpdate(state.present, newPresent)) {
            return state;
          }

          return {
            past: [...state.past, state.present].slice(-maxHistory),
            present: newPresent,
            future: [],
          };
        }

        case 'UNDO': {
          if (state.past.length === 0) {
            return state;
          }

          const previous = state.past[state.past.length - 1];
          const newPast = state.past.slice(0, -1);

          return {
            past: newPast,
            present: previous ?? state.present,
            future: [state.present, ...state.future],
          };
        }

        case 'REDO': {
          if (state.future.length === 0) {
            return state;
          }

          const next = state.future[0] ?? state.present;
          const newFuture = state.future.slice(1);

          return {
            past: [...state.past, state.present],
            present: next,
            future: newFuture,
          };
        }

        case 'RESET': {
          return {
            past: [],
            present: action.payload,
            future: [],
          };
        }

        default:
          return state;
      }
    },
    [maxHistory, options?.shouldUpdate],
  );

  const [{ past, present, future }, dispatch] = useReducer(reducer, {
    past: [],
    present: initialState,
    future: [],
  });

  const undo = useCallback((): void => {
    dispatch({ type: 'UNDO' });
  }, []);

  const redo = useCallback((): void => {
    dispatch({ type: 'REDO' });
  }, []);

  const set = useCallback((value: T): void => {
    dispatch({ type: 'SET', payload: value });
  }, []);

  const reset = useCallback((): void => {
    dispatch({ type: 'RESET', payload: initialState });
  }, [initialState]);

  const clear = useCallback((): void => {
    dispatch({ type: 'RESET', payload: present });
  }, [present]);

  return {
    state: present,
    undo,
    redo,
    canUndo: past.length > 0,
    canRedo: future.length > 0,
    set,
    reset,
    clear,
  };
}
