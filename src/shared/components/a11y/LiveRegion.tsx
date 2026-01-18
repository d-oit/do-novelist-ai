import React, { useEffect } from 'react';

import {
  useLiveAnnounce,
  registerGlobalAnnounce,
  unregisterGlobalAnnounce,
} from '@/lib/hooks/useLiveAnnounce';

/**
 * LiveRegion component provides screen reader announcements for dynamic content.
 *
 * Mount this component once at the root of your app (e.g., in App.tsx).
 * Then use the global announce functions or the useLiveAnnounce hook to
 * trigger announcements from anywhere.
 *
 * @example
 * ```tsx
 * // In App.tsx
 * import { LiveRegion } from '@/shared/components/a11y/LiveRegion';
 *
 * function App() {
 *   return (
 *     <>
 *       <LiveRegion />
 *       <MainContent />
 *     </>
 *   );
 * }
 *
 * // Anywhere in the app
 * import { announceToScreenReader } from '@/lib/hooks/useLiveAnnounce';
 *
 * function SaveButton() {
 *   const handleSave = async () => {
 *     await save();
 *     announceToScreenReader('Document saved successfully');
 *   };
 *   return <button onClick={handleSave}>Save</button>;
 * }
 * ```
 */
export const LiveRegion: React.FC = () => {
  const { announcement, announce, announceAssertive } = useLiveAnnounce();

  // Register global announce functions on mount
  useEffect(() => {
    registerGlobalAnnounce(announce, announceAssertive);
    return () => {
      unregisterGlobalAnnounce();
    };
  }, [announce, announceAssertive]);

  return (
    <>
      {/* Polite announcements - wait for user to finish current task */}
      <div role='status' aria-live='polite' aria-atomic='true' className='sr-only'>
        {announcement?.priority === 'polite' ? announcement.message : ''}
      </div>

      {/* Assertive announcements - interrupt current speech */}
      <div role='alert' aria-live='assertive' aria-atomic='true' className='sr-only'>
        {announcement?.priority === 'assertive' ? announcement.message : ''}
      </div>
    </>
  );
};
