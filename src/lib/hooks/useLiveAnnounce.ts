import { useCallback, useRef, useState } from 'react';

type AnnouncePriority = 'polite' | 'assertive';

interface Announcement {
  message: string;
  priority: AnnouncePriority;
  id: number;
}

interface UseLiveAnnounceReturn {
  /** Current announcement to be read by screen readers */
  announcement: Announcement | null;
  /** Announce a message politely (waits for user to finish current task) */
  announce: (message: string) => void;
  /** Announce a message assertively (interrupts current speech) */
  announceAssertive: (message: string) => void;
  /** Clear the current announcement */
  clear: () => void;
}

/**
 * Hook for managing live region announcements for screen readers.
 *
 * Usage:
 * ```tsx
 * const { announce, announceAssertive } = useLiveAnnounce();
 *
 * // Polite announcement (doesn't interrupt)
 * announce('Project saved successfully');
 *
 * // Assertive announcement (interrupts current speech)
 * announceAssertive('Error: Failed to save project');
 * ```
 */
export function useLiveAnnounce(): UseLiveAnnounceReturn {
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const idRef = useRef(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const makeAnnouncement = useCallback((message: string, priority: AnnouncePriority): void => {
    // Clear any pending clear timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Increment ID to ensure React re-renders even with same message
    idRef.current += 1;

    setAnnouncement({
      message,
      priority,
      id: idRef.current,
    });

    // Clear announcement after a delay to allow for re-announcement
    timeoutRef.current = setTimeout(() => {
      setAnnouncement(null);
    }, 1000);
  }, []);

  const announce = useCallback(
    (message: string): void => {
      makeAnnouncement(message, 'polite');
    },
    [makeAnnouncement],
  );

  const announceAssertive = useCallback(
    (message: string): void => {
      makeAnnouncement(message, 'assertive');
    },
    [makeAnnouncement],
  );

  const clear = useCallback((): void => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setAnnouncement(null);
  }, []);

  return {
    announcement,
    announce,
    announceAssertive,
    clear,
  };
}

// Singleton pattern for global announcements
let globalAnnounce: ((message: string) => void) | null = null;
let globalAnnounceAssertive: ((message: string) => void) | null = null;

/**
 * Register the global announce functions.
 * Called by LiveRegion component on mount.
 */
export function registerGlobalAnnounce(
  announce: (message: string) => void,
  announceAssertive: (message: string) => void,
): void {
  globalAnnounce = announce;
  globalAnnounceAssertive = announceAssertive;
}

/**
 * Unregister the global announce functions.
 * Called by LiveRegion component on unmount.
 */
export function unregisterGlobalAnnounce(): void {
  globalAnnounce = null;
  globalAnnounceAssertive = null;
}

/**
 * Announce a message globally (polite priority).
 * Use this from anywhere in the app without needing the hook.
 *
 * @example
 * ```ts
 * import { announceToScreenReader } from '@/lib/hooks/useLiveAnnounce';
 *
 * announceToScreenReader('Item deleted');
 * ```
 */
export function announceToScreenReader(message: string): void {
  if (globalAnnounce) {
    globalAnnounce(message);
  }
}

/**
 * Announce a message globally with assertive priority.
 * Use for errors or urgent messages that should interrupt.
 */
export function announceToScreenReaderAssertive(message: string): void {
  if (globalAnnounceAssertive) {
    globalAnnounceAssertive(message);
  }
}
