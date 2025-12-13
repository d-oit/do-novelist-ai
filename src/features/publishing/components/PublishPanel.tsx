import {
  Download,
  Globe,
  Rocket,
  Target,
  Languages,
  Loader2,
  FileCheck,
  Settings,
} from 'lucide-react';
import type { FC } from 'react';
import { useState } from 'react';

import { generateEpub } from '@/features/publishing/services/epubService';
import { translateContent } from '@/lib/ai';

import type { Project, Chapter } from '@shared/types';
import { PublishStatus } from '@shared/types';

interface PublishPanelProps {
  project: Project;
  onUpdateProject: (updates: Partial<Project>) => void;
  onUpdateChapter: (chapterId: string, updates: Partial<Chapter>) => void;
}

// Language mapping from full names to ISO codes
const languageNameToCode = (
  langName: string,
): 'en' | 'es' | 'fr' | 'de' | 'it' | 'pt' | 'ja' | 'ko' | 'zh' => {
  const mapping: Record<string, 'en' | 'es' | 'fr' | 'de' | 'it' | 'pt' | 'ja' | 'ko' | 'zh'> = {
    English: 'en',
    Spanish: 'es',
    French: 'fr',
    German: 'de',
    Italian: 'it',
    Portuguese: 'pt',
    Japanese: 'ja',
    Chinese: 'zh',
    Russian: 'ko', // Using 'ko' for Russian as per the Project type definition
  };
  return mapping[langName] || 'en';
};

const PublishPanel: FC<PublishPanelProps> = ({
  project,
  onUpdateProject,
  onUpdateChapter,
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [targetLang, setTargetLang] = useState('Spanish');

  // Settings Helpers
  const settings = project.settings ?? { enableDropCaps: true };

  const handleUpdateSettings = (newSettings: Partial<typeof settings>): void => {
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
      const blob = await generateEpub(project, settings.enableDropCaps);
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
      onUpdateProject({ language: languageNameToCode(targetLang) });
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

  const LANGUAGES = [
    'English',
    'Spanish',
    'French',
    'German',
    'Italian',
    'Portuguese',
    'Japanese',
    'Chinese',
    'Russian',
  ];

  // Normalize language for display (handle 'en' vs 'English')
  const currentLanguage =
    LANGUAGES.find(l => l.toLowerCase() === (project.language ?? '').toLowerCase()) ??
    (project.language === 'en' ? 'English' : project.language) ??
    'English';

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
                  data-testid='publish-status-select'
                  className='w-full rounded border border-border bg-secondary/20 px-3 py-2 text-xs focus:border-primary focus:outline-none'
                  value={project.status}
                  onChange={e => onUpdateProject({ status: e.target.value as PublishStatus })}
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
                  data-testid='publish-language-select'
                  className='w-full rounded border border-border bg-secondary/20 px-3 py-2 text-xs focus:border-primary focus:outline-none'
                  value={currentLanguage}
                  onChange={e => onUpdateProject({ language: languageNameToCode(e.target.value) })}
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
                  data-testid='publish-target-words-input'
                  type='number'
                  className='w-full rounded border border-border bg-secondary/20 px-3 py-2 text-xs focus:border-primary focus:outline-none'
                  value={targetWords}
                  onChange={e =>
                    onUpdateProject({ targetWordCount: parseInt(e.target.value) ?? 0 })
                  }
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
              <div className='h-2 overflow-hidden rounded-full bg-secondary'>
                <div
                  className='h-full bg-primary transition-all duration-1000'
                  style={{ width: `${progress}%` }}
                />
              </div>
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
                  data-testid='export-dropcaps-checkbox'
                  type='checkbox'
                  checked={settings.enableDropCaps}
                  onChange={e => handleUpdateSettings({ enableDropCaps: e.target.checked })}
                  className='h-4 w-4 rounded border-border bg-secondary text-primary focus:ring-primary'
                />
              </label>
            </div>

            <button
              data-testid='export-epub-btn'
              onClick={() => void handleDownloadEpub()}
              disabled={isExporting}
              className='flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-3 text-sm font-bold text-primary-foreground shadow-md transition-colors hover:opacity-90 disabled:opacity-50'
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

        {/* Block 3: Translation */}
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
    </div>
  );
};

export default PublishPanel;
