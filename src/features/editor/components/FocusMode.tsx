'use client';

import { Minimize2 } from 'lucide-react';
import React, { useEffect } from 'react';

import { Button } from '@/shared/components/ui/Button';
import type { Chapter } from '@/shared/types';

interface FocusModeProps {
  isActive: boolean;
  onExit: () => void;
  chapter: Chapter;
  content: string;
  onContentChange: (content: string) => void;
  onSave: () => void;
}

export const FocusMode: React.FC<FocusModeProps> = ({
  isActive,
  onExit,
  chapter,
  content,
  onContentChange,
  onSave,
}) => {
  const [wordCount, setWordCount] = React.useState(0);

  useEffect(() => {
    setWordCount(content.trim().length === 0 ? 0 : content.trim().split(/\s+/).length);
  }, [content]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onExit();
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        onSave();
      }
    };

    if (isActive) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isActive, onExit, onSave]);

  if (!isActive) return null;

  return (
    <div className='animate-in fade-in fixed inset-0 z-50 bg-background transition-all duration-300'>
      {/* Header */}
      <div className='absolute left-0 right-0 top-0 bg-gradient-to-b from-background to-transparent p-4 opacity-0 transition-opacity hover:opacity-100'>
        <div className='container mx-auto flex max-w-4xl items-center justify-between'>
          <span className='text-sm font-medium text-muted-foreground'>{chapter.title}</span>
          <Button variant='ghost' size='sm' onClick={onExit}>
            <Minimize2 className='mr-2 h-4 w-4' />
            Exit Focus Mode
          </Button>
        </div>
      </div>

      {/* Editor Area */}
      <div className='mx-auto h-full max-w-3xl px-8 py-20'>
        <textarea
          className='h-full w-full resize-none bg-transparent p-0 font-serif text-lg leading-relaxed focus:outline-none focus:ring-0'
          value={content}
          onChange={e => onContentChange(e.target.value)}
          placeholder='Just write...'
          autoFocus
          spellCheck={false}
        />
      </div>

      {/* Stats */}
      <div className='fixed bottom-8 right-8 opacity-20 transition-opacity hover:opacity-100'>
        <div className='text-right'>
          <div className='text-2xl font-bold'>{wordCount}</div>
          <div className='text-xs uppercase tracking-wider'>Words</div>
        </div>
      </div>
    </div>
  );
};
