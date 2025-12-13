import { Download, Globe, Rocket, Target, Languages, Loader2, FileCheck } from 'lucide-react';
import type { FC } from 'react';
import { useState } from 'react';

import { generateEpub } from '@/features/publishing/services/epubService';
import { translateContent } from '@/lib/ai';
import { cn } from '@/lib/utils';

import type { Project, Chapter } from '@shared/types';
import { PublishStatus } from '@shared/types';

interface PublishViewProps {
  project: Project;
  onUpdateProject: (updates: Partial<Project>) => void;
  onUpdateChapter: (chapterId: string, updates: Partial<Chapter>) => void;
}

const PublishView: FC<PublishViewProps> = ({ project, onUpdateProject, onUpdateChapter }) => {
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
      // Convert language name to code for Project type
      const languageMap: Record<
        string,
        'en' | 'es' | 'fr' | 'de' | 'it' | 'pt' | 'ja' | 'ko' | 'zh'
      > = {
        Spanish: 'es',
        French: 'fr',
        German: 'de',
        Italian: 'it',
        Portuguese: 'pt',
        Japanese: 'ja',
        Chinese: 'zh',
        Russian: 'ko',
      };
      onUpdateProject({ language: languageMap[targetLang] });
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
    'Spanish',
    'French',
    'German',
    'Italian',
    'Portuguese',
    'Japanese',
    'Chinese',
    'Russian',
  ];

  return (
    <div className='animate-in fade-in mx-auto max-w-5xl space-y-8 p-6 pb-20'>
      <div className='flex items-end justify-between border-b border-border pb-4'>
        <div>
          <h2 className='font-serif text-3xl font-bold'>Publishing Hub</h2>
          <p className='mt-1 text-muted-foreground'>
            Manage goals, translations, and final distribution.
          </p>
        </div>
        <div className='flex gap-2'>
          <span
            className={cn(
              'rounded-full border px-3 py-1 text-xs font-bold uppercase',
              project.status === PublishStatus.PUBLISHED
                ? 'border-green-500/20 bg-green-500/10 text-green-500'
                : 'border-border bg-secondary text-muted-foreground',
            )}
          >
            {project.status}
          </span>
        </div>
      </div>

      <div className='grid grid-cols-1 gap-6 md:grid-cols-3'>
        {/* Column 1: Goals & Stats */}
        <div className='space-y-6'>
          <div className='rounded-xl border border-border bg-card p-5 shadow-sm'>
            <h3 className='mb-4 flex items-center gap-2 text-sm font-bold uppercase text-muted-foreground'>
              <Target className='h-4 w-4' /> Manuscript Goals
            </h3>

            <div className='space-y-4'>
              <div>
                <div className='mb-1 flex justify-between text-sm'>
                  <span>Word Count</span>
                  <span className='font-mono'>
                    {totalWords} / {targetWords}
                  </span>
                </div>
                <div className='h-2 overflow-hidden rounded-full bg-secondary'>
                  <div
                    className='h-full bg-primary transition-all duration-1000'
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              <div className='pt-2'>
                <label className='text-xs font-bold uppercase text-muted-foreground'>
                  Set Target
                </label>
                <input
                  type='number'
                  className='mt-1 w-full rounded border border-border bg-secondary/20 px-3 py-2 text-sm focus:border-primary focus:outline-none'
                  value={targetWords}
                  onChange={e =>
                    onUpdateProject({ targetWordCount: parseInt(e.target.value) ?? 0 })
                  }
                />
              </div>

              <div className='pt-2'>
                <label className='text-xs font-bold uppercase text-muted-foreground'>Status</label>
                <select
                  className='mt-1 w-full rounded border border-border bg-secondary/20 px-3 py-2 text-sm focus:border-primary focus:outline-none'
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
            </div>
          </div>
        </div>

        {/* Column 2: Internationalization */}
        <div className='space-y-6'>
          <div className='relative overflow-hidden rounded-xl border border-border bg-card p-5 shadow-sm'>
            <div className='absolute right-0 top-0 p-4 opacity-5'>
              <Globe className='h-24 w-24' />
            </div>

            <h3 className='relative z-10 mb-4 flex items-center gap-2 text-sm font-bold uppercase text-muted-foreground'>
              <Languages className='h-4 w-4' /> Translation Lab
            </h3>

            <p className='relative z-10 mb-4 text-xs text-muted-foreground'>
              Use AI to translate your entire manuscript while preserving structure.
              <br />
              <span className='font-bold text-yellow-500'>Warning: Replaces current text.</span>
            </p>

            <div className='relative z-10 space-y-3'>
              <div className='space-y-1'>
                <label className='text-[10px] font-bold uppercase text-muted-foreground'>
                  Target Language
                </label>
                <select
                  className='w-full rounded border border-border bg-background px-3 py-2 text-sm'
                  value={targetLang}
                  onChange={e => setTargetLang(e.target.value)}
                >
                  {LANGUAGES.map(l => (
                    <option key={l} value={l}>
                      {l}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={() => void handleTranslate()}
                disabled={isTranslating}
                className='flex w-full items-center justify-center gap-2 rounded-md bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground transition-colors hover:bg-secondary/80'
              >
                {isTranslating ? (
                  <Loader2 className='h-4 w-4 animate-spin' />
                ) : (
                  <Rocket className='h-4 w-4' />
                )}
                Start Translation
              </button>
            </div>
          </div>
        </div>

        {/* Column 3: Export */}
        <div className='space-y-6'>
          <div className='rounded-xl border border-border bg-card p-5 shadow-sm'>
            <h3 className='mb-4 flex items-center gap-2 text-sm font-bold uppercase text-muted-foreground'>
              <Download className='h-4 w-4' /> Final Export
            </h3>

            <div className='space-y-4'>
              <div className='flex items-center justify-between rounded-lg border border-border bg-secondary/10 p-3'>
                <span className='flex items-center gap-2 text-sm'>
                  <FileCheck className='h-4 w-4 text-primary' /> EPUB 3.0
                </span>
                <span className='text-xs text-muted-foreground'>Standard eBook</span>
              </div>

              <div className='space-y-2'>
                <label className='flex cursor-pointer items-center gap-2 text-sm text-foreground'>
                  <input
                    type='checkbox'
                    checked={settings.enableDropCaps}
                    onChange={e => handleUpdateSettings({ enableDropCaps: e.target.checked })}
                    className='rounded border-border bg-secondary text-primary focus:ring-primary'
                  />
                  <span>Enable "Drop Caps" Styling</span>
                </label>
              </div>

              <button
                onClick={() => void handleDownloadEpub()}
                disabled={isExporting}
                className='flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-3 text-sm font-bold text-primary-foreground shadow-md transition-colors hover:opacity-90'
              >
                {isExporting ? (
                  <Loader2 className='h-4 w-4 animate-spin' />
                ) : (
                  <Download className='h-4 w-4' />
                )}
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
