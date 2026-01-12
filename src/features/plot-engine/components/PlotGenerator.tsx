/**
 * Plot Generator Component
 *
 * AI-powered plot structure generation with customization options
 */

import React, { useState } from 'react';

import type {
  PlotGenerationRequest,
  PlotStructure,
  PlotSuggestion,
  StoryStructure,
} from '@/features/plot-engine';
import { usePlotGeneration } from '@/features/plot-engine/hooks/usePlotGeneration';
import { plotStorageService } from '@/features/plot-engine/services';
import { logger } from '@/lib/logging/logger';
import { cn } from '@/lib/utils';
import { Badge } from '@/shared/components/ui/Badge';
import { Button } from '@/shared/components/ui/Button';
import { Card } from '@/shared/components/ui/Card';

interface PlotGeneratorProps {
  projectId: string;
  onPlotGenerated?: (plot: PlotStructure) => void;
}

export const PlotGenerator: React.FC<PlotGeneratorProps> = React.memo(
  ({ projectId, onPlotGenerated }) => {
    // Form state
    const [premise, setPremise] = useState('');
    const [genre, setGenre] = useState('');
    const [targetLength, setTargetLength] = useState<number>(20);
    const [structure, setStructure] = useState<StoryStructure>('3-act');
    const [themes, setThemes] = useState('');
    const [tone, setTone] = useState<'light' | 'dark' | 'balanced'>('balanced');

    // UI state
    const [isSaving, setIsSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);

    // Use the plot generation hook
    const {
      generatedPlot,
      suggestions,
      alternatives,
      confidence,
      isLoading,
      error,
      generatePlot,
      reset,
      clearError,
    } = usePlotGeneration();

    const handleGenerate = async (): Promise<void> => {
      // Validate form
      if (!premise.trim()) {
        return;
      }

      // Reset previous save state
      setSaveSuccess(false);
      setSaveError(null);

      const request: PlotGenerationRequest = {
        projectId,
        premise: premise.trim(),
        genre: genre.trim() || 'fantasy',
        targetLength,
        structure,
        themes: themes.trim() ? themes.split(',').map(t => t.trim()) : undefined,
        tone,
      };

      try {
        await generatePlot(request);
        logger.info('Plot generation initiated', { projectId });
      } catch (err) {
        logger.error('Plot generation failed', { projectId, error: err });
      }
    };

    const handleSavePlot = async (): Promise<void> => {
      if (!generatedPlot) return;

      setIsSaving(true);
      setSaveError(null);

      try {
        // Save to storage service
        await plotStorageService.savePlotStructure(generatedPlot);
        setSaveSuccess(true);
        onPlotGenerated?.(generatedPlot);

        logger.info('Plot structure saved', {
          projectId,
          plotId: generatedPlot.id,
          actCount: generatedPlot.acts.length,
        });

        // Clear success message after 3 seconds
        setTimeout(() => setSaveSuccess(false), 3000);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to save plot structure';
        setSaveError(errorMessage);
        logger.error('Failed to save plot structure', { projectId, error: err });
      } finally {
        setIsSaving(false);
      }
    };

    const handleReset = (): void => {
      reset();
      setSaveSuccess(false);
      setSaveError(null);
    };

    const isFormValid = premise.trim().length > 0;

    return (
      <div className='space-y-6'>
        {/* Generation Form */}
        <Card className='p-6'>
          <h2 className='mb-4 text-2xl font-bold'>Plot Generator</h2>
          <p className='mb-6 text-muted-foreground'>
            Generate AI-powered plot structures based on your story premise and preferences.
          </p>
          <div className='mb-6 rounded-md border border-blue-200 bg-blue-50 p-3 text-sm dark:border-blue-900 dark:bg-blue-950/30'>
            <p className='font-medium text-blue-900 dark:text-blue-100'>
              💡 How to use the generator:
            </p>
            <ol className='mt-2 list-inside list-decimal space-y-1 text-blue-800 dark:text-blue-200'>
              <li>Fill out the form with your story parameters</li>
              <li>Click "Generate Plot" and wait 20-30 seconds</li>
              <li>Review the suggested acts, scenes, and plot points</li>
              <li>Use as inspiration or save to your project</li>
            </ol>
          </div>

          <div className='space-y-4'>
            {/* Premise */}
            <div>
              <label htmlFor='premise' className='mb-2 block text-sm font-medium'>
                Story Premise <span className='text-destructive'>*</span>
              </label>
              <textarea
                id='premise'
                value={premise}
                onChange={e => setPremise(e.target.value)}
                placeholder='Describe your story idea, main conflict, or premise...'
                className='min-h-24 w-full rounded-md border bg-background px-3 py-2 text-sm'
                data-testid='premise-input'
                disabled={isLoading}
              />
            </div>

            {/* Genre and Target Length */}
            <div className='grid grid-cols-2 gap-4'>
              <div>
                <label htmlFor='genre' className='mb-2 block text-sm font-medium'>
                  Genre
                </label>
                <input
                  id='genre'
                  type='text'
                  value={genre}
                  onChange={e => setGenre(e.target.value)}
                  placeholder='e.g., Fantasy, Sci-Fi, Mystery'
                  className='w-full rounded-md border bg-background px-3 py-2 text-sm'
                  data-testid='genre-input'
                  disabled={isLoading}
                />
              </div>

              <div>
                <label htmlFor='target-length' className='mb-2 block text-sm font-medium'>
                  Target Length (Chapters)
                </label>
                <input
                  id='target-length'
                  type='number'
                  min={1}
                  max={100}
                  value={targetLength}
                  onChange={e => setTargetLength(parseInt(e.target.value, 10) || 20)}
                  className='w-full rounded-md border bg-background px-3 py-2 text-sm'
                  data-testid='target-length-input'
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Structure and Tone */}
            <div className='grid grid-cols-2 gap-4'>
              <div>
                <label htmlFor='structure' className='mb-2 block text-sm font-medium'>
                  Story Structure
                </label>
                <select
                  id='structure'
                  value={structure}
                  onChange={e => setStructure(e.target.value as StoryStructure)}
                  className='w-full rounded-md border bg-background px-3 py-2 text-sm'
                  data-testid='structure-select'
                  disabled={isLoading}
                >
                  <option value='3-act'>3-Act Structure</option>
                  <option value='5-act'>5-Act Structure</option>
                  <option value='hero-journey'>Hero's Journey</option>
                  <option value='kishotenketsu'>Kishōtenketsu</option>
                  <option value='custom'>Custom</option>
                </select>
              </div>

              <div>
                <label htmlFor='tone' className='mb-2 block text-sm font-medium'>
                  Tone
                </label>
                <select
                  id='tone'
                  value={tone}
                  onChange={e => setTone(e.target.value as 'light' | 'dark' | 'balanced')}
                  className='w-full rounded-md border bg-background px-3 py-2 text-sm'
                  data-testid='tone-select'
                  disabled={isLoading}
                >
                  <option value='light'>Light</option>
                  <option value='dark'>Dark</option>
                  <option value='balanced'>Balanced</option>
                </select>
              </div>
            </div>

            {/* Themes */}
            <div>
              <label htmlFor='themes' className='mb-2 block text-sm font-medium'>
                Themes (comma-separated)
              </label>
              <input
                id='themes'
                type='text'
                value={themes}
                onChange={e => setThemes(e.target.value)}
                placeholder='e.g., redemption, power, betrayal'
                className='w-full rounded-md border bg-background px-3 py-2 text-sm'
                data-testid='themes-input'
                disabled={isLoading}
              />
              <p className='mt-1 text-xs text-muted-foreground'>
                Separate multiple themes with commas
              </p>
            </div>

            {/* Actions */}
            <div className='flex items-center gap-3'>
              <Button
                onClick={() => void handleGenerate()}
                disabled={!isFormValid || isLoading}
                data-testid='generate-button'
              >
                {isLoading ? 'Generating...' : '✨ Generate Plot'}
              </Button>

              {generatedPlot && (
                <Button onClick={handleReset} variant='outline' disabled={isLoading}>
                  Clear Results
                </Button>
              )}
            </div>

            {/* Form Validation Error */}
            {!isFormValid && premise.length > 0 && (
              <p className='text-sm text-destructive'>Please enter a story premise</p>
            )}
          </div>
        </Card>

        {/* Error Display */}
        {error && (
          <Card className='border-destructive bg-destructive/10 p-4'>
            <div className='flex items-start justify-between'>
              <div>
                <p className='font-medium text-destructive'>Generation Error</p>
                <p className='mt-1 text-sm text-destructive'>{error}</p>
              </div>
              <Button onClick={clearError} variant='ghost' size='sm'>
                Dismiss
              </Button>
            </div>
          </Card>
        )}

        {/* Generated Plot Structure */}
        {generatedPlot && (
          <Card className='p-6'>
            <div className='mb-4 flex items-center justify-between'>
              <div>
                <h3 className='text-lg font-semibold'>Generated Plot Structure</h3>
                <p className='mt-1 text-sm text-muted-foreground'>
                  Confidence: {Math.round(confidence * 100)}%
                </p>
              </div>
              <div className='flex items-center gap-2'>
                {saveSuccess && (
                  <span className='text-sm text-green-600 dark:text-green-400'>
                    ✓ Saved successfully
                  </span>
                )}
                <Button
                  onClick={() => void handleSavePlot()}
                  disabled={isSaving}
                  data-testid='save-plot-button'
                >
                  {isSaving ? 'Saving...' : 'Save Plot'}
                </Button>
              </div>
            </div>

            {saveError && (
              <div className='mb-4 rounded-md bg-destructive/10 px-4 py-3 text-destructive'>
                <p className='text-sm'>{saveError}</p>
              </div>
            )}

            {/* Acts */}
            <div className='space-y-4'>
              {generatedPlot.acts.map(act => (
                <div key={act.id} className='rounded-lg border p-4'>
                  <div className='mb-2 flex items-center gap-2'>
                    <Badge>Act {act.actNumber}</Badge>
                    <h4 className='font-semibold'>{act.name}</h4>
                  </div>
                  {act.description && (
                    <p className='mb-3 text-sm text-muted-foreground'>{act.description}</p>
                  )}

                  {/* Plot Points */}
                  {act.plotPoints.length > 0 && (
                    <div className='mt-3 space-y-2'>
                      <p className='text-sm font-medium'>Plot Points:</p>
                      {act.plotPoints.map(point => (
                        <div key={point.id} className='ml-4 rounded-md bg-muted/50 p-2'>
                          <div className='flex items-center gap-2'>
                            <Badge variant='outline' className='text-xs'>
                              {point.type.replace('_', ' ')}
                            </Badge>
                            <span className='text-sm font-medium'>{point.title}</span>
                          </div>
                          <p className='mt-1 text-xs text-muted-foreground'>{point.description}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {act.duration && (
                    <p className='mt-2 text-xs text-muted-foreground'>
                      Expected duration: ~{act.duration} chapters
                    </p>
                  )}
                </div>
              ))}

              {/* Climax */}
              {generatedPlot.climax && (
                <div className='rounded-lg border border-orange-500/50 bg-orange-500/10 p-4'>
                  <div className='mb-2 flex items-center gap-2'>
                    <Badge className='bg-orange-500 text-white'>Climax</Badge>
                    <h4 className='font-semibold'>{generatedPlot.climax.title}</h4>
                  </div>
                  <p className='text-sm text-muted-foreground'>
                    {generatedPlot.climax.description}
                  </p>
                </div>
              )}

              {/* Resolution */}
              {generatedPlot.resolution && (
                <div className='rounded-lg border border-blue-500/50 bg-blue-500/10 p-4'>
                  <div className='mb-2 flex items-center gap-2'>
                    <Badge className='bg-blue-500 text-white'>Resolution</Badge>
                    <h4 className='font-semibold'>{generatedPlot.resolution.title}</h4>
                  </div>
                  <p className='text-sm text-muted-foreground'>
                    {generatedPlot.resolution.description}
                  </p>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Suggestions */}
        {suggestions.length > 0 && (
          <Card className='p-6'>
            <h3 className='mb-4 text-lg font-semibold'>AI Suggestions</h3>
            <div className='space-y-3'>
              {suggestions.map(suggestion => (
                <SuggestionCard key={suggestion.id} suggestion={suggestion} />
              ))}
            </div>
          </Card>
        )}

        {/* Alternatives */}
        {alternatives.length > 0 && (
          <Card className='p-6'>
            <h3 className='mb-4 text-lg font-semibold'>Alternative Plot Structures</h3>
            <p className='mb-4 text-sm text-muted-foreground'>
              {alternatives.length} alternative{alternatives.length > 1 ? 's' : ''} generated
            </p>
            <div className='space-y-2'>
              {alternatives.map((alt, index) => (
                <div key={alt.id} className='rounded-md border p-3'>
                  <p className='font-medium'>
                    Alternative {index + 1}: {alt.acts.length}-Act Structure
                  </p>
                  <p className='mt-1 text-sm text-muted-foreground'>
                    {alt.acts.reduce((sum, act) => sum + act.plotPoints.length, 0)} plot points
                  </p>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    );
  },
);

// Suggestion Card Component
interface SuggestionCardProps {
  suggestion: PlotSuggestion;
}

const SuggestionCard: React.FC<SuggestionCardProps> = ({ suggestion }) => {
  const impactColors = {
    low: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
    high: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  };

  return (
    <div className='rounded-lg border p-4' data-testid='suggestion-card'>
      <div className='mb-2 flex items-center gap-2'>
        <Badge variant='outline' className='text-xs'>
          {suggestion.type.replace('_', ' ')}
        </Badge>
        <Badge className={cn('text-xs', impactColors[suggestion.impact])}>
          {suggestion.impact} impact
        </Badge>
        <Badge variant='outline' className='text-xs'>
          {suggestion.placement}
        </Badge>
      </div>
      <h4 className='font-medium'>{suggestion.title}</h4>
      <p className='mt-1 text-sm text-muted-foreground'>{suggestion.description}</p>
    </div>
  );
};
