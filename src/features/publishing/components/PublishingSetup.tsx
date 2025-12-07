import { motion, AnimatePresence } from 'framer-motion';
import {
  Globe,
  Upload,
  X,
  AlertCircle,
  CheckCircle2,
  BookOpen,
  FileText,
  Users,
  Target,
  Zap,
  ExternalLink,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';

import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { cn, iconButtonTarget } from '../../../lib/utils';
import type { Project } from '@/types';
import { ChapterStatus } from '@/types';
import { usePublishingAnalytics } from '../hooks/usePublishingAnalytics';
import type { PublishingPlatform, Publication } from '../types';

import { PlatformCard } from './PlatformCard';
import { PublishingMetadataForm } from './PublishingMetadataForm';

interface PublishingSetupProps {
  project: Project;
  onPublishingComplete: (publication: Publication) => void;
  onClose: () => void;
  className?: string;
}

const PublishingSetup: React.FC<PublishingSetupProps> = ({
  project,
  onPublishingComplete,
  onClose,
  className,
}) => {
  const analytics = usePublishingAnalytics();
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [showMetadataForm, setShowMetadataForm] = useState(false);
  const [configuringPlatform, setConfiguringPlatform] = useState<PublishingPlatform | null>(null);

  useEffect(() => {
    // Pre-select connected platforms
    const connected = analytics.connectedPlatforms.map(p => p.id);
    setSelectedPlatforms(connected);
  }, [analytics.connectedPlatforms]);

  const togglePlatform = (platformId: string): void => {
    setSelectedPlatforms(prev =>
      prev.includes(platformId) ? prev.filter(id => id !== platformId) : [...prev, platformId],
    );
  };

  const handlePublish = async (formMetadata: {
    description: string;
    genres: string[];
    tags: string[];
    language: string;
    mature: boolean;
    price?: number;
    currency: string;
    publishDate?: string;
    visibility: string;
  }): Promise<void> => {
    if (selectedPlatforms.length === 0) {
      alert('Please select at least one platform to publish to.');
      return;
    }

    try {
      // Transform form metadata to Publication metadata format
      const metadata: Publication['metadata'] = {
        genre: formMetadata.genres,
        tags: formMetadata.tags,
        language: formMetadata.language,
        mature: formMetadata.mature,
        wordCount: project.analytics.totalWordCount,
        chapterCount: project.chapters.length,
        price: formMetadata.price,
        currency: formMetadata.currency,
      };

      const publication = await analytics.publishProject(project, selectedPlatforms, metadata);
      onPublishingComplete(publication);
      setShowMetadataForm(false);
    } catch (error) {
      console.error('Publishing failed:', error);
      alert('Publishing failed. Please try again.');
    }
  };

  const selectedConnectedPlatforms = selectedPlatforms.filter(id =>
    analytics.connectedPlatforms.some(p => p.id === id),
  );

  const selectedUnconnectedPlatforms = selectedPlatforms.filter(
    id => !analytics.connectedPlatforms.some(p => p.id === id),
  );

  return (
    <motion.div
      className={cn(
        'flex h-full flex-col overflow-hidden rounded-lg border border-border/40 bg-card/50 backdrop-blur-sm',
        className,
      )}
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className='flex items-center justify-between border-b border-border/40 bg-gradient-to-r from-green-500/5 via-transparent to-blue-500/5 p-6'>
        <div className='flex items-center gap-3'>
          <Upload className='h-6 w-6 text-primary' />
          <div>
            <h2 className='font-serif text-xl font-semibold'>Publish Your Book</h2>
            <p className='text-sm text-muted-foreground'>Share "{project.title}" with the world</p>
          </div>
        </div>

        <button
          onClick={onClose}
          className={iconButtonTarget('rounded-lg text-sm transition-colors hover:bg-muted')}
          aria-label='Close publishing setup'
        >
          <X className='h-5 w-5' />
        </button>
      </div>

      <div className='flex-1 space-y-6 overflow-y-auto p-6'>
        {/* Project Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className='bg-gradient-to-br from-card via-card/90 to-primary/5 p-6'>
            <div className='flex items-start gap-4'>
              <BookOpen className='mt-1 h-12 w-12 text-primary' />
              <div className='flex-1'>
                <h3 className='mb-2 font-serif text-lg font-semibold'>{project.title}</h3>
                <p className='mb-4 line-clamp-3 text-muted-foreground'>{project.idea}</p>

                <div className='grid grid-cols-2 gap-4 text-sm md:grid-cols-4'>
                  <div className='flex items-center gap-2'>
                    <FileText className='h-4 w-4 text-muted-foreground' />
                    <span>{project.chapters.length} chapters</span>
                  </div>
                  <div className='flex items-center gap-2'>
                    <Users className='h-4 w-4 text-muted-foreground' />
                    <span>{project.style} style</span>
                  </div>
                  <div className='flex items-center gap-2'>
                    <Target className='h-4 w-4 text-muted-foreground' />
                    <span>
                      {project.chapters
                        .reduce((total, ch) => total + ch.content.split(' ').length, 0)
                        .toLocaleString()}{' '}
                      words
                    </span>
                  </div>
                  <div className='flex items-center gap-2'>
                    <CheckCircle2 className='h-4 w-4 text-green-500' />
                    <span>
                      {
                        project.chapters.filter(
                          ch => (ch.status as ChapterStatus) === ChapterStatus.COMPLETE,
                        ).length
                      }{' '}
                      complete
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Platform Selection */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h3 className='mb-4 flex items-center gap-2 font-serif text-lg font-semibold'>
            <Globe className='h-5 w-5 text-primary' />
            Select Publishing Platforms
          </h3>

          <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
            {analytics.platforms.map(platform => (
              <PlatformCard
                key={platform.id}
                platform={platform}
                isSelected={selectedPlatforms.includes(platform.id)}
                onToggle={() => togglePlatform(platform.id)}
                onConfigure={() => setConfiguringPlatform(platform)}
              />
            ))}
          </div>

          {selectedUnconnectedPlatforms.length > 0 && (
            <div className='mt-4 rounded-lg border border-orange-500/20 bg-orange-500/10 p-4'>
              <div className='flex items-start gap-2'>
                <AlertCircle className='mt-0.5 h-5 w-5 text-orange-500' />
                <div>
                  <h4 className='font-medium text-orange-700 dark:text-orange-400'>
                    Platform Setup Required
                  </h4>
                  <p className='mt-1 text-sm text-orange-600 dark:text-orange-300'>
                    You've selected platforms that aren't connected yet. Please configure them
                    first.
                  </p>
                </div>
              </div>
            </div>
          )}
        </motion.div>

        {/* Publishing Summary */}
        {selectedConnectedPlatforms.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h3 className='mb-4 flex items-center gap-2 font-serif text-lg font-semibold'>
              <Zap className='h-5 w-5 text-primary' />
              Ready to Publish
            </h3>

            <Card className='border-green-500/20 bg-green-500/5 p-4'>
              <div className='flex items-start gap-3'>
                <CheckCircle2 className='mt-0.5 h-5 w-5 text-green-500' />
                <div>
                  <h4 className='mb-2 font-medium text-green-700 dark:text-green-400'>
                    {selectedConnectedPlatforms.length} platform
                    {selectedConnectedPlatforms.length !== 1 ? 's' : ''} selected
                  </h4>
                  <div className='mb-4 flex flex-wrap gap-2'>
                    {selectedConnectedPlatforms.map(platformId => {
                      const platform = analytics.platforms.find(p => p.id === platformId);
                      return platform ? (
                        <span
                          key={platformId}
                          className='rounded bg-green-500/20 px-2 py-1 text-xs text-green-700 dark:text-green-300'
                        >
                          {platform.name}
                        </span>
                      ) : null;
                    })}
                  </div>

                  <Button onClick={() => setShowMetadataForm(true)} className='w-full md:w-auto'>
                    <Upload className='mr-2 h-4 w-4' />
                    Continue to Publishing Details
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </div>

      {/* Metadata Form Modal */}
      <AnimatePresence>
        {showMetadataForm && (
          <PublishingMetadataForm
            onSubmit={metadata => void handlePublish(metadata)}
            onCancel={() => setShowMetadataForm(false)}
            isSubmitting={analytics.isPublishing}
          />
        )}
      </AnimatePresence>

      {/* Platform Configuration Modal */}
      <AnimatePresence>
        {configuringPlatform && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className='fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm'
          >
            <Card className='w-full max-w-md p-6'>
              <div className='mb-4 flex items-center justify-between'>
                <h3 className='font-serif text-lg font-semibold'>
                  Connect to {configuringPlatform.name}
                </h3>
                <Button variant='ghost' size='sm' onClick={() => setConfiguringPlatform(null)}>
                  <X className='h-4 w-4' />
                </Button>
              </div>

              <p className='mb-4 text-muted-foreground'>
                Configure your connection to {configuringPlatform.name} to start publishing.
              </p>

              <div className='space-y-4'>
                <div>
                  <label className='mb-2 block text-sm font-medium'>API Key</label>
                  <input
                    type='password'
                    placeholder='Enter your API key...'
                    className='w-full rounded-lg border border-border bg-background px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/20'
                  />
                </div>

                <div>
                  <label className='mb-2 block text-sm font-medium'>Username</label>
                  <input
                    type='text'
                    placeholder='Enter your username...'
                    className='w-full rounded-lg border border-border bg-background px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/20'
                  />
                </div>
              </div>

              <div className='mt-6 flex gap-2'>
                <Button
                  onClick={() => {
                    // Mock connection - in real app this would test actual credentials
                    analytics.connectPlatform(configuringPlatform.id, {
                      apiKey: 'mock-key',
                      username: 'mock-user',
                    });
                    setConfiguringPlatform(null);
                  }}
                  className='flex-1'
                >
                  Connect Platform
                </Button>
                <Button variant='outline' onClick={() => setConfiguringPlatform(null)}>
                  Cancel
                </Button>
              </div>

              <div className='mt-4 rounded bg-secondary/20 p-3 text-xs text-muted-foreground'>
                <ExternalLink className='mr-1 inline h-3 w-3' />
                <a href='#' className='hover:text-primary'>
                  How to get your {configuringPlatform.name} API credentials
                </a>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default PublishingSetup;
