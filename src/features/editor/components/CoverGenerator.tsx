
import React, { useState } from 'react';
import { generateCoverImage } from '../../../lib/gemini';
import { Project } from '../../../types';
import { Image, Wand2, Loader2, RefreshCcw, Download } from 'lucide-react';

interface CoverGeneratorProps {
  project: Project;
  onUpdateProject: (updates: Partial<Project>) => void;
}

const CoverGenerator: React.FC<CoverGeneratorProps> = ({ project, onUpdateProject }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError('');
    try {
      const base64Cover = await generateCoverImage(project.title, project.style, project.idea);
      if (base64Cover) {
        onUpdateProject({ coverImage: base64Cover });
      } else {
        setError('Failed to generate image. Please try again.');
      }
    } catch (err) {
      setError('An error occurred during generation.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[500px] p-8 space-y-8 animate-in fade-in duration-500">
      
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-serif font-bold flex items-center justify-center gap-2">
          <Image className="w-6 h-6 text-primary" />
          Cover Art Studio
        </h2>
        <p className="text-muted-foreground max-w-md mx-auto text-sm">
          Generate a professional, cinematic cover for <strong>{project.title}</strong> using the Imagen 4.0 model.
        </p>
      </div>

      {/* Cover Preview Area */}
      <div className="relative group">
        <div className={`
          w-[300px] h-[400px] bg-card border-2 border-dashed border-border rounded-lg 
          flex flex-col items-center justify-center shadow-2xl overflow-hidden relative transition-all
          ${!project.coverImage ? 'hover:border-primary/50' : 'border-transparent'}
        `}>
          
          {project.coverImage ? (
            <img 
              src={project.coverImage} 
              alt="Generated Book Cover" 
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
            />
          ) : (
            <div className="text-center p-6 opacity-50">
              <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
                 <Image className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="text-xs uppercase tracking-widest">No Cover Generated</p>
            </div>
          )}

          {/* Loading Overlay */}
          {isGenerating && (
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center z-10">
              <Loader2 className="w-10 h-10 text-primary animate-spin mb-2" />
              <p className="text-xs font-mono animate-pulse">Dreaming up visuals...</p>
            </div>
          )}
        </div>

        {/* Download Action (Only if image exists) */}
        {project.coverImage && !isGenerating && (
          <a 
            href={project.coverImage} 
            download={`cover-${project.title.replace(/\s+/g, '-').toLowerCase()}.png`}
            className="absolute top-2 right-2 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            title="Download Cover"
          >
            <Download className="w-4 h-4" />
          </a>
        )}
      </div>

      {/* Controls */}
      <div className="flex flex-col gap-4 w-full max-w-xs">
        <button
          onClick={handleGenerate}
          disabled={isGenerating}
          className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-bold rounded-lg shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
          data-testid="generate-cover-btn"
        >
          {isGenerating ? (
            <>Generating...</>
          ) : project.coverImage ? (
            <><RefreshCcw className="w-4 h-4" /> Regenerate Cover</>
          ) : (
            <><Wand2 className="w-4 h-4" /> Generate Artwork</>
          )}
        </button>
        
        {error && (
          <p className="text-xs text-red-500 text-center font-mono bg-red-500/10 py-2 rounded">
            {error}
          </p>
        )}

        <p className="text-[10px] text-center text-muted-foreground opacity-60">
          Uses your project Idea, Style, and Title as input context.
        </p>
      </div>

    </div>
  );
};

export default CoverGenerator;
