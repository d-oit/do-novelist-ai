
import React, { useState } from 'react';
import { Project, PublishStatus, Chapter } from '@shared/types';
import { generateEpub } from '../services/epubService';
import { translateContent } from '../../generation/services/geminiService';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Download, Globe, Rocket, Target, Languages, Loader2, FileCheck } from 'lucide-react';

interface PublishViewProps {
  project: Project;
  onUpdateProject: (updates: Partial<Project>) => void;
  onUpdateChapter: (chapterId: string, updates: Partial<Chapter>) => void;
}

const PublishView: React.FC<PublishViewProps> = ({ project, onUpdateProject, onUpdateChapter }) => {
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

  const LANGUAGES = ['Spanish', 'French', 'German', 'Italian', 'Portuguese', 'Japanese', 'Chinese', 'Russian'];

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8 pb-20 animate-in fade-in">
      <div className="border-b border-border pb-4 flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-serif font-bold">Publishing Hub</h2>
          <p className="text-muted-foreground mt-1">Manage goals, translations, and final distribution.</p>
        </div>
        <div className="flex gap-2">
           <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase border ${project.status === PublishStatus.PUBLISHED ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-secondary text-muted-foreground border-border'}`}>
             {project.status}
           </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Column 1: Goals & Stats */}
        <div className="space-y-6">
           <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
              <h3 className="text-sm font-bold uppercase text-muted-foreground flex items-center gap-2 mb-4">
                <Target className="w-4 h-4" /> Manuscript Goals
              </h3>
              
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Word Count</span>
                    <span className="font-mono">{totalWords} / {targetWords}</span>
                  </div>
                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <div className="h-full bg-primary transition-all duration-1000" style={{ width: `${progress}%` }}></div>
                  </div>
                </div>
                
                <div className="pt-2">
                  <label className="text-xs font-bold text-muted-foreground uppercase">Set Target</label>
                  <input 
                    type="number" 
                    className="w-full bg-secondary/20 border border-border rounded px-3 py-2 text-sm mt-1 focus:outline-none focus:border-primary"
                    value={targetWords}
                    onChange={(e) => onUpdateProject({ targetWordCount: parseInt(e.target.value) || 0 })}
                  />
                </div>

                <div className="pt-2">
                  <label className="text-xs font-bold text-muted-foreground uppercase">Status</label>
                  <select 
                    className="w-full bg-secondary/20 border border-border rounded px-3 py-2 text-sm mt-1 focus:outline-none focus:border-primary"
                    value={project.status}
                    onChange={(e) => onUpdateProject({ status: e.target.value as PublishStatus })}
                  >
                    {Object.values(PublishStatus).map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
           </div>
        </div>

        {/* Column 2: Internationalization */}
        <div className="space-y-6">
           <div className="bg-card border border-border rounded-xl p-5 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5">
                <Globe className="w-24 h-24" />
              </div>
              
              <h3 className="text-sm font-bold uppercase text-muted-foreground flex items-center gap-2 mb-4 relative z-10">
                <Languages className="w-4 h-4" /> Translation Lab
              </h3>
              
              <p className="text-xs text-muted-foreground mb-4 relative z-10">
                Use AI to translate your entire manuscript while preserving structure.
                <br/><span className="text-yellow-500 font-bold">Warning: Replaces current text.</span>
              </p>
              
              <div className="space-y-3 relative z-10">
                <div className="space-y-1">
                   <label className="text-[10px] uppercase font-bold text-muted-foreground">Target Language</label>
                   <select 
                     className="w-full bg-background border border-border rounded px-3 py-2 text-sm"
                     value={targetLang}
                     onChange={(e) => setTargetLang(e.target.value)}
                   >
                     {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
                   </select>
                </div>

                <button 
                  onClick={handleTranslate}
                  disabled={isTranslating}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded-md text-sm font-medium transition-colors"
                >
                   {isTranslating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Rocket className="w-4 h-4" />}
                   Start Translation
                </button>
              </div>
           </div>
        </div>

        {/* Column 3: Export */}
        <div className="space-y-6">
           <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
              <h3 className="text-sm font-bold uppercase text-muted-foreground flex items-center gap-2 mb-4">
                <Download className="w-4 h-4" /> Final Export
              </h3>
              
              <div className="space-y-4">
                 <div className="flex items-center justify-between p-3 bg-secondary/10 rounded-lg border border-border">
                    <span className="text-sm flex items-center gap-2"><FileCheck className="w-4 h-4 text-primary" /> EPUB 3.0</span>
                    <span className="text-xs text-muted-foreground">Standard eBook</span>
                 </div>

                 <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                       <input 
                         type="checkbox" 
                         checked={settings.enableDropCaps} 
                         onChange={(e) => handleUpdateSettings({ enableDropCaps: e.target.checked })}
                         className="rounded border-border bg-secondary text-primary focus:ring-primary" 
                       />
                       <span>Enable "Drop Caps" Styling</span>
                    </label>
                 </div>

                 <button 
                   onClick={handleDownloadEpub}
                   disabled={isExporting}
                   className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary text-primary-foreground rounded-md text-sm font-bold hover:opacity-90 transition-colors shadow-md"
                 >
                   {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                   Download eBook
                 </button>
              </div>
           </div>
        </div>

      </div>
    </div>
  );
};

export default PublishView;
