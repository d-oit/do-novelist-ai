import {
  Upload,
  FileText,
  X,
  Sparkles,
  Book,
  Plus,
  Loader2,
  Wand2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import React, { useState, useRef, useEffect } from 'react';

import { brainstormProject } from '../../../lib/ai';
import { cn, iconButtonTarget } from '../../../lib/utils';

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

  const fileInputRef = useRef<HTMLInputElement>(null);

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
    try {
      const result = await brainstormProject(promptContext, field);
      if (result) {
        if (field === 'title') setTitle(result);
        if (field === 'style') setStyle(result);
        if (field === 'idea') setIdea(result);
      }
    } catch (err) {
      console.error(err);
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
          console.error('Error reading file', err);
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
      className='fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm'
      data-testid='project-wizard-overlay'
    >
      <div className='animate-in fade-in zoom-in-95 flex max-h-[90dvh] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-border bg-card shadow-2xl duration-200'>
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
                {brainstorming.idea != null ? (
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

              <div className='h-32 bg-card p-4'>
                {activeTab === 'write' ? (
                  <textarea
                    className='h-full w-full resize-none bg-transparent font-mono text-sm text-muted-foreground focus:outline-none'
                    placeholder='Describe your plot, characters, and themes here...'
                    value={idea}
                    onChange={e => setIdea(e.target.value)}
                    data-testid='wizard-idea-input'
                  />
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className='group flex h-full w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border transition-all hover:border-primary/50 hover:bg-secondary/10'
                  >
                    <input
                      type='file'
                      multiple
                      ref={fileInputRef}
                      className='hidden'
                      accept='.txt,.md,.json'
                      onChange={e => void handleFileChange(e)}
                    />
                    <div className='mb-3 rounded-full bg-secondary/50 p-3 transition-transform group-hover:scale-110'>
                      <Upload className='h-6 w-6 text-muted-foreground group-hover:text-primary' />
                    </div>
                    <p className='text-sm font-medium text-foreground'>Click to upload files</p>
                    <p className='mt-1 text-xs text-muted-foreground'>Supports .txt, .md, .json</p>
                    {isReading && (
                      <p className='mt-2 animate-pulse text-xs text-primary'>
                        Reading file content...
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
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
                  {brainstorming.title != null ? (
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
                  {brainstorming.style != null ? (
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
                    className='rounded-full bg-secondary px-2 py-0.5 text-[10px] text-muted-foreground transition-colors hover:bg-primary/20'
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
        <div className='flex shrink-0 justify-end gap-3 border-t border-border bg-secondary/10 p-6'>
          <button
            onClick={onCancel}
            className='px-4 py-2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground'
          >
            Cancel
          </button>
          <button
            disabled={!title || !style || !idea}
            onClick={handleSubmit}
            className='flex items-center gap-2 rounded-md bg-primary px-6 py-2 text-xs font-bold text-primary-foreground shadow-lg shadow-primary/20 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50'
            data-testid='wizard-submit-btn'
          >
            <Plus className='h-4 w-4' />
            Initialize Project
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProjectWizard;
