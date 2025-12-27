import { logger } from '@/lib/logging/logger';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

class InstallPromptManager {
  private deferredPrompt: BeforeInstallPromptEvent | null = null;
  private hasShownPrompt = false;
  private listeners: Array<(canInstall: boolean) => void> = [];

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeinstallprompt', this.handleBeforeInstallPrompt);
      window.addEventListener('appinstalled', this.handleAppInstalled);
    }
  }

  private handleBeforeInstallPrompt = (e: Event): void => {
    e.preventDefault();
    this.deferredPrompt = e as BeforeInstallPromptEvent;
    this.notifyListeners(true);
    logger.info('Install prompt available', { component: 'InstallPromptManager' });
  };

  private handleAppInstalled = (): void => {
    this.deferredPrompt = null;
    this.hasShownPrompt = true;
    this.notifyListeners(false);
    logger.info('App installed successfully', { component: 'InstallPromptManager' });
  };

  private notifyListeners(canInstall: boolean): void {
    this.listeners.forEach(listener => listener(canInstall));
  }

  public canInstall(): boolean {
    return this.deferredPrompt !== null && !this.hasShownPrompt;
  }

  public async promptInstall(): Promise<boolean> {
    if (!this.deferredPrompt) {
      logger.warn('Install prompt not available', { component: 'InstallPromptManager' });
      return false;
    }

    try {
      await this.deferredPrompt.prompt();
      const { outcome } = await this.deferredPrompt.userChoice;

      logger.info('Install prompt user choice', {
        component: 'InstallPromptManager',
        outcome,
      });

      if (outcome === 'accepted') {
        this.deferredPrompt = null;
        this.hasShownPrompt = true;
        this.notifyListeners(false);
        return true;
      }

      return false;
    } catch (error) {
      logger.error('Error prompting install', {
        component: 'InstallPromptManager',
        error: error as Error,
      });
      return false;
    }
  }

  public onInstallPromptChange(callback: (canInstall: boolean) => void): () => void {
    this.listeners.push(callback);
    callback(this.canInstall());

    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  public getIsInstalled(): boolean {
    if (typeof window === 'undefined') return false;

    // Check if running as standalone PWA
    const mediaQuery = window.matchMedia?.('(display-mode: standalone)');
    const standalone =
      (mediaQuery?.matches ?? false) ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;

    return standalone;
  }

  public destroy(): void {
    if (typeof window !== 'undefined') {
      window.removeEventListener('beforeinstallprompt', this.handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', this.handleAppInstalled);
    }
    this.listeners = [];
    this.deferredPrompt = null;
  }
}

export const installPromptManager = new InstallPromptManager();
