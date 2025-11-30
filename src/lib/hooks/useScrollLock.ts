import { useEffect } from 'react';

/**
 * Locks body scroll when active
 *
 * Prevents background scrolling when modals/drawers are open.
 * Automatically restores scroll on unmount.
 *
 * @param isLocked - Whether scroll should be locked
 */
export function useScrollLock(isLocked: boolean): void {
  useEffect(() => {
    if (!isLocked) return;

    // Save original overflow value
    const originalOverflow = document.body.style.overflow;
    const originalPaddingRight = document.body.style.paddingRight;

    // Calculate scrollbar width to prevent layout shift
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

    // Lock scroll
    document.body.style.overflow = 'hidden';
    document.body.style.paddingRight = `${scrollbarWidth}px`;

    // Cleanup on unmount
    return (): void => {
      document.body.style.overflow = originalOverflow;
      document.body.style.paddingRight = originalPaddingRight;
    };
  }, [isLocked]);
}
