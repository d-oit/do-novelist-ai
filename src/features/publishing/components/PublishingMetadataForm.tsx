import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  FileText,
  Tag,
  DollarSign,
  Calendar,
  Lock,
  Eye,
  X,
  Loader2,
  Upload
} from 'lucide-react';
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
  'Fantasy', 'Science Fiction', 'Romance', 'Mystery', 'Thriller',
  'Horror', 'Adventure', 'Drama', 'Comedy', 'Historical Fiction',
  'Young Adult', 'Literary Fiction', 'Non-Fiction', 'Poetry'
];

export const PublishingMetadataForm: React.FC<PublishingMetadataFormProps> = ({
  onSubmit,
  onCancel,
  isSubmitting
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      tags: formData.tags.split(',').map(tag => tag.trim()).filter(Boolean),
      price: formData.price ? parseFloat(formData.price) : undefined,
    });
  };

  const toggleGenre = (genre: string) => {
    setFormData(prev => ({
      ...prev,
      genres: prev.genres.includes(genre)
        ? prev.genres.filter(g => g !== genre)
        : [...prev.genres, genre]
    }));
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    >
      <Card className="w-full max-w-2xl max-h-[80dvh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-serif font-semibold text-xl">Publishing Details</h3>
            <button
              onClick={onCancel}
              className={iconButtonTarget("rounded-md hover:bg-muted transition-colors")}
              aria-label="Close publishing metadata form"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Description */}
            <div>
              <label className="block text-sm font-medium mb-2">
                <FileText className="w-4 h-4 inline mr-1" />
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe your book to potential readers..."
                className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 min-h-[100px] resize-y"
                required
              />
            </div>

            {/* Genres */}
            <div>
              <label className="block text-sm font-medium mb-2">
                <Tag className="w-4 h-4 inline mr-1" />
                Genres (select up to 3)
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {GENRE_OPTIONS.map(genre => (
                  <button
                    key={genre}
                    type="button"
                    onClick={() => toggleGenre(genre)}
                    disabled={!formData.genres.includes(genre) && formData.genres.length >= 3}
                    className={cn(
                      "p-2 text-sm rounded border transition-colors disabled:opacity-50",
                      formData.genres.includes(genre)
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background hover:bg-secondary border-border"
                    )}
                  >
                    {genre}
                  </button>
                ))}
              </div>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Tags (comma-separated)
              </label>
              <input
                type="text"
                value={formData.tags}
                onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
                placeholder="magic, adventure, coming-of-age"
                className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Language */}
              <div>
                <label className="block text-sm font-medium mb-2">Language</label>
                <select
                  value={formData.language}
                  onChange={(e) => setFormData(prev => ({ ...prev, language: e.target.value }))}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="en">English</option>
                  <option value="es">Spanish</option>
                  <option value="fr">French</option>
                  <option value="de">German</option>
                  <option value="it">Italian</option>
                </select>
              </div>

              {/* Visibility */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  <Eye className="w-4 h-4 inline mr-1" />
                  Visibility
                </label>
                <select
                  value={formData.visibility}
                  onChange={(e) => setFormData(prev => ({ ...prev, visibility: e.target.value }))}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="public">Public</option>
                  <option value="unlisted">Unlisted</option>
                  <option value="private">Private</option>
                </select>
              </div>
            </div>

            {/* Pricing (optional) */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  <DollarSign className="w-4 h-4 inline mr-1" />
                  Price (optional)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                  placeholder="0.00"
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Currency</label>
                <select
                  value={formData.currency}
                  onChange={(e) => setFormData(prev => ({ ...prev, currency: e.target.value }))}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                  <option value="CAD">CAD</option>
                </select>
              </div>
            </div>

            {/* Publish Date */}
            <div>
              <label className="block text-sm font-medium mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                Publish Date (optional)
              </label>
              <input
                type="datetime-local"
                value={formData.publishDate}
                onChange={(e) => setFormData(prev => ({ ...prev, publishDate: e.target.value }))}
                className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            {/* Mature Content */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="mature"
                checked={formData.mature}
                onChange={(e) => setFormData(prev => ({ ...prev, mature: e.target.checked }))}
                className="rounded border-border"
              />
              <label htmlFor="mature" className="text-sm flex items-center gap-1">
                <Lock className="w-4 h-4" />
                Contains mature content (18+)
              </label>
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                type="submit"
                disabled={isSubmitting || formData.genres.length === 0}
                className="flex-1"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Publishing...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Publish to Selected Platforms
                  </>
                )}
              </Button>
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            </div>
          </form>
        </div>
      </Card>
    </motion.div>
  );
};
