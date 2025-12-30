/**
 * ImageGenerationDialog
 * Dialog for generating book covers and character portraits
 */
import { Image as ImageIcon, Loader2, Sparkles, Wand2 } from 'lucide-react';
import React, { useState } from 'react';

import {
  generateBookCover,
  generateCharacterPortrait,
} from '@/features/generation/services/imageGenerationService';
import { Button } from '@/shared/components/ui/Button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/shared/components/ui/Dialog';

interface ImageGenerationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'cover' | 'portrait';
  title: string;
  description: string;
  style: string;
  onImageGenerated: (url: string) => void;
}

const ImageGenerationDialog: React.FC<ImageGenerationDialogProps> = ({
  isOpen,
  onClose,
  type,
  title,
  description,
  style,
  onImageGenerated,
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [prompt, setPrompt] = useState(description);
  const [customStyle, setCustomStyle] = useState(style);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);
    try {
      let url: string;
      if (type === 'cover') {
        url = await generateBookCover(title, prompt, customStyle);
      } else {
        url = await generateCharacterPortrait(title, prompt, customStyle);
      }
      onImageGenerated(url);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate image');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='sm:max-w-[500px]'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            {type === 'cover' ? (
              <ImageIcon className='h-5 w-5' />
            ) : (
              <Sparkles className='h-5 w-5' />
            )}
            Generate {type === 'cover' ? 'Book Cover' : 'Character Portrait'}
          </DialogTitle>
          <DialogDescription>
            Use AI to create a visual representation for your{' '}
            {type === 'cover' ? 'book' : 'character'}.
          </DialogDescription>
        </DialogHeader>

        <div className='grid gap-4 py-4'>
          <div className='grid gap-2'>
            <label htmlFor='prompt' className='text-sm font-medium'>
              {type === 'cover' ? 'Book Premise' : 'Character Description'}
            </label>
            <textarea
              id='prompt'
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              className='min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50'
              placeholder={
                type === 'cover'
                  ? 'Describe the main plot points or scene...'
                  : 'Describe physical features, clothes, personality...'
              }
            />
          </div>
          <div className='grid gap-2'>
            <label htmlFor='style' className='text-sm font-medium'>
              Art Style
            </label>
            <input
              id='style'
              value={customStyle}
              onChange={e => setCustomStyle(e.target.value)}
              className='flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50'
              placeholder='e.g. Cinematic, Watercolor, Cyberpunk...'
            />
          </div>
          {error && <p className='text-sm font-medium text-destructive'>{error}</p>}
        </div>

        <DialogFooter>
          <Button variant='outline' onClick={onClose} disabled={isGenerating}>
            Cancel
          </Button>
          <Button onClick={() => void handleGenerate()} disabled={isGenerating} className='gap-2'>
            {isGenerating ? (
              <Loader2 className='h-4 w-4 animate-spin' />
            ) : (
              <Wand2 className='h-4 w-4' />
            )}
            {isGenerating ? 'Generating...' : 'Generate'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ImageGenerationDialog;
