import { Image, Wand2, Loader2, RefreshCcw, Download } from 'lucide-react';
import React, { useState } from 'react';
import { cn } from '@/lib/utils';

import { generateCoverImage } from '../../../lib/ai';
import { Project } from '../../../types';

interface CoverGeneratorProps {
  project: Project;
  onUpdateProject: (updates: Partial<Project>) => void;
}

const CoverGenerator: React.FC<CoverGeneratorProps> = ({ project, onUpdateProject }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');

  const handleGenerate = (): void => {
    setIsGenerating(true);
    setError('');
    try {
      const base64Cover = generateCoverImage(project.title, project.style, project.idea);
      if (base64Cover != null) {
        onUpdateProject({ coverImage: base64Cover });
      } else {
        setError('Failed to generate image. Please try again.');
      }
    } catch (_err) {
      setError('An error occurred during generation.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className='animate-in fade-in flex min-h-[500px] flex-col items-center justify-center space-y-8 p-8 duration-500'>
      <div className='space-y-2 text-center'>
        <h2 className='flex items-center justify-center gap-2 font-serif text-2xl font-bold'>
          <Image className='h-6 w-6 text-primary' />
          Cover Art Studio
        </h2>
        <p className='mx-auto max-w-md text-sm text-muted-foreground'>
          Generate a professional, cinematic cover for <strong>{project.title}</strong> using the
          Imagen 4.0 model.
        </p>
      </div>

      {/* Cover Preview Area */}
      <div className='group relative'>
        <div
          className={cn(
            'relative flex h-[400px] w-[300px] flex-col items-center justify-center overflow-hidden rounded-lg border-2 border-dashed border-border bg-card shadow-2xl transition-all',
            project.coverImage == null ? 'hover:border-primary/50' : 'border-transparent',
          )}
        >
          {project.coverImage != null ? (
            <img
              src={project.coverImage}
              alt='Generated Book Cover'
              className='h-full w-full object-cover transition-transform duration-700 hover:scale-105'
            />
          ) : (
            <div className='p-6 text-center opacity-50'>
              <div className='mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-secondary'>
                <Image className='h-8 w-8 text-muted-foreground' />
              </div>
              <p className='text-xs uppercase tracking-widest'>No Cover Generated</p>
            </div>
          )}

          {/* Loading Overlay */}
          {isGenerating && (
            <div className='absolute inset-0 z-10 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm'>
              <Loader2 className='mb-2 h-10 w-10 animate-spin text-primary' />
              <p className='animate-pulse font-mono text-xs'>Dreaming up visuals...</p>
            </div>
          )}
        </div>

        {/* Download Action (Only if image exists) */}
        {project.coverImage != null && !isGenerating && (
          <a
            href={project.coverImage}
            download={`cover-${project.title.replace(/\s+/g, '-').toLowerCase()}.png`}
            className='absolute right-2 top-2 rounded-full bg-black/50 p-2 text-white opacity-0 transition-opacity hover:bg-black/70 group-hover:opacity-100'
            title='Download Cover'
          >
            <Download className='h-4 w-4' />
          </a>
        )}
      </div>

      {/* Controls */}
      <div className='flex w-full max-w-xs flex-col gap-4'>
        <button
          onClick={() => void handleGenerate()}
          disabled={isGenerating}
          className='flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 font-bold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] hover:shadow-primary/40 disabled:scale-100 disabled:cursor-not-allowed disabled:opacity-50'
          data-testid='generate-cover-btn'
        >
          {isGenerating ? (
            <>Generating...</>
          ) : project.coverImage != null ? (
            <>
              <RefreshCcw className='h-4 w-4' /> Regenerate Cover
            </>
          ) : (
            <>
              <Wand2 className='h-4 w-4' /> Generate Artwork
            </>
          )}
        </button>

        {error && (
          <p className='rounded bg-red-500/10 py-2 text-center font-mono text-xs text-red-500'>
            {error}
          </p>
        )}

        <p className='text-center text-[10px] text-muted-foreground opacity-60'>
          Uses your project Idea, Style, and Title as input context.
        </p>
      </div>
    </div>
  );
};

export default CoverGenerator;
