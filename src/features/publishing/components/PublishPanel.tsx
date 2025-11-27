
import React, { useState } from 'react';
import { Project, PublishStatus, Chapter } from '@shared/types';
import { generateEpub } from '../services/epubService';
import { translateContent } from '../../generation/services/geminiService';
import { Download, Globe, Rocket, Target, Languages, Loader2, FileCheck, Settings } from 'lucide-react';

interface PublishPanelProps {
  project: Project;
  onUpdateProject: (updates: Partial<Project>) => void;
  onUpdateChapter: (chapterId: string, updates: Partial<Chapter>) => void;
}

const PublishPanel: React.FC<PublishPanelProps> = ({ project, onUpdateProject, onUpdateChapter }) => {
  const [isExporting, setIsExporting] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [targetLang, setTargetLang] = useState('Spanish');
  
  // Settings Helpers
  const settings = project.settings || { enableDropCaps: true };
  
  const handleUpdateSettings = (newSettings: Partial<typeof settings>) => {
    onUpdateProject({ 
      settings: { ...settings, ...newSettings } 
    });
  };

  // Calculate Stats
  const totalWords = project.chapters.reduce((acc, ch) => acc + (ch.content.trim().split(/\s+/).filter(w => w.length > 0).length || 0), 0);
  const targetWords = project.targetWordCount || 50000;
  const progress = Math.min(100, Math.round((totalWords / targetWords) * 100));

  const handleDownloadEpub = async () => {
    setIsExporting(true);
    try {
      const blob = await generateEpub(project, settings.enableDropCaps);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${project.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.epub`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      alert("Failed to generate ePub.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleTranslate = async () => {
    if (!confirm(`This will overwrite the content of your chapters with a ${targetLang} translation. It is recommended to duplicate your project first (Not implemented). Proceed?`)) return;
    
    setIsTranslating(true);
    try {
      onUpdateProject({ language: targetLang });
      for (const chapter of project.chapters) {
        if (chapter.content) {
          const translated = await translateContent(chapter.content, targetLang);
          const translatedTitle = await translateContent(chapter.title, targetLang);
          onUpdateChapter(chapter.id, { 
            content: translated,
            title: translatedTitle.replace(/[\#\*\"]/g, '').trim()
          });
        }
      }
      alert("Translation complete!");
    } catch (err) {
      alert("Translation failed midway.");
    } finally {
      setIsTranslating(false);
    }
  };

  const LANGUAGES = ['English', 'Spanish', 'French', 'German', 'Italian', 'Portuguese', 'Japanese', 'Chinese', 'Russian'];
  
  // Normalize language for display (handle 'en' vs 'English')
  const currentLanguage = LANGUAGES.find(l => l.toLowerCase() === (project.language || '').toLowerCase()) 
    || (project.language === 'en' ? 'English' : project.language) 
    || 'English';

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8 animate-in fade-in duration-500">
      
      <div className="space-y-2 mb-8">
        <h2 className="text-2xl font-serif font-bold flex items-center gap-3">
          <Rocket className="w-6 h-6 text-primary" />
          Publishing & Export
        </h2>
        <p className="text-muted-foreground text-sm">
          Prepare your manuscript for distribution. Configure formatting, track goals, and export.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Block 1: Manuscript Status & Goals */}
        <section className="space-y-4">
           <h3 className="text-sm font-bold uppercase text-muted-foreground flex items-center gap-2 border-b border-border pb-2">
             <Target className="w-4 h-4" /> Manuscript Controls
           </h3>
           
           <div className="bg-card border border-border rounded-lg p-5 space-y-5 shadow-sm">
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">Project Status</label>
                  <select 
                    className="w-full bg-secondary/20 border border-border rounded px-3 py-2 text-xs focus:outline-none focus:border-primary"
                    value={project.status}
                    onChange={(e) => onUpdateProject({ status: e.target.value as PublishStatus })}
                  >
                    {Object.values(PublishStatus).map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">Language</label>
                  <select 
                    className="w-full bg-secondary/20 border border-border rounded px-3 py-2 text-xs focus:outline-none focus:border-primary"
                    value={currentLanguage}
                    onChange={(e) => onUpdateProject({ language: e.target.value })}
                  >
                    {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">Target Words</label>
                  <input 
                    type="number" 
                    className="w-full bg-secondary/20 border border-border rounded px-3 py-2 text-xs focus:outline-none focus:border-primary"
                    value={targetWords}
                    onChange={(e) => onUpdateProject({ targetWordCount: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Progress</span>
                  <span className="font-mono text-foreground">{totalWords} / {targetWords} words</span>
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <div className="h-full bg-primary transition-all duration-1000" style={{ width: `${progress}%` }}></div>
                </div>
              </div>

           </div>
        </section>

        {/* Block 2: Export Settings */}
        <section className="space-y-4">
           <h3 className="text-sm font-bold uppercase text-muted-foreground flex items-center gap-2 border-b border-border pb-2">
             <Settings className="w-4 h-4" /> Format & Export
           </h3>
           
           <div className="bg-card border border-border rounded-lg p-5 space-y-5 shadow-sm">
              
              <div className="flex items-center justify-between p-3 bg-secondary/10 rounded-md border border-border/50">
                 <div className="flex items-center gap-3">
                    <div className="bg-background p-2 rounded border border-border">
                       <FileCheck className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                       <div className="text-sm font-bold">EPUB 3.0</div>
                       <div className="text-[10px] text-muted-foreground">Universal eBook Format</div>
                    </div>
                 </div>
              </div>

              <div className="space-y-3">
                 <label className="flex items-center justify-between text-sm cursor-pointer group">
                    <span className="text-muted-foreground group-hover:text-foreground transition-colors">Use "Drop Caps" styling</span>
                    <input 
                      type="checkbox" 
                      checked={settings.enableDropCaps} 
                      onChange={(e) => handleUpdateSettings({ enableDropCaps: e.target.checked })}
                      className="w-4 h-4 rounded border-border bg-secondary text-primary focus:ring-primary" 
                    />
                 </label>
              </div>

              <button 
                onClick={handleDownloadEpub}
                disabled={isExporting}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary text-primary-foreground rounded-md text-sm font-bold hover:opacity-90 transition-colors shadow-md disabled:opacity-50"
              >
                {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                Download Book
              </button>

           </div>
        </section>

        {/* Block 3: Translation */}
        <section className="space-y-4 lg:col-span-2">
           <h3 className="text-sm font-bold uppercase text-muted-foreground flex items-center gap-2 border-b border-border pb-2">
             <Globe className="w-4 h-4" /> Translation Engine
           </h3>
           
           <div className="bg-gradient-to-br from-card to-secondary/5 border border-border rounded-lg p-5 flex flex-col md:flex-row gap-6 items-center">
              
              <div className="flex-1 space-y-2">
                 <h4 className="text-sm font-bold flex items-center gap-2">
                    <Languages className="w-4 h-4 text-primary" /> 
                    Translate Project
                 </h4>
                 <p className="text-xs text-muted-foreground">
                   Uses Gemini to translate all chapters while preserving Markdown formatting. 
                   <span className="text-yellow-600 dark:text-yellow-500"> Warning: This action is destructive to the current text.</span>
                 </p>
              </div>

              <div className="flex items-center gap-3 w-full md:w-auto">
                 <select 
                   className="bg-background border border-border rounded px-3 py-2 text-xs focus:outline-none focus:border-primary"
                   value={targetLang}
                   onChange={(e) => setTargetLang(e.target.value)}
                 >
                   {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
                 </select>

                 <button 
                   onClick={handleTranslate}
                   disabled={isTranslating}
                   className="whitespace-nowrap px-4 py-2 bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded-md text-xs font-bold transition-colors flex items-center gap-2 border border-border"
                 >
                    {isTranslating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Rocket className="w-3 h-3" />}
                    Start Translation
                 </button>
              </div>

           </div>
        </section>

      </div>
    </div>
  );
};

export default PublishPanel;
