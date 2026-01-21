import {
  AlertTriangle,
  CheckCircle,
  Database,
  Download,
  Key,
  Laptop,
  Moon,
  Save,
  Settings as SettingsIcon,
  ShieldCheck,
  Sun,
  Zap,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';

import { useUser } from '@/contexts/UserContext';
import { GamificationPanel } from '@/features/gamification/components/GamificationPanel';
import { AISettingsPanel } from '@/features/settings/components/AISettingsPanel';
import { PWAInstallButton } from '@/features/settings/components/PWAInstallButton';
import {
  drizzleDbService,
  getStoredConfig,
  saveStoredConfig,
  testDbConnection,
  type DbConfig,
} from '@/lib/database';
import { cn } from '@/lib/utils';

const SettingsView: React.FC = () => {
  const { userId, theme, setTheme: setUserTheme } = useUser();
  const [dbConfig, setDbConfig] = useState<DbConfig>({ url: '', authToken: '', useCloud: false });
  const [isSaved, setIsSaved] = useState(false);
  const [testStatus, setTestStatus] = useState<'none' | 'success' | 'error'>('none');

  useEffect(() => {
    const config = getStoredConfig();
    setDbConfig(config);
  }, []);

  const handleThemeChange = (newTheme: 'dark' | 'light'): void => {
    void setUserTheme(newTheme);
  };

  const handleSaveDbConfig = async (): Promise<void> => {
    saveStoredConfig(dbConfig);
    setIsSaved(true);

    // Test connection
    setTestStatus('none');
    if (dbConfig.useCloud) {
      await drizzleDbService.init();
      const isConnected = await testDbConnection();
      if (isConnected) setTestStatus('success');
      else setTestStatus('error');
    } else {
      setTestStatus('success'); // Local is always successful
    }

    setTimeout(() => setIsSaved(false), 2000);
  };

  return (
    <div data-testid='settings-view' className='mx-auto max-w-3xl space-y-8 p-6 pb-20'>
      <div className='border-b border-border pb-4'>
        <h2 className='font-serif text-3xl font-bold'>Settings</h2>
        <p className='mt-1 text-muted-foreground'>Configure your Novelist workspace preference.</p>
      </div>

      {/* Database Configuration */}
      <section className='space-y-4'>
        <h3 className='flex items-center gap-2 text-lg font-medium'>
          <Database className='h-5 w-5' /> Database Persistence
        </h3>
        <div className='space-y-6 rounded-lg border border-border bg-card p-6'>
          <div className='flex items-center justify-between'>
            <div>
              <h4 className='font-medium'>Storage Strategy</h4>
              <p className='text-sm text-muted-foreground'>
                Choose between local browser storage or Cloud Database.
              </p>
            </div>
            <div className='flex rounded-lg bg-secondary/50 p-1'>
              <button
                data-testid='storage-local-btn'
                onClick={() => setDbConfig(p => ({ ...p, useCloud: false }))}
                className={cn(
                  'rounded-md px-4 py-1.5 text-xs font-bold transition-all',
                  !dbConfig.useCloud
                    ? 'bg-primary text-primary-foreground shadow'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                Local (Browser)
              </button>
              <button
                data-testid='storage-cloud-btn'
                onClick={() => setDbConfig(p => ({ ...p, useCloud: true }))}
                className={cn(
                  'rounded-md px-4 py-1.5 text-xs font-bold transition-all',
                  dbConfig.useCloud
                    ? 'bg-primary text-primary-foreground shadow'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                Turso Cloud
              </button>
            </div>
          </div>

          {dbConfig.useCloud && (
            <div className='animate-in fade-in slide-in-from-top-2 space-y-4 rounded-md border border-border bg-secondary/10 p-4'>
              <div className='space-y-1.5'>
                <label
                  htmlFor='db-url-input'
                  className='text-xs font-bold uppercase text-muted-foreground'
                >
                  Database URL (libsql://)
                </label>
                <input
                  id='db-url-input'
                  type='text'
                  value={dbConfig.url}
                  onChange={e => setDbConfig(p => ({ ...p, url: e.target.value }))}
                  placeholder='libsql://your-db.turso.io'
                  className='w-full rounded border border-input bg-background px-3 py-2 font-mono text-sm text-foreground focus:border-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
                />
              </div>
              <div className='space-y-1.5'>
                <label
                  htmlFor='auth-token-input'
                  className='text-xs font-bold uppercase text-muted-foreground'
                >
                  Auth Token
                </label>
                <input
                  id='auth-token-input'
                  type='password'
                  value={dbConfig.authToken}
                  onChange={e => setDbConfig(p => ({ ...p, authToken: e.target.value }))}
                  placeholder='ey...'
                  className='w-full rounded border border-input bg-background px-3 py-2 font-mono text-sm text-foreground focus:border-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
                />
              </div>

              {testStatus === 'success' && (
                <div className='flex items-center gap-2 text-xs font-medium text-green-500'>
                  <CheckCircle className='h-3 w-3' /> Connection Validated
                </div>
              )}
              {testStatus === 'error' && (
                <div className='flex items-center gap-2 text-xs font-medium text-red-500'>
                  <AlertTriangle className='h-3 w-3' /> Connection Failed
                </div>
              )}
            </div>
          )}

          <div className='flex justify-end pt-2'>
            <button
              data-testid='save-config-btn'
              onClick={() => void handleSaveDbConfig()}
              className='flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-bold text-primary-foreground transition-all hover:opacity-90'
            >
              {isSaved ? <CheckCircle className='h-4 w-4' /> : <Save className='h-4 w-4' />}
              {isSaved ? 'Saved!' : 'Save Configuration'}
            </button>
          </div>
        </div>
      </section>

      {/* PWA Installation */}
      <section className='space-y-4'>
        <h3 className='flex items-center gap-2 text-lg font-medium'>
          <Download className='h-5 w-5' /> App Installation
        </h3>
        <PWAInstallButton />
      </section>

      {/* Appearance */}
      <section className='space-y-4'>
        <h3 className='flex items-center gap-2 text-lg font-medium'>
          <Laptop className='h-5 w-5' /> Appearance
        </h3>
        <div className='grid max-w-sm grid-cols-2 rounded-lg border border-border bg-card p-1'>
          <button
            data-testid='theme-light-btn'
            onClick={() => handleThemeChange('light')}
            className={cn(
              'flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all',
              theme === 'light'
                ? 'bg-primary text-primary-foreground shadow'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <Sun className='h-4 w-4' /> Light
          </button>
          <button
            data-testid='theme-dark-btn'
            onClick={() => handleThemeChange('dark')}
            className={cn(
              'flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all',
              theme === 'dark'
                ? 'bg-primary text-primary-foreground shadow'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <Moon className='h-4 w-4' /> Dark
          </button>
        </div>
      </section>

      {/* AI Provider Settings */}
      <section className='space-y-4'>
        <h3 className='flex items-center gap-2 text-lg font-medium'>
          <SettingsIcon className='h-5 w-5' />
          AI Provider Settings
        </h3>
        <AISettingsPanel userId={userId} />
      </section>

      {/* Gamification */}
      <section className='space-y-4'>
        <h3 className='flex items-center gap-2 text-lg font-medium'>
          <Zap className='h-5 w-5' />
          Writing Gamification
        </h3>
        <GamificationPanel userId={userId} wordsWritten={0} />
      </section>

      {/* API Configuration */}
      <section className='space-y-4'>
        <h3 className='flex items-center gap-2 text-lg font-medium'>
          <Key className='h-5 w-5' /> Google GenAI Configuration
        </h3>
        <div className='rounded-lg border border-border bg-card p-6'>
          <div className='flex items-start gap-4'>
            <div className='rounded-full bg-green-500/10 p-2'>
              <ShieldCheck className='h-5 w-5 text-green-500' />
            </div>
            <div>
              <h4 className='font-medium'>API Key Active</h4>
              <p className='mt-1 text-sm text-muted-foreground'>Connected via environment.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default SettingsView;
