'use client';

import { Loader2, Wand2, Image as ImageIcon, Download, RefreshCw } from 'lucide-react';
import React, { useState } from 'react';

import { Button } from '@/shared/components/ui/Button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/Dialog';
import { Progress } from '@/shared/components/ui/Progress';
import type { Project } from '@/shared/types';

interface ImageGenerationDialogProps {
  project: Project;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onGenerate: (prompt: string, style: string) => Promise<string>;
  onSave: (imageUrl: string) => void;
}

export const ImageGenerationDialog: React.FC<ImageGenerationDialogProps> = ({
  project,
  isOpen,
  onOpenChange,
  onGenerate,
  onSave,
}) => {
  const [prompt, setPrompt] = useState<string>('');
  const [style, setStyle] = useState<string>(project.style || 'Cinematic');
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);

  // Auto-generate prompt on open (mock effect)
  React.useEffect(() => {
    if (isOpen && !prompt) {
      setPrompt(`A cover for a ${project.style} novel titled "${project.title}". ${project.idea}`);
    }
  }, [isOpen, project, prompt]);

  const handleGenerate = async (): Promise<void> => {
    setIsGenerating(true);
    setProgress(10);

    const interval = setInterval(() => {
      setProgress(p => Math.min(p + 10, 90));
    }, 500);

    try {
      const url = await onGenerate(prompt, style);
      setGeneratedImage(url);
      setProgress(100);
    } catch {
      // Handle error
    } finally {
      clearInterval(interval);
      setIsGenerating(false);
    }
  };

  const handleGenerateClick = (): void => {
    void handleGenerate();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-2xl'>
        <DialogHeader>
          <DialogTitle>Generate Book Cover</DialogTitle>
          <DialogDescription>
            Create a unique cover for "{project.title}" using AI.
          </DialogDescription>
        </DialogHeader>

        <div className='grid gap-6 py-4 md:grid-cols-2'>
          {/* Controls */}
          <div className='space-y-4'>
            <div className='space-y-2'>
              <label className='text-sm font-medium'>Prompt</label>
              <textarea
                className='custom-scrollbar min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50'
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                placeholder='Describe your cover...'
              />
            </div>

            <div className='space-y-2'>
              <label className='text-sm font-medium'>Style</label>
              <select
                className='w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
                value={style}
                onChange={e => setStyle(e.target.value)}
              >
                <option value='Cinematic'>Cinematic</option>
                <option value='Fantasy'>Fantasy</option>
                <option value='Sci-Fi'>Sci-Fi</option>
                <option value='Watercolor'>Watercolor</option>
                <option value='Minimalist'>Minimalist</option>
              </select>
            </div>

            <Button onClick={handleGenerateClick} disabled={isGenerating} className='w-full'>
              {isGenerating ? (
                <>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  Generating...
                </>
              ) : (
                <>
                  <Wand2 className='mr-2 h-4 w-4' />
                  Generate Cover
                </>
              )}
            </Button>
          </div>

          {/* Preview */}
          <div className='flex flex-col gap-4'>
            <div className='relative aspect-[2/3] w-full overflow-hidden rounded-lg border bg-muted'>
              {isGenerating ? (
                <div className='flex h-full flex-col items-center justify-center p-6 text-center'>
                  <Loader2 className='mb-4 h-8 w-8 animate-spin text-primary' />
                  <Progress value={progress} className='w-full' />
                  <p className='mt-2 text-sm text-muted-foreground'>Creating masterpiece...</p>
                </div>
              ) : generatedImage ? (
                <img
                  src={generatedImage}
                  alt='Generated cover'
                  className='h-full w-full object-cover transition-all hover:scale-105'
                />
              ) : (
                <div className='flex h-full flex-col items-center justify-center text-muted-foreground'>
                  <ImageIcon className='mb-4 h-12 w-12 opacity-20' />
                  <p className='text-sm'>Preview will appear here</p>
                </div>
              )}
            </div>

            {generatedImage && (
              <div className='flex gap-2'>
                <Button variant='outline' className='flex-1' onClick={handleGenerateClick}>
                  <RefreshCw className='mr-2 h-4 w-4' />
                  Regenerate
                </Button>
                <Button className='flex-1' onClick={() => onSave(generatedImage)}>
                  <Download className='mr-2 h-4 w-4' />
                  Save Cover
                </Button>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
