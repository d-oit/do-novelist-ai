/**
 * PWAStatus Component
 * Displays offline status, sync status, and PWA install prompt
 */
import { Download, RefreshCw, WifiOff } from 'lucide-react';
import React, { useEffect, useState } from 'react';

import { installPromptManager } from '@/lib/pwa/install-prompt';
import { offlineManager } from '@/lib/pwa/offline-manager';
import { Button } from '@/shared/components/ui/Button';

export const PWAStatus: React.FC = () => {
  const [isOffline, setIsOffline] = useState(offlineManager.isOffline());
  const [canInstall, setCanInstall] = useState(installPromptManager.canInstall());
  const [isSyncing] = useState<boolean>(false);

  useEffect(() => {
    const cleanupOffline = offlineManager.onOfflineChange(offline => {
      setIsOffline(offline);
    });

    const cleanupInstall = installPromptManager.onInstallPromptChange(installable => {
      setCanInstall(installable);
    });

    return () => {
      cleanupOffline();
      cleanupInstall();
    };
  }, []);

  const handleInstall = async () => {
    await installPromptManager.promptInstall();
  };

  if (!isOffline && !canInstall && !isSyncing) return null;

  return (
    <div className='fixed bottom-20 right-4 z-[100] flex flex-col gap-2 md:bottom-4'>
      {/* Offline/Online Status */}
      {isOffline && (
        <div className='animate-in fade-in slide-in-from-bottom-2 flex items-center gap-2 rounded-lg bg-destructive px-4 py-2 text-white shadow-lg'>
          <WifiOff className='h-4 w-4' />
          <span className='text-xs font-semibold'>Offline Mode - Working locally</span>
        </div>
      )}

      {/* Sync Status */}
      {!isOffline && isSyncing && (
        <div className='animate-in fade-in slide-in-from-bottom-2 flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-white shadow-lg'>
          <RefreshCw className='h-4 w-4 animate-spin' />
          <span className='text-xs font-semibold'>Syncing changes...</span>
        </div>
      )}

      {/* Install Prompt */}
      {canInstall && !isOffline && (
        <div className='animate-in fade-in slide-in-from-bottom-2 flex flex-col gap-2 rounded-lg border border-border bg-card p-3 shadow-xl md:max-w-[200px]'>
          <div className='flex items-center gap-2'>
            <Download className='h-4 w-4 text-primary' />
            <span className='text-xs font-semibold'>Install Novelist.ai</span>
          </div>
          <p className='text-[10px] text-muted-foreground'>
            Get a faster, offline-capable experience by installing the app.
          </p>
          <div className='flex gap-2'>
            <Button
              size='sm'
              variant='default'
              className='h-7 text-[10px]'
              onClick={() => void handleInstall()}
            >
              Install Now
            </Button>
            <Button
              size='sm'
              variant='ghost'
              className='h-7 text-[10px]'
              onClick={() => setCanInstall(false)}
            >
              Later
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PWAStatus;
