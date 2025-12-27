import { Download, Wifi, WifiOff, CheckCircle } from 'lucide-react';
import React, { useEffect, useState } from 'react';

import { installPromptManager } from '@/lib/pwa/install-prompt';
import { offlineManager } from '@/lib/pwa/offline-manager';

export const PWAInstallButton: React.FC = () => {
  const [canInstall, setCanInstall] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    setIsInstalled(installPromptManager.getIsInstalled());

    const unsubscribeInstall = installPromptManager.onInstallPromptChange(canInstallChange => {
      setCanInstall(canInstallChange);
    });

    const unsubscribeOffline = offlineManager.onOfflineChange(offline => {
      setIsOffline(offline);
    });

    return () => {
      unsubscribeInstall();
      unsubscribeOffline();
    };
  }, []);

  const handleInstall = async (): Promise<void> => {
    setInstalling(true);
    const installed = await installPromptManager.promptInstall();
    setInstalling(false);
    if (installed) {
      setIsInstalled(true);
    }
  };

  if (isInstalled) {
    return (
      <div className='flex items-center gap-3 rounded-lg border border-green-500/20 bg-green-500/10 p-4'>
        <CheckCircle className='h-5 w-5 text-green-500' aria-hidden='true' />
        <div className='flex-1'>
          <p className='font-medium text-green-700 dark:text-green-400'>App Installed</p>
          <p className='text-sm text-green-600 dark:text-green-500'>
            Novelist.ai is installed on your device
          </p>
        </div>
        {isOffline ? (
          <div className='flex items-center gap-2 text-amber-600 dark:text-amber-400'>
            <WifiOff className='h-5 w-5' aria-hidden='true' />
            <span className='text-sm font-medium'>Offline</span>
          </div>
        ) : (
          <div className='flex items-center gap-2 text-green-600 dark:text-green-500'>
            <Wifi className='h-5 w-5' aria-hidden='true' />
            <span className='text-sm font-medium'>Online</span>
          </div>
        )}
      </div>
    );
  }

  if (!canInstall) {
    return (
      <div className='flex items-center gap-3 rounded-lg border border-slate-500/20 bg-slate-500/10 p-4'>
        <div className='flex items-center gap-2 text-slate-600 dark:text-slate-400'>
          {isOffline ? (
            <>
              <WifiOff className='h-5 w-5' aria-hidden='true' />
              <span className='text-sm font-medium'>Offline Mode</span>
            </>
          ) : (
            <>
              <Wifi className='h-5 w-5' aria-hidden='true' />
              <span className='text-sm font-medium'>Online</span>
            </>
          )}
        </div>
        <p className='ml-auto text-sm text-slate-600 dark:text-slate-400'>Install not available</p>
      </div>
    );
  }

  return (
    <div className='flex items-center gap-3 rounded-lg border border-violet-500/20 bg-violet-500/10 p-4'>
      <Download className='h-5 w-5 text-violet-600 dark:text-violet-400' aria-hidden='true' />
      <div className='flex-1'>
        <p className='font-medium text-violet-700 dark:text-violet-400'>Install App</p>
        <p className='text-sm text-violet-600 dark:text-violet-500'>
          Install Novelist.ai on your device
        </p>
      </div>
      <button
        onClick={() => void handleInstall()}
        disabled={installing}
        className='rounded-lg bg-violet-600 px-4 py-2 font-medium text-white transition-colors hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:focus:ring-offset-slate-900'
        aria-label='Install Novelist.ai app'
        type='button'
      >
        {installing ? 'Installing...' : 'Install'}
      </button>
    </div>
  );
};
