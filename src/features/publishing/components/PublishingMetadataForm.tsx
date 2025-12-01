import { motion } from 'framer-motion';
import { FileText, Tag, DollarSign, Calendar, Lock, Eye, X, Loader2, Upload } from 'lucide-react';
import React, { useState } from 'react';

import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { cn, iconButtonTarget } from '../../../lib/utils';

interface PublishingMetadata {
  description: string;
  genres: string[];
  tags: string[];
  language: string;
  mature: boolean;
  price?: number;
  currency: string;
  publishDate?: string;
  visibility: string;
}

interface PublishingMetadataFormProps {
  onSubmit: (metadata: PublishingMetadata) => void;
  onCancel: () => void;
  isSubmitting: boolean;
}

const GENRE_OPTIONS = [
  'Fantasy',
  'Science Fiction',
  'Romance',
  'Mystery',
  'Thriller',
  'Horror',
  'Adventure',
  'Drama',
  'Comedy',
  'Historical Fiction',
  'Young Adult',
  'Literary Fiction',
  'Non-Fiction',
  'Poetry',
];

export const PublishingMetadataForm: React.FC<PublishingMetadataFormProps> = ({
  onSubmit,
  onCancel,
  isSubmitting,
}) => {
  const [formData, setFormData] = useState({
    description: '',
    genres: [] as string[],
    tags: '',
    language: 'en',
    mature: false,
    price: '',
    currency: 'USD',
    publishDate: '',
    visibility: 'public',
  });

  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault();
    onSubmit({
      ...formData,
      tags: formData.tags
        .split(',')
        .map(tag => tag.trim())
        .filter(Boolean),
      price: formData.price ? parseFloat(formData.price) : undefined,
    });
  };

  const toggleGenre = (genre: string): void => {
    setFormData(prev => ({
      ...prev,
      genres: prev.genres.includes(genre)
        ? prev.genres.filter(g => g !== genre)
        : [...prev.genres, genre],
    }));
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className='fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm'
    >
      <Card className='max-h-[80dvh] w-full max-w-2xl overflow-y-auto'>
        <div className='p-6'>
          <div className='mb-6 flex items-center justify-between'>
            <h3 className='font-serif text-xl font-semibold'>Publishing Details</h3>
            <button
              onClick={onCancel}
              className={iconButtonTarget('rounded-md transition-colors hover:bg-muted')}
              aria-label='Close publishing metadata form'
            >
              <X className='h-4 w-4' />
            </button>
          </div>

          <form onSubmit={handleSubmit} className='space-y-6'>
            {/* Description */}
            <div>
              <label className='mb-2 block text-sm font-medium'>
                <FileText className='mr-1 inline h-4 w-4' />
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder='Describe your book to potential readers...'
                className='min-h-[100px] w-full resize-y rounded-lg border border-border bg-background px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/20'
                required
              />
            </div>

            {/* Genres */}
            <div>
              <label className='mb-2 block text-sm font-medium'>
                <Tag className='mr-1 inline h-4 w-4' />
                Genres (select up to 3)
              </label>
              <div className='grid grid-cols-2 gap-2 md:grid-cols-3'>
                {GENRE_OPTIONS.map(genre => (
                  <button
                    key={genre}
                    type='button'
                    onClick={() => toggleGenre(genre)}
                    disabled={!formData.genres.includes(genre) && formData.genres.length >= 3}
                    className={cn(
                      'rounded border p-2 text-sm transition-colors disabled:opacity-50',
                      formData.genres.includes(genre)
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border bg-background hover:bg-secondary',
                    )}
                  >
                    {genre}
                  </button>
                ))}
              </div>
            </div>

            {/* Tags */}
            <div>
              <label className='mb-2 block text-sm font-medium'>Tags (comma-separated)</label>
              <input
                type='text'
                value={formData.tags}
                onChange={e => setFormData(prev => ({ ...prev, tags: e.target.value }))}
                placeholder='magic, adventure, coming-of-age'
                className='w-full rounded-lg border border-border bg-background px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/20'
              />
            </div>

            <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
              {/* Language */}
              <div>
                <label className='mb-2 block text-sm font-medium'>Language</label>
                <select
                  value={formData.language}
                  onChange={e => setFormData(prev => ({ ...prev, language: e.target.value }))}
                  className='w-full rounded-lg border border-border bg-background px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/20'
                >
                  <option value='en'>English</option>
                  <option value='es'>Spanish</option>
                  <option value='fr'>French</option>
                  <option value='de'>German</option>
                  <option value='it'>Italian</option>
                </select>
              </div>

              {/* Visibility */}
              <div>
                <label className='mb-2 block text-sm font-medium'>
                  <Eye className='mr-1 inline h-4 w-4' />
                  Visibility
                </label>
                <select
                  value={formData.visibility}
                  onChange={e => setFormData(prev => ({ ...prev, visibility: e.target.value }))}
                  className='w-full rounded-lg border border-border bg-background px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/20'
                >
                  <option value='public'>Public</option>
                  <option value='unlisted'>Unlisted</option>
                  <option value='private'>Private</option>
                </select>
              </div>
            </div>

            {/* Pricing (optional) */}
            <div className='grid grid-cols-2 gap-4'>
              <div>
                <label className='mb-2 block text-sm font-medium'>
                  <DollarSign className='mr-1 inline h-4 w-4' />
                  Price (optional)
                </label>
                <input
                  type='number'
                  step='0.01'
                  value={formData.price}
                  onChange={e => setFormData(prev => ({ ...prev, price: e.target.value }))}
                  placeholder='0.00'
                  className='w-full rounded-lg border border-border bg-background px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/20'
                />
              </div>
              <div>
                <label className='mb-2 block text-sm font-medium'>Currency</label>
                <select
                  value={formData.currency}
                  onChange={e => setFormData(prev => ({ ...prev, currency: e.target.value }))}
                  className='w-full rounded-lg border border-border bg-background px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/20'
                >
                  <option value='USD'>USD</option>
                  <option value='EUR'>EUR</option>
                  <option value='GBP'>GBP</option>
                  <option value='CAD'>CAD</option>
                </select>
              </div>
            </div>

            {/* Publish Date */}
            <div>
              <label className='mb-2 block text-sm font-medium'>
                <Calendar className='mr-1 inline h-4 w-4' />
                Publish Date (optional)
              </label>
              <input
                type='datetime-local'
                value={formData.publishDate}
                onChange={e => setFormData(prev => ({ ...prev, publishDate: e.target.value }))}
                className='w-full rounded-lg border border-border bg-background px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/20'
              />
            </div>

            {/* Mature Content */}
            <div className='flex items-center gap-2'>
              <input
                type='checkbox'
                id='mature'
                checked={formData.mature}
                onChange={e => setFormData(prev => ({ ...prev, mature: e.target.checked }))}
                className='rounded border-border'
              />
              <label htmlFor='mature' className='flex items-center gap-1 text-sm'>
                <Lock className='h-4 w-4' />
                Contains mature content (18+)
              </label>
            </div>

            <div className='flex gap-2 pt-4'>
              <Button
                type='submit'
                disabled={isSubmitting || formData.genres.length === 0}
                className='flex-1'
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                    Publishing...
                  </>
                ) : (
                  <>
                    <Upload className='mr-2 h-4 w-4' />
                    Publish to Selected Platforms
                  </>
                )}
              </Button>
              <Button type='button' variant='outline' onClick={onCancel}>
                Cancel
              </Button>
            </div>
          </form>
        </div>
      </Card>
    </motion.div>
  );
};
