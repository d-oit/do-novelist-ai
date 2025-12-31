import { useEffect, useRef, useState } from 'react';

import { brainstormProject } from '@/lib/ai';
import { logger } from '@/lib/logging/logger';

export interface ProjectWizardState {
  title: string;
  style: string;
  idea: string;
  activeTab: 'write' | 'upload';
  files: File[];
  isReading: boolean;
  showAdvanced: boolean;
  tone: string;
  audience: string;
  customInstructions: string;
  targetWordCount: number;
  brainstorming: Record<string, boolean>;
  brainstormError: string | null;
}

export const useProjectWizard = (isOpen: boolean) => {
  const [title, setTitle] = useState('');
  const [style, setStyle] = useState('');
  const [idea, setIdea] = useState('');
  const [activeTab, setActiveTab] = useState<'write' | 'upload'>('write');
  const [files, setFiles] = useState<File[]>([]);
  const [isReading, setIsReading] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [tone, setTone] = useState('');
  const [audience, setAudience] = useState('');
  const [customInstructions, setCustomInstructions] = useState('');
  const [targetWordCount, setTargetWordCount] = useState(50000);
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

  const handleBrainstorm = async (field: 'title' | 'style' | 'idea'): Promise<void> => {
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

  const removeFile = (index: number): void => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  return {
    state: {
      title,
      style,
      idea,
      activeTab,
      files,
      isReading,
      showAdvanced,
      tone,
      audience,
      customInstructions,
      targetWordCount,
      brainstorming,
      brainstormError,
    },
    setters: {
      setTitle,
      setStyle,
      setIdea,
      setActiveTab,
      setShowAdvanced,
      setTone,
      setAudience,
      setCustomInstructions,
      setTargetWordCount,
    },
    handlers: {
      handleBrainstorm,
      handleFileChange,
      removeFile,
    },
    refs: {
      fileInputRef,
      ideaTextareaRef,
    },
  };
};
