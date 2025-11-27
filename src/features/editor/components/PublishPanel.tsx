
import React, { useState } from 'react';
import { Project, PublishStatus, Chapter, ProjectSettings } from '../../../types';
import { generateEpub } from '../../../lib/epub';
import { translateContent } from '../../../lib/gemini';
import { usePublishingAnalytics } from '../../publishing';
import { Download, Globe, Rocket, Target, Languages, Loader2, FileCheck, Settings, BarChart3, Upload, TrendingUp } from 'lucide-react';
import PublishingDashboard from '../../publishing/components/PublishingDashboard';
import PublishingSetup from '../../publishing/components/PublishingSetup';

interface PublishPanelProps {
  project: Project;
  onUpdateProject: (updates: Partial<Project>) => void;
  onUpdateChapter: (chapterId: string, updates: Partial<Chapter>) => void;
}

const PublishPanel: React.FC<PublishPanelProps> = ({ project, onUpdateProject, onUpdateChapter }) => {
  const [isExporting, setIsExporting] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [targetLang, setTargetLang] = useState('Spanish');

  // Publishing analytics hook
  const publishingAnalytics = usePublishingAnalytics();

  // UI State
  const [showPublishingSetup, setShowPublishingSetup] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [currentPublicationId, setCurrentPublicationId] = useState<string | null>(null);

  // Settings Helpers (Defensive default)
  const settings: ProjectSettings = project.settings || { enableDropCaps: true };
  const enableDropCaps = settings.enableDropCaps;

  const handleUpdateSettings = (newSettings: Partial<ProjectSettings>) => {
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
      const blob = await generateEpub(project, enableDropCaps);
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
      const code = LANGUAGE_CODES[targetLang];
      if (code) {
        onUpdateProject({ language: code as any });
      }
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

  const LANGUAGE_CODES: Record<string, "en" | "es" | "fr" | "de" | "it" | "pt" | "ja" | "ko" | "zh"> = {
    'English': 'en',
    'Spanish': 'es',
    'French': 'fr',
    'German': 'de',
    'Italian': 'it',
    'Portuguese': 'pt',
    'Japanese': 'ja',
    'Chinese': 'zh'
  };

  const LANGUAGES = Object.keys(LANGUAGE_CODES);

  // Normalize language for display (handle 'en' vs 'English')
  const currentLanguage = LANGUAGES.find(l => LANGUAGE_CODES[l] === project.language) || 'English';

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
                  data-testid="publish-status-select"
                >
                  {Object.values(PublishStatus).map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Language</label>
                <select
                  className="w-full bg-secondary/20 border border-border rounded px-3 py-2 text-xs focus:outline-none focus:border-primary"
                  value={currentLanguage}
                  onChange={(e) => {
                    const selectedName = e.target.value;
                    const code = LANGUAGE_CODES[selectedName];
                    if (code) {
                      onUpdateProject({ language: code });
                    }
                  }}
                  data-testid="publish-language-select"
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
                  data-testid="publish-target-words-input"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Progress</span>
                <span className="font-mono text-foreground">{totalWords} / {targetWords} words</span>
              </div>
              <div className="h-2 bg-secondary rounded-full overflow-hidden border border-border/50">
                <div className={`h-full transition-all duration-1000 ${progress >= 100 ? 'bg-green-500' : 'bg-primary'}`} style={{ width: `${progress}%` }}></div>
              </div>
              {progress >= 100 && <p className="text-[10px] text-green-500 font-bold text-right">Goal Reached!</p>}
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
                  checked={enableDropCaps}
                  onChange={(e) => handleUpdateSettings({ enableDropCaps: e.target.checked })}
                  className="w-4 h-4 rounded border-border bg-secondary text-primary focus:ring-primary"
                  data-testid="export-dropcaps-checkbox"
                />
              </label>
            </div>

            <button
              onClick={handleDownloadEpub}
              disabled={isExporting}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary text-primary-foreground rounded-md text-sm font-bold hover:opacity-90 transition-colors shadow-md disabled:opacity-50"
              data-testid="export-epub-btn"
            >
              {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              Download Book
            </button>

          </div>
        </section>

        {/* Block 3: Publishing Analytics */}
        <section className="space-y-4 lg:col-span-2">
          <h3 className="text-sm font-bold uppercase text-muted-foreground flex items-center gap-2 border-b border-border pb-2">
            <Rocket className="w-4 h-4" /> Publishing & Analytics
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gradient-to-br from-card to-green-500/5 border border-border rounded-lg p-5">
              <div className="space-y-3">
                <h4 className="text-sm font-bold flex items-center gap-2">
                  <Upload className="w-4 h-4 text-green-600" />
                  Publish Your Book
                </h4>
                <p className="text-xs text-muted-foreground">
                  Share your story with readers across multiple platforms. Track engagement and get valuable insights.
                </p>

                {publishingAnalytics.publications.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-green-600">
                      📚 {publishingAnalytics.publications.length} publication{publishingAnalytics.publications.length !== 1 ? 's' : ''} found
                    </p>
                    {publishingAnalytics.publications.slice(0, 2).map(pub => (
                      <div key={pub.id} className="flex items-center justify-between text-xs bg-secondary/30 p-2 rounded">
                        <span>{pub.title}</span>
                        <button
                          onClick={() => {
                            setCurrentPublicationId(pub.id);
                            setShowAnalytics(true);
                          }}
                          className="text-primary hover:text-primary/80"
                        >
                          <BarChart3 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <button
                  onClick={() => setShowPublishingSetup(true)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm font-bold transition-colors shadow-md"
                >
                  <Upload className="w-4 h-4" />
                  Publish to Platforms
                </button>
              </div>
            </div>

            <div className="bg-gradient-to-br from-card to-blue-500/5 border border-border rounded-lg p-5">
              <div className="space-y-3">
                <h4 className="text-sm font-bold flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-blue-600" />
                  Reader Analytics
                </h4>
                <p className="text-xs text-muted-foreground">
                  Track reader engagement, reviews, and performance across all publishing platforms.
                </p>

                {publishingAnalytics.publications.length > 0 ? (
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-secondary/30 p-2 rounded text-center">
                        <div className="font-bold text-blue-600">
                          {publishingAnalytics.analytics?.views.toLocaleString() || '0'}
                        </div>
                        <div className="text-muted-foreground">Total Views</div>
                      </div>
                      <div className="bg-secondary/30 p-2 rounded text-center">
                        <div className="font-bold text-yellow-600">
                          ⭐ {publishingAnalytics.averageRating.toFixed(1)}
                        </div>
                        <div className="text-muted-foreground">Rating</div>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setCurrentPublicationId(publishingAnalytics.publications[0]?.id || null);
                        setShowAnalytics(true);
                      }}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-bold transition-colors"
                    >
                      <TrendingUp className="w-4 h-4" />
                      View Full Analytics
                    </button>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-xs text-muted-foreground mb-2">No publications yet</p>
                    <button
                      onClick={() => setShowPublishingSetup(true)}
                      className="text-xs text-primary hover:text-primary/80 underline"
                    >
                      Publish your book first
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Block 4: Translation */}
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

      {/* Overlays */}
      {showPublishingSetup && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm p-4 md:p-8 flex items-center justify-center">
          <PublishingSetup
            project={project}
            onPublishingComplete={(pub) => {
              console.log('Published:', pub);
              setShowPublishingSetup(false);
              // Refresh analytics if needed
              publishingAnalytics.loadPublicationData(pub.id);
            }}
            onClose={() => setShowPublishingSetup(false)}
            className="w-full max-w-5xl h-[90vh] shadow-2xl"
          />
        </div>
      )}

      {showAnalytics && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm p-4 md:p-8 flex items-center justify-center">
          <PublishingDashboard
            project={project}
            publicationId={currentPublicationId || undefined}
            onClose={() => setShowAnalytics(false)}
            className="w-full max-w-5xl h-[90vh] shadow-2xl"
          />
        </div>
      )}
    </div>
  );
};

export default PublishPanel;
