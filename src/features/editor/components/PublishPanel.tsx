import {
  Download,
  Globe,
  Rocket,
  Target,
  Languages,
  Loader2,
  FileCheck,
  Settings,
  BarChart3,
  Upload,
  TrendingUp,
} from 'lucide-react';
import React, { useState } from 'react';
import { cn } from '@/lib/utils';

import { translateContent } from '../../../lib/ai';
import { generateEpub } from '../../../lib/epub';
import type { Project, Chapter, ProjectSettings } from '@/types';
import { PublishStatus } from '@/types';
import { usePublishingAnalytics } from '../../publishing';
import PublishingDashboard from '../../publishing/components/PublishingDashboard';
import PublishingSetup from '../../publishing/components/PublishingSetup';
import { logger } from '@/lib/logging/logger';

interface PublishPanelProps {
  project: Project;
  onUpdateProject: (updates: Partial<Project>) => void;
  onUpdateChapter: (chapterId: string, updates: Partial<Chapter>) => void;
}

const PublishPanel: React.FC<PublishPanelProps> = ({
  project,
  onUpdateProject,
  onUpdateChapter,
}) => {
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
  const settings: ProjectSettings = project.settings ?? { enableDropCaps: true };
  const enableDropCaps = settings.enableDropCaps;

  const handleUpdateSettings = (newSettings: Partial<ProjectSettings>): void => {
    onUpdateProject({
      settings: { ...settings, ...newSettings },
    });
  };

  // Calculate Stats
  const totalWords = project.chapters.reduce(
    (acc, ch) =>
      acc +
      (ch.content
        .trim()
        .split(/\s+/)
        .filter(w => w.length > 0).length ?? 0),
    0,
  );
  const targetWords = project.targetWordCount ?? 50000;
  const progress = Math.min(100, Math.round((totalWords / targetWords) * 100));

  const handleDownloadEpub = async (): Promise<void> => {
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
    } catch {
      alert('Failed to generate ePub.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleTranslate = async (): Promise<void> => {
    if (
      !confirm(
        `This will overwrite the content of your chapters with a ${targetLang} translation. It is recommended to duplicate your project first (Not implemented). Proceed?`,
      )
    )
      return;

    setIsTranslating(true);
    try {
      const code = LANGUAGE_CODES[targetLang];
      if (code) {
        onUpdateProject({ language: code });
      }
      for (const chapter of project.chapters) {
        if (chapter.content) {
          const translated = await translateContent(chapter.content, targetLang);
          const translatedTitle = await translateContent(chapter.title, targetLang);
          onUpdateChapter(chapter.id, {
            content: translated,
            title: translatedTitle.replace(/[\#\*\"]/g, '').trim(),
          });
        }
      }
      alert('Translation complete!');
    } catch {
      alert('Translation failed midway.');
    } finally {
      setIsTranslating(false);
    }
  };

  const LANGUAGE_CODES: Record<
    string,
    'en' | 'es' | 'fr' | 'de' | 'it' | 'pt' | 'ja' | 'ko' | 'zh'
  > = {
    English: 'en',
    Spanish: 'es',
    French: 'fr',
    German: 'de',
    Italian: 'it',
    Portuguese: 'pt',
    Japanese: 'ja',
    Chinese: 'zh',
  };

  const LANGUAGES = Object.keys(LANGUAGE_CODES);

  // Normalize language for display (handle 'en' vs 'English')
  const currentLanguage = LANGUAGES.find(l => LANGUAGE_CODES[l] === project.language) ?? 'English';

  return (
    <div className='animate-in fade-in mx-auto max-w-4xl space-y-8 p-6 duration-500'>
      <div className='mb-8 space-y-2'>
        <h2 className='flex items-center gap-3 font-serif text-2xl font-bold'>
          <Rocket className='h-6 w-6 text-primary' />
          Publishing & Export
        </h2>
        <p className='text-sm text-muted-foreground'>
          Prepare your manuscript for distribution. Configure formatting, track goals, and export.
        </p>
      </div>

      <div className='grid grid-cols-1 gap-8 lg:grid-cols-2'>
        {/* Block 1: Manuscript Status & Goals */}
        <section className='space-y-4'>
          <h3 className='flex items-center gap-2 border-b border-border pb-2 text-sm font-bold uppercase text-muted-foreground'>
            <Target className='h-4 w-4' /> Manuscript Controls
          </h3>

          <div className='space-y-5 rounded-lg border border-border bg-card p-5 shadow-sm'>
            <div className='grid grid-cols-1 gap-4 sm:grid-cols-3'>
              <div className='space-y-1.5'>
                <label className='text-[10px] font-bold uppercase text-muted-foreground'>
                  Project Status
                </label>
                <select
                  className='w-full rounded border border-border bg-secondary/20 px-3 py-2 text-xs focus:border-primary focus:outline-none'
                  value={project.status}
                  onChange={e => onUpdateProject({ status: e.target.value as PublishStatus })}
                  data-testid='publish-status-select'
                >
                  {Object.values(PublishStatus).map(s => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div className='space-y-1.5'>
                <label className='text-[10px] font-bold uppercase text-muted-foreground'>
                  Language
                </label>
                <select
                  className='w-full rounded border border-border bg-secondary/20 px-3 py-2 text-xs focus:border-primary focus:outline-none'
                  value={currentLanguage}
                  onChange={e => {
                    const selectedName = e.target.value;
                    const code = LANGUAGE_CODES[selectedName];
                    if (code) {
                      onUpdateProject({ language: code });
                    }
                  }}
                  data-testid='publish-language-select'
                >
                  {LANGUAGES.map(l => (
                    <option key={l} value={l}>
                      {l}
                    </option>
                  ))}
                </select>
              </div>

              <div className='space-y-1.5'>
                <label className='text-[10px] font-bold uppercase text-muted-foreground'>
                  Target Words
                </label>
                <input
                  type='number'
                  className='w-full rounded border border-border bg-secondary/20 px-3 py-2 text-xs focus:border-primary focus:outline-none'
                  value={targetWords}
                  onChange={e =>
                    onUpdateProject({ targetWordCount: parseInt(e.target.value) ?? 0 })
                  }
                  data-testid='publish-target-words-input'
                />
              </div>
            </div>

            <div className='space-y-2'>
              <div className='flex justify-between text-xs text-muted-foreground'>
                <span>Progress</span>
                <span className='font-mono text-foreground'>
                  {totalWords} / {targetWords} words
                </span>
              </div>
              <div className='h-2 overflow-hidden rounded-full border border-border/50 bg-secondary'>
                <div
                  className={cn(
                    'h-full transition-all duration-1000',
                    progress >= 100 ? 'bg-green-500' : 'bg-primary',
                  )}
                  style={{ width: `${progress}%` }}
                />
              </div>
              {progress >= 100 && (
                <p className='text-right text-[10px] font-bold text-green-500'>Goal Reached!</p>
              )}
            </div>
          </div>
        </section>

        {/* Block 2: Export Settings */}
        <section className='space-y-4'>
          <h3 className='flex items-center gap-2 border-b border-border pb-2 text-sm font-bold uppercase text-muted-foreground'>
            <Settings className='h-4 w-4' /> Format & Export
          </h3>

          <div className='space-y-5 rounded-lg border border-border bg-card p-5 shadow-sm'>
            <div className='flex items-center justify-between rounded-md border border-border/50 bg-secondary/10 p-3'>
              <div className='flex items-center gap-3'>
                <div className='rounded border border-border bg-background p-2'>
                  <FileCheck className='h-4 w-4 text-primary' />
                </div>
                <div>
                  <div className='text-sm font-bold'>EPUB 3.0</div>
                  <div className='text-[10px] text-muted-foreground'>Universal eBook Format</div>
                </div>
              </div>
            </div>

            <div className='space-y-3'>
              <label className='group flex cursor-pointer items-center justify-between text-sm'>
                <span className='text-muted-foreground transition-colors group-hover:text-foreground'>
                  Use "Drop Caps" styling
                </span>
                <input
                  type='checkbox'
                  checked={enableDropCaps}
                  onChange={e => handleUpdateSettings({ enableDropCaps: e.target.checked })}
                  className='h-4 w-4 rounded border-border bg-secondary text-primary focus:ring-primary'
                  data-testid='export-dropcaps-checkbox'
                />
              </label>
            </div>

            <button
              onClick={() => void handleDownloadEpub()}
              disabled={isExporting}
              className='flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-3 text-sm font-bold text-primary-foreground shadow-md transition-colors hover:opacity-90 disabled:opacity-50'
              data-testid='export-epub-btn'
            >
              {isExporting ? (
                <Loader2 className='h-4 w-4 animate-spin' />
              ) : (
                <Download className='h-4 w-4' />
              )}
              Download Book
            </button>
          </div>
        </section>

        {/* Block 3: Publishing Analytics */}
        <section className='space-y-4 lg:col-span-2'>
          <h3 className='flex items-center gap-2 border-b border-border pb-2 text-sm font-bold uppercase text-muted-foreground'>
            <Rocket className='h-4 w-4' /> Publishing & Analytics
          </h3>

          <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
            <div className='rounded-lg border border-border bg-gradient-to-br from-card to-green-500/5 p-5'>
              <div className='space-y-3'>
                <h4 className='flex items-center gap-2 text-sm font-bold'>
                  <Upload className='h-4 w-4 text-green-600' />
                  Publish Your Book
                </h4>
                <p className='text-xs text-muted-foreground'>
                  Share your story with readers across multiple platforms. Track engagement and get
                  valuable insights.
                </p>

                {publishingAnalytics.publications.length > 0 && (
                  <div className='space-y-2'>
                    <p className='text-xs font-medium text-green-600'>
                      📚 {publishingAnalytics.publications.length} publication
                      {publishingAnalytics.publications.length !== 1 ? 's' : ''} found
                    </p>
                    {publishingAnalytics.publications.slice(0, 2).map(pub => (
                      <div
                        key={pub.id}
                        className='flex items-center justify-between rounded bg-secondary/30 p-2 text-xs'
                      >
                        <span>{pub.title}</span>
                        <button
                          onClick={() => {
                            setCurrentPublicationId(pub.id);
                            setShowAnalytics(true);
                          }}
                          className='text-primary hover:text-primary/80'
                        >
                          <BarChart3 className='h-3 w-3' />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <button
                  onClick={() => setShowPublishingSetup(true)}
                  className='flex w-full items-center justify-center gap-2 rounded-md bg-green-600 px-4 py-3 text-sm font-bold text-white shadow-md transition-colors hover:bg-green-700'
                >
                  <Upload className='h-4 w-4' />
                  Publish to Platforms
                </button>
              </div>
            </div>

            <div className='rounded-lg border border-border bg-gradient-to-br from-card to-blue-500/5 p-5'>
              <div className='space-y-3'>
                <h4 className='flex items-center gap-2 text-sm font-bold'>
                  <BarChart3 className='h-4 w-4 text-blue-600' />
                  Reader Analytics
                </h4>
                <p className='text-xs text-muted-foreground'>
                  Track reader engagement, reviews, and performance across all publishing platforms.
                </p>

                {publishingAnalytics.publications.length > 0 ? (
                  <div className='space-y-2'>
                    <div className='grid grid-cols-2 gap-2 text-xs'>
                      <div className='rounded bg-secondary/30 p-2 text-center'>
                        <div className='font-bold text-blue-600'>
                          {publishingAnalytics.analytics?.views.toLocaleString() ?? '0'}
                        </div>
                        <div className='text-muted-foreground'>Total Views</div>
                      </div>
                      <div className='rounded bg-secondary/30 p-2 text-center'>
                        <div className='font-bold text-yellow-600'>
                          ⭐ {publishingAnalytics.averageRating.toFixed(1)}
                        </div>
                        <div className='text-muted-foreground'>Rating</div>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setCurrentPublicationId(publishingAnalytics.publications[0]?.id ?? null);
                        setShowAnalytics(true);
                      }}
                      className='flex w-full items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-blue-700'
                    >
                      <TrendingUp className='h-4 w-4' />
                      View Full Analytics
                    </button>
                  </div>
                ) : (
                  <div className='py-4 text-center'>
                    <p className='mb-2 text-xs text-muted-foreground'>No publications yet</p>
                    <button
                      onClick={() => setShowPublishingSetup(true)}
                      className='text-xs text-primary underline hover:text-primary/80'
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
        <section className='space-y-4 lg:col-span-2'>
          <h3 className='flex items-center gap-2 border-b border-border pb-2 text-sm font-bold uppercase text-muted-foreground'>
            <Globe className='h-4 w-4' /> Translation Engine
          </h3>

          <div className='flex flex-col items-center gap-6 rounded-lg border border-border bg-gradient-to-br from-card to-secondary/5 p-5 md:flex-row'>
            <div className='flex-1 space-y-2'>
              <h4 className='flex items-center gap-2 text-sm font-bold'>
                <Languages className='h-4 w-4 text-primary' />
                Translate Project
              </h4>
              <p className='text-xs text-muted-foreground'>
                Uses Gemini to translate all chapters while preserving Markdown formatting.
                <span className='text-yellow-600 dark:text-yellow-500'>
                  {' '}
                  Warning: This action is destructive to the current text.
                </span>
              </p>
            </div>

            <div className='flex w-full items-center gap-3 md:w-auto'>
              <select
                className='rounded border border-border bg-background px-3 py-2 text-xs focus:border-primary focus:outline-none'
                value={targetLang}
                onChange={e => setTargetLang(e.target.value)}
              >
                {LANGUAGES.map(l => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>

              <button
                onClick={() => void handleTranslate()}
                disabled={isTranslating}
                className='flex items-center gap-2 whitespace-nowrap rounded-md border border-border bg-secondary px-4 py-2 text-xs font-bold text-secondary-foreground transition-colors hover:bg-secondary/80'
              >
                {isTranslating ? (
                  <Loader2 className='h-3 w-3 animate-spin' />
                ) : (
                  <Rocket className='h-3 w-3' />
                )}
                Start Translation
              </button>
            </div>
          </div>
        </section>
      </div>

      {/* Overlays */}
      {showPublishingSetup && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm md:p-8'>
          <PublishingSetup
            project={project}
            onPublishingComplete={pub => {
              logger.info('Published:', { publicationId: pub.id, title: pub.title });
              setShowPublishingSetup(false);
              // Refresh analytics if needed
              void publishingAnalytics.loadPublicationData(pub.id);
            }}
            onClose={() => setShowPublishingSetup(false)}
            className='h-[90vh] w-full max-w-5xl shadow-2xl'
          />
        </div>
      )}

      {showAnalytics && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm md:p-8'>
          <PublishingDashboard
            project={project}
            publicationId={currentPublicationId ?? undefined}
            onClose={() => setShowAnalytics(false)}
            className='h-[90vh] w-full max-w-5xl shadow-2xl'
          />
        </div>
      )}
    </div>
  );
};

export default PublishPanel;
