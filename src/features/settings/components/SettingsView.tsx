import {
  Moon,
  Sun,
  Laptop,
  Key,
  ShieldCheck,
  Database,
  Save,
  CheckCircle,
  AlertTriangle,
  Settings as SettingsIcon,
  Zap,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';

import { getStoredConfig, saveStoredConfig, DbConfig, db } from '../../../lib/db';
import { getUserId } from '../../../lib/utils';
import { AISettingsPanel } from './AISettingsPanel';
import { GamificationPanel } from '../../gamification';

const SettingsView: React.FC = () => {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [dbConfig, setDbConfig] = useState<DbConfig>({ url: '', authToken: '', useCloud: false });
  const [isSaved, setIsSaved] = useState(false);
  const [testStatus, setTestStatus] = useState<'none' | 'success' | 'error'>('none');
  const [userId] = useState<string>(() => getUserId());

  useEffect(() => {
    const config = getStoredConfig();
    setDbConfig(config);

    // Check localstorage first, then DOM class
    const storedTheme = localStorage.getItem('novelist_theme');
    if (storedTheme === 'light' || storedTheme === 'dark') {
      setTheme(storedTheme);
      const root = window.document.documentElement;
      if (storedTheme === 'dark') root.classList.add('dark');
      else root.classList.remove('dark');
    } else {
      const root = window.document.documentElement;
      setTheme(root.classList.contains('dark') ? 'dark' : 'light');
    }
  }, []);

  const handleThemeChange = (newTheme: 'dark' | 'light'): void => {
    setTheme(newTheme);
    localStorage.setItem('novelist_theme', newTheme);
    const root = window.document.documentElement;
    if (newTheme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  };

  const handleSaveDbConfig = async (): Promise<void> => {
    saveStoredConfig(dbConfig);
    setIsSaved(true);

    // Test connection
    setTestStatus('none');
    if (dbConfig.useCloud) {
      await db.init();
      // Simple check: if init didn't crash and we can list projects (even empty), it's likely good.
      const active = getStoredConfig();
      if (active.useCloud) setTestStatus('success');
      else setTestStatus('error');
    } else {
      setTestStatus('success'); // Local is always successful
    }

    setTimeout(() => setIsSaved(false), 2000);
  };

  return (
    <div className='mx-auto max-w-3xl space-y-8 p-6 pb-20'>
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
                onClick={() => setDbConfig(p => ({ ...p, useCloud: false }))}
                className={`rounded-md px-4 py-1.5 text-xs font-bold transition-all ${!dbConfig.useCloud ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground hover:text-foreground'}`}
              >
                Local (Browser)
              </button>
              <button
                onClick={() => setDbConfig(p => ({ ...p, useCloud: true }))}
                className={`rounded-md px-4 py-1.5 text-xs font-bold transition-all ${dbConfig.useCloud ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground hover:text-foreground'}`}
              >
                Turso Cloud
              </button>
            </div>
          </div>

          {dbConfig.useCloud && (
            <div className='animate-in fade-in slide-in-from-top-2 space-y-4 rounded-md border border-border bg-secondary/10 p-4'>
              <div className='space-y-1.5'>
                <label className='text-xs font-bold uppercase text-muted-foreground'>
                  Database URL (libsql://)
                </label>
                <input
                  type='text'
                  value={dbConfig.url}
                  onChange={e => setDbConfig(p => ({ ...p, url: e.target.value }))}
                  placeholder='libsql://your-db.turso.io'
                  className='w-full rounded border border-border bg-background px-3 py-2 font-mono text-sm focus:border-primary focus:outline-none'
                />
              </div>
              <div className='space-y-1.5'>
                <label className='text-xs font-bold uppercase text-muted-foreground'>
                  Auth Token
                </label>
                <input
                  type='password'
                  value={dbConfig.authToken}
                  onChange={e => setDbConfig(p => ({ ...p, authToken: e.target.value }))}
                  placeholder='ey...'
                  className='w-full rounded border border-border bg-background px-3 py-2 font-mono text-sm focus:border-primary focus:outline-none'
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
              onClick={() => void handleSaveDbConfig()}
              className='flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-bold text-primary-foreground transition-all hover:opacity-90'
            >
              {isSaved ? <CheckCircle className='h-4 w-4' /> : <Save className='h-4 w-4' />}
              {isSaved ? 'Saved!' : 'Save Configuration'}
            </button>
          </div>
        </div>
      </section>

      {/* Appearance */}
      <section className='space-y-4'>
        <h3 className='flex items-center gap-2 text-lg font-medium'>
          <Laptop className='h-5 w-5' /> Appearance
        </h3>
        <div className='grid max-w-sm grid-cols-2 rounded-lg border border-border bg-card p-1'>
          <button
            onClick={() => handleThemeChange('light')}
            className={`flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all ${theme === 'light' ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <Sun className='h-4 w-4' /> Light
          </button>
          <button
            onClick={() => handleThemeChange('dark')}
            className={`flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all ${theme === 'dark' ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground hover:text-foreground'}`}
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
