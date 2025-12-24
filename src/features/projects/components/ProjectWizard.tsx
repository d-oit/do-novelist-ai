import {
  AlertCircle,
  Book,
  ChevronDown,
  ChevronUp,
  FileText,
  Loader2,
  Plus,
  Sparkles,
  Upload,
  Wand2,
  X,
} from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';

import { brainstormProject } from '@/lib/ai';
import { logger } from '@/lib/logging/logger';
import { cn, iconButtonTarget } from '@/lib/utils';

interface ProjectWizardProps {
  isOpen: boolean;
  onCreate: (title: string, style: string, idea: string, targetWordCount: number) => void;
  onCancel: () => void;
}

const ProjectWizard: React.FC<ProjectWizardProps> = ({ isOpen, onCreate, onCancel }) => {
  const [title, setTitle] = useState('');
  const [style, setStyle] = useState('');
  const [idea, setIdea] = useState('');
  const [activeTab, setActiveTab] = useState<'write' | 'upload'>('write');
  const [files, setFiles] = useState<File[]>([]);
  const [isReading, setIsReading] = useState(false);

  // Optional Advanced Fields
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [tone, setTone] = useState('');
  const [audience, setAudience] = useState('');
  const [customInstructions, setCustomInstructions] = useState('');
  const [targetWordCount, setTargetWordCount] = useState(50000);

  // Brainstorming States
  const [brainstorming, setBrainstorming] = useState<Record<string, boolean>>({});
  const [brainstormError, setBrainstormError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const ideaTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Reset state when wizard opens
  useEffect(() => {
    if (isOpen) {
      setTitle('');
      setStyle('');
      setIdea('');
      setFiles([]);
      setTone('');
      setAudience('');
      setCustomInstructions('');
      setTargetWordCount(50000);
      setShowAdvanced(false);
      setActiveTab('write');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleBrainstorm = async (field: 'title' | 'style' | 'idea'): Promise<void> => {
    // Construct a rich context including tone and audience if available
    let promptContext = idea;
    if (tone && tone !== 'Neutral') promptContext += `\nDesired Tone: ${tone}`;
    if (audience && audience !== 'General') promptContext += `\nTarget Audience: ${audience}`;

    if (!promptContext.trim()) {
      if (field === 'idea') {
        setIdea('A story about...');
      }
      return;
    }

    setBrainstorming(prev => ({ ...prev, [field]: true }));
    setBrainstormError(null);
    try {
      const result = await brainstormProject(promptContext, field);
      if (result !== null) {
        if (field === 'title') setTitle(result);
        if (field === 'style') setStyle(result);
        if (field === 'idea') setIdea(result);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      logger.error('AI brainstorming failed', { component: 'ProjectWizard', error: err, field });
      // Provide user-friendly messages for common errors
      if (errorMessage.includes('402') || errorMessage.includes('Payment')) {
        setBrainstormError(
          'AI service requires payment setup. Please check your Vercel AI Gateway billing.',
        );
      } else if (errorMessage.includes('401') || errorMessage.includes('Unauthorized')) {
        setBrainstormError('API key is invalid or expired. Please check your settings.');
      } else if (errorMessage.includes('429') || errorMessage.includes('rate limit')) {
        setBrainstormError('Too many requests. Please wait a moment and try again.');
      } else {
        setBrainstormError(`AI brainstorming failed: ${errorMessage}`);
      }
    } finally {
      setBrainstorming(prev => ({ ...prev, [field]: false }));
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles: File[] = Array.from(e.target.files);
      setFiles(prev => [...prev, ...newFiles]);
      setIsReading(true);

      for (const file of newFiles) {
        try {
          if (
            file.type.startsWith('text/') ||
            file.name.endsWith('.md') ||
            file.name.endsWith('.json')
          ) {
            const text = await file.text();
            setIdea(prev => prev + `\n\n--- Content from ${file.name} ---\n${text}`);
          } else {
            setIdea(
              prev => prev + `\n\n[Attached File: ${file.name} - Binary content omitted in demo]`,
            );
          }
        } catch (err) {
          logger.error('Error reading file', {
            component: 'ProjectWizard',
            error: err,
            fileName: file.name,
          });
        }
      }
      setIsReading(false);
    }
  };

  const handleSubmit = (): void => {
    if (!title || !style || !idea) return;

    // Combine basic style with advanced options if present
    let fullStyle = style;
    const extras = [];
    if (tone && tone !== 'Neutral') extras.push(`Tone: ${tone}`);
    if (audience && audience !== 'General') extras.push(`Target Audience: ${audience}`);
    if (customInstructions) extras.push(`Instructions: ${customInstructions}`);

    if (extras.length > 0) {
      fullStyle += `\n\n[Additional Guidance]\n${extras.join('\n')}`;
    }

    onCreate(title, fullStyle, idea, targetWordCount);
  };

  const GENRES = [
    'Sci-Fi / Cyberpunk',
    'High Fantasy',
    'Mystery / Thriller',
    'Horror',
    'Romance',
    'Historical Fiction',
    'Non-Fiction / Business',
    'Self-Help',
    'Memoir',
    'Literary Fiction',
    'Young Adult Dystopian',
    'Space Opera',
    'True Crime',
    'Biography',
    'Satire',
  ];

  const TONES = [
    'Neutral',
    'Dark & Gritty',
    'Humorous',
    'Optimistic',
    'Academic',
    'Poetic',
    'Fast-paced',
    'Atmospheric',
    'Whimsical',
  ];
  const AUDIENCES = [
    'General',
    'Adult',
    'Young Adult (YA)',
    'Middle Grade',
    'Children',
    'Professional',
    'Academics',
  ];

  return (
    <div
      className='fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-md'
      data-testid='project-wizard-overlay'
    >
      <div className='animate-in fade-in zoom-in-95 flex h-full w-full flex-col overflow-hidden bg-card shadow-2xl duration-200 md:m-4 md:h-[calc(100dvh-2rem)] md:max-w-4xl md:rounded-xl md:border md:border-border lg:max-w-5xl'>
        {/* Header */}
        <div className='flex shrink-0 items-center justify-between border-b border-border bg-secondary/30 p-6'>
          <div>
            <h2 className='flex items-center gap-2 text-xl font-bold'>
              <Sparkles className='h-5 w-5 text-primary' />
              New Book Project
            </h2>
            <p className='text-sm text-muted-foreground'>
              Initialize the GOAP engine with your creative vision.
            </p>
          </div>
          <button
            onClick={onCancel}
            className={iconButtonTarget(
              'rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground',
            )}
            aria-label='Close project wizard'
            data-testid='wizard-cancel-btn'
          >
            <X className='h-5 w-5' />
          </button>
        </div>

        {/* Body */}
        <div className='custom-scrollbar space-y-6 overflow-y-auto p-6'>
          {/* Step 2 (Moved up for flow): Source Material */}
          <div className='space-y-2'>
            <label className='flex items-center justify-between text-xs font-bold uppercase text-muted-foreground'>
              <span>1. Core Idea / Source Material</span>
              <button
                onClick={() => void handleBrainstorm('idea')}
                disabled={(!idea && !tone && !audience) || brainstorming.idea}
                className='flex items-center gap-1.5 rounded border border-border bg-secondary px-2 py-1 text-[10px] text-primary transition-all hover:bg-secondary/80 disabled:opacity-50'
                data-testid='wizard-brainstorm-idea'
              >
                {brainstorming.idea === true ? (
                  <Loader2 className='h-3 w-3 animate-spin' />
                ) : (
                  <Sparkles className='h-3 w-3' />
                )}
                Enhance Idea
              </button>
            </label>

            <div className='overflow-hidden rounded-lg border border-border'>
              <div className='flex border-b border-border bg-secondary/20'>
                <button
                  onClick={() => setActiveTab('write')}
                  className={cn(
                    'flex flex-1 items-center justify-center gap-2 px-4 py-2 text-xs font-medium transition-colors',
                    activeTab === 'write'
                      ? 'border-r border-border bg-card text-primary'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  <Book className='h-3 w-3' /> Write Idea
                </button>
                <button
                  onClick={() => setActiveTab('upload')}
                  className={cn(
                    'flex flex-1 items-center justify-center gap-2 px-4 py-2 text-xs font-medium transition-colors',
                    activeTab === 'upload'
                      ? 'border-l border-border bg-card text-primary'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  <Upload className='h-3 w-3' /> Upload Files
                </button>
              </div>

              <div className='min-h-[200px] flex-1 bg-card p-4'>
                {activeTab === 'write' ? (
                  <textarea
                    className='h-full min-h-[180px] w-full resize-y bg-transparent font-mono text-sm leading-relaxed text-foreground placeholder:text-muted-foreground focus:outline-none'
                    placeholder='Describe your plot, characters, and themes here...

Examples:
• A story about a detective who can see ghosts...
• In a world where dreams are currency...
• Two rival chefs fall in love during a cooking competition...'
                    value={idea}
                    onChange={e => setIdea(e.target.value)}
                    onKeyDown={e => {
                      // Ctrl/Cmd + Enter to submit
                      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                        e.preventDefault();
                        if (title && style && idea) handleSubmit();
                      }
                    }}
                    ref={ideaTextareaRef}
                    data-testid='wizard-idea-input'
                  />
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className='group flex h-full min-h-[180px] w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-secondary/5 transition-all hover:border-primary/50 hover:bg-secondary/10'
                  >
                    <input
                      type='file'
                      multiple
                      ref={fileInputRef}
                      className='hidden'
                      accept='.txt,.md,.json'
                      onChange={e => void handleFileChange(e)}
                    />
                    <div className='mb-4 rounded-full bg-secondary/50 p-4 transition-transform group-hover:scale-110'>
                      <Upload className='h-8 w-8 text-muted-foreground group-hover:text-primary' />
                    </div>
                    <p className='text-base font-medium text-foreground'>
                      Click or drag files here
                    </p>
                    <p className='mt-2 text-sm text-muted-foreground'>Supports .txt, .md, .json</p>
                    {isReading && (
                      <p className='mt-3 animate-pulse text-sm text-primary'>
                        Reading file content...
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Error Banner */}
            {brainstormError && (
              <div className='flex items-start gap-3 rounded-lg border border-red-500/30 bg-red-500/10 p-4'>
                <AlertCircle className='mt-0.5 h-5 w-5 shrink-0 text-red-500' />
                <div className='flex-1'>
                  <p className='text-sm font-medium text-red-600 dark:text-red-400'>
                    {brainstormError}
                  </p>
                </div>
                <button
                  onClick={() => setBrainstormError(null)}
                  className='shrink-0 rounded p-1 text-red-500 hover:bg-red-500/20'
                  aria-label='Dismiss error'
                >
                  <X className='h-4 w-4' />
                </button>
              </div>
            )}

            {files.length > 0 && (
              <div className='flex flex-wrap gap-2 pt-2'>
                {files.map((f, i) => (
                  <div
                    key={i}
                    className='flex items-center gap-1 rounded border border-primary/20 bg-primary/10 px-2 py-1 text-[10px] text-primary'
                  >
                    <FileText className='h-3 w-3' />
                    <span className='max-w-[100px] truncate'>{f.name}</span>
                    <button
                      onClick={() => setFiles(files.filter((_, idx) => idx !== i))}
                      className='hover:text-destructive'
                    >
                      <X className='h-3 w-3' />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Step 1: Meta Data */}
          <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
            <div className='space-y-2'>
              <label className='text-xs font-bold uppercase text-muted-foreground'>
                2. Book Title
              </label>
              <div className='flex gap-2'>
                <input
                  className='flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary'
                  placeholder='e.g. The Martian Chronicles'
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  data-testid='wizard-title-input'
                />
                <button
                  onClick={() => void handleBrainstorm('title')}
                  disabled={!idea || brainstorming.title}
                  className='flex items-center justify-center rounded-md border border-border bg-secondary px-3 text-primary transition-colors hover:bg-secondary/80 disabled:cursor-not-allowed disabled:opacity-50'
                  title='Generate Title from Idea'
                  data-testid='wizard-brainstorm-title'
                >
                  {brainstorming.title === true ? (
                    <Loader2 className='h-4 w-4 animate-spin' />
                  ) : (
                    <Wand2 className='h-4 w-4' />
                  )}
                </button>
              </div>
            </div>

            <div className='space-y-2'>
              <label className='text-xs font-bold uppercase text-muted-foreground'>
                3. Genre / Style
              </label>
              <div className='flex gap-2'>
                <input
                  className='flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary'
                  placeholder='e.g. Dark Fantasy, lyrical prose'
                  value={style}
                  onChange={e => setStyle(e.target.value)}
                  data-testid='wizard-style-input'
                />
                <button
                  onClick={() => void handleBrainstorm('style')}
                  disabled={!idea || brainstorming.style}
                  className='flex items-center justify-center rounded-md border border-border bg-secondary px-3 text-primary transition-colors hover:bg-secondary/80 disabled:cursor-not-allowed disabled:opacity-50'
                  title='Suggest Style from Idea'
                  data-testid='wizard-brainstorm-style'
                >
                  {brainstorming.style === true ? (
                    <Loader2 className='h-4 w-4 animate-spin' />
                  ) : (
                    <Wand2 className='h-4 w-4' />
                  )}
                </button>
              </div>
              <div className='mt-2 flex flex-wrap gap-1.5'>
                {GENRES.slice(0, 5).map(g => (
                  <button
                    key={g}
                    onClick={() => setStyle(g)}
                    className='rounded-full bg-secondary px-3 py-1 text-xs font-medium text-foreground transition-colors hover:bg-primary/20 hover:text-primary'
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Advanced Options Accordion */}
          <div className='overflow-hidden rounded-lg border border-border'>
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className='flex w-full items-center justify-between bg-secondary/10 p-3 transition-colors hover:bg-secondary/20'
            >
              <span className='text-xs font-bold uppercase text-muted-foreground'>
                Advanced AI Guidance & Goals (Optional)
              </span>
              {showAdvanced ? (
                <ChevronUp className='h-4 w-4 text-muted-foreground' />
              ) : (
                <ChevronDown className='h-4 w-4 text-muted-foreground' />
              )}
            </button>

            {showAdvanced && (
              <div className='animate-in slide-in-from-top-2 space-y-4 bg-card p-4'>
                <div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
                  {/* Tone Input with Presets */}
                  <div className='space-y-1'>
                    <label className='text-[10px] font-bold uppercase text-muted-foreground'>
                      Tone
                    </label>
                    <div className='flex gap-2'>
                      <input
                        className='flex-1 rounded-md border border-border bg-background px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary'
                        placeholder='e.g. Dark & Gritty'
                        value={tone}
                        onChange={e => setTone(e.target.value)}
                      />
                      <div className='relative shrink-0'>
                        <select
                          className='h-full w-24 cursor-pointer appearance-none rounded-md border border-border bg-secondary px-3 py-2 pr-8 text-xs outline-none hover:bg-secondary/80 focus:border-primary'
                          onChange={e => {
                            if (e.target.value) setTone(e.target.value);
                            e.target.value = '';
                          }}
                        >
                          <option value=''>Presets</option>
                          {TONES.map(t => (
                            <option key={t} value={t}>
                              {t}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className='pointer-events-none absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 opacity-50' />
                      </div>
                    </div>
                  </div>

                  {/* Audience Input with Presets */}
                  <div className='space-y-1'>
                    <label className='text-[10px] font-bold uppercase text-muted-foreground'>
                      Target Audience
                    </label>
                    <div className='flex gap-2'>
                      <input
                        className='flex-1 rounded-md border border-border bg-background px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary'
                        placeholder='e.g. Young Adult (YA)'
                        value={audience}
                        onChange={e => setAudience(e.target.value)}
                      />
                      <div className='relative shrink-0'>
                        <select
                          className='h-full w-24 cursor-pointer appearance-none rounded-md border border-border bg-secondary px-3 py-2 pr-8 text-xs outline-none hover:bg-secondary/80 focus:border-primary'
                          onChange={e => {
                            if (e.target.value) setAudience(e.target.value);
                            e.target.value = '';
                          }}
                        >
                          <option value=''>Presets</option>
                          {AUDIENCES.map(a => (
                            <option key={a} value={a}>
                              {a}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className='pointer-events-none absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 opacity-50' />
                      </div>
                    </div>
                  </div>

                  {/* Target Word Count */}
                  <div className='space-y-1'>
                    <label className='text-[10px] font-bold uppercase text-muted-foreground'>
                      Target Word Count
                    </label>
                    <input
                      type='number'
                      className='w-full rounded-md border border-border bg-background px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary'
                      placeholder='e.g. 50000'
                      value={targetWordCount}
                      onChange={e => setTargetWordCount(parseInt(e.target.value) ?? 0)}
                    />
                  </div>
                </div>

                <div className='space-y-1'>
                  <label className='text-[10px] font-bold uppercase text-muted-foreground'>
                    Custom System Instructions
                  </label>
                  <textarea
                    className='h-20 w-full resize-none rounded-md border border-border bg-background px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary'
                    placeholder='e.g. Avoid clichés, use British spelling, chapters must end on cliffhangers...'
                    value={customInstructions}
                    onChange={e => setCustomInstructions(e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className='flex shrink-0 items-center justify-between border-t border-border bg-secondary/10 px-6 py-4'>
          <p className='hidden text-xs text-muted-foreground md:block'>
            <kbd className='rounded bg-muted px-1.5 py-0.5 font-mono text-[10px]'>Ctrl</kbd>
            {' + '}
            <kbd className='rounded bg-muted px-1.5 py-0.5 font-mono text-[10px]'>Enter</kbd>
            {' to submit'}
          </p>
          <div className='flex gap-3'>
            <button
              onClick={onCancel}
              className='px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground'
            >
              Cancel
            </button>
            <button
              disabled={!title || !style || !idea}
              onClick={handleSubmit}
              className='flex items-center gap-2 rounded-md bg-primary px-6 py-2.5 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20 transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50'
              data-testid='wizard-submit-btn'
            >
              <Plus className='h-4 w-4' />
              Initialize Project
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectWizard;
