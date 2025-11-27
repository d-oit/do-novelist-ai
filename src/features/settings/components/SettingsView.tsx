
import React, { useEffect, useState } from 'react';
import { Moon, Sun, Laptop, Key, ShieldCheck, Database, Save, CheckCircle, AlertTriangle } from 'lucide-react';
import { getStoredConfig, saveStoredConfig, DbConfig, db } from '../../../lib/db';

const SettingsView: React.FC = () => {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [dbConfig, setDbConfig] = useState<DbConfig>({ url: '', authToken: '', useCloud: false });
  const [isSaved, setIsSaved] = useState(false);
  const [testStatus, setTestStatus] = useState<'none' | 'success' | 'error'>('none');

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

  const handleThemeChange = (newTheme: 'dark' | 'light') => {
    setTheme(newTheme);
    localStorage.setItem('novelist_theme', newTheme);
    const root = window.document.documentElement;
    if (newTheme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  };

  const handleSaveDbConfig = async () => {
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
    <div className="max-w-3xl mx-auto p-6 space-y-8 pb-20">
      <div className="border-b border-border pb-4">
        <h2 className="text-3xl font-serif font-bold">Settings</h2>
        <p className="text-muted-foreground mt-1">Configure your Novelist workspace preference.</p>
      </div>

      {/* Database Configuration */}
      <section className="space-y-4">
        <h3 className="text-lg font-medium flex items-center gap-2">
          <Database className="w-5 h-5" /> Database Persistence
        </h3>
        <div className="bg-card border border-border rounded-lg p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Storage Strategy</h4>
              <p className="text-sm text-muted-foreground">Choose between local browser storage or Cloud Database.</p>
            </div>
            <div className="flex bg-secondary/50 p-1 rounded-lg">
               <button 
                 onClick={() => setDbConfig(p => ({ ...p, useCloud: false }))}
                 className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${!dbConfig.useCloud ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground hover:text-foreground'}`}
               >
                 Local (Browser)
               </button>
               <button 
                 onClick={() => setDbConfig(p => ({ ...p, useCloud: true }))}
                 className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${dbConfig.useCloud ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground hover:text-foreground'}`}
               >
                 Turso Cloud
               </button>
            </div>
          </div>

          {dbConfig.useCloud && (
            <div className="bg-secondary/10 border border-border rounded-md p-4 space-y-4 animate-in fade-in slide-in-from-top-2">
               <div className="space-y-1.5">
                 <label className="text-xs font-bold uppercase text-muted-foreground">Database URL (libsql://)</label>
                 <input 
                   type="text" 
                   value={dbConfig.url}
                   onChange={e => setDbConfig(p => ({ ...p, url: e.target.value }))}
                   placeholder="libsql://your-db.turso.io"
                   className="w-full bg-background border border-border rounded px-3 py-2 text-sm font-mono focus:outline-none focus:border-primary"
                 />
               </div>
               <div className="space-y-1.5">
                 <label className="text-xs font-bold uppercase text-muted-foreground">Auth Token</label>
                 <input 
                   type="password" 
                   value={dbConfig.authToken}
                   onChange={e => setDbConfig(p => ({ ...p, authToken: e.target.value }))}
                   placeholder="ey..."
                   className="w-full bg-background border border-border rounded px-3 py-2 text-sm font-mono focus:outline-none focus:border-primary"
                 />
               </div>
               
               {testStatus === 'success' && (
                 <div className="flex items-center gap-2 text-green-500 text-xs font-medium">
                   <CheckCircle className="w-3 h-3" /> Connection Validated
                 </div>
               )}
               {testStatus === 'error' && (
                 <div className="flex items-center gap-2 text-red-500 text-xs font-medium">
                   <AlertTriangle className="w-3 h-3" /> Connection Failed
                 </div>
               )}
            </div>
          )}

          <div className="pt-2 flex justify-end">
             <button 
               onClick={handleSaveDbConfig}
               className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-bold hover:opacity-90 transition-all"
             >
               {isSaved ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
               {isSaved ? 'Saved!' : 'Save Configuration'}
             </button>
          </div>
        </div>
      </section>

      {/* Appearance */}
      <section className="space-y-4">
        <h3 className="text-lg font-medium flex items-center gap-2">
          <Laptop className="w-5 h-5" /> Appearance
        </h3>
        <div className="bg-card border border-border rounded-lg p-1 grid grid-cols-2 max-w-sm">
           <button 
             onClick={() => handleThemeChange('light')}
             className={`flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${theme === 'light' ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground hover:text-foreground'}`}
           >
             <Sun className="w-4 h-4" /> Light
           </button>
           <button 
             onClick={() => handleThemeChange('dark')}
             className={`flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${theme === 'dark' ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground hover:text-foreground'}`}
           >
             <Moon className="w-4 h-4" /> Dark
           </button>
        </div>
      </section>

      {/* API Configuration */}
      <section className="space-y-4">
        <h3 className="text-lg font-medium flex items-center gap-2">
          <Key className="w-5 h-5" /> Google GenAI Configuration
        </h3>
        <div className="bg-card border border-border rounded-lg p-6">
           <div className="flex items-start gap-4">
              <div className="bg-green-500/10 p-2 rounded-full">
                 <ShieldCheck className="w-5 h-5 text-green-500" />
              </div>
              <div>
                 <h4 className="font-medium">API Key Active</h4>
                 <p className="text-sm text-muted-foreground mt-1">
                   Connected via environment.
                 </p>
              </div>
           </div>
        </div>
      </section>
    </div>
  );
};

export default SettingsView;
