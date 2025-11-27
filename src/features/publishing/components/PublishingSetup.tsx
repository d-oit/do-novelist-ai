import React, { useEffect, useState } from 'react';
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
  ExternalLink
} from 'lucide-react';
import { usePublishingAnalytics } from '../hooks/usePublishingAnalytics';
import { PublishingPlatform, Publication } from '../types';
import { Project, ChapterStatus } from '../../../types';

import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { cn, iconButtonTarget } from '../../../lib/utils';
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
  className
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

  const togglePlatform = (platformId: string) => {
    setSelectedPlatforms(prev =>
      prev.includes(platformId)
        ? prev.filter(id => id !== platformId)
        : [...prev, platformId]
    );
  };

  const handlePublish = async (metadata: any) => {
    if (selectedPlatforms.length === 0) {
      alert('Please select at least one platform to publish to.');
      return;
    }

    try {
      const publication = await analytics.publishProject(project, selectedPlatforms, metadata);
      onPublishingComplete(publication);
      setShowMetadataForm(false);
    } catch (error) {
      console.error('Publishing failed:', error);
      alert('Publishing failed. Please try again.');
    }
  };

  const selectedConnectedPlatforms = selectedPlatforms.filter(id =>
    analytics.connectedPlatforms.some(p => p.id === id)
  );

  const selectedUnconnectedPlatforms = selectedPlatforms.filter(id =>
    !analytics.connectedPlatforms.some(p => p.id === id)
  );

  return (
    <motion.div
      className={cn(
        "flex flex-col h-full bg-card/50 backdrop-blur-sm border border-border/40 rounded-lg overflow-hidden",
        className
      )}
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-border/40 bg-gradient-to-r from-green-500/5 via-transparent to-blue-500/5">
        <div className="flex items-center gap-3">
          <Upload className="w-6 h-6 text-primary" />
          <div>
            <h2 className="font-serif font-semibold text-xl">Publish Your Book</h2>
            <p className="text-sm text-muted-foreground">
              Share "{project.title}" with the world
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className={iconButtonTarget("text-sm rounded-lg hover:bg-muted transition-colors")}
          aria-label="Close publishing setup"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Project Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="p-6 bg-gradient-to-br from-card via-card/90 to-primary/5">
            <div className="flex items-start gap-4">
              <BookOpen className="w-12 h-12 text-primary mt-1" />
              <div className="flex-1">
                <h3 className="font-serif font-semibold text-lg mb-2">{project.title}</h3>
                <p className="text-muted-foreground mb-4 line-clamp-3">{project.idea}</p>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-muted-foreground" />
                    <span>{project.chapters.length} chapters</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <span>{project.style} style</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-muted-foreground" />
                    <span>
                      {project.chapters.reduce((total, ch) =>
                        total + ch.content.split(' ').length, 0
                      ).toLocaleString()} words
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <span>
                      {project.chapters.filter(ch => ch.status === ChapterStatus.COMPLETE).length} complete

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
          <h3 className="font-serif font-semibold text-lg mb-4 flex items-center gap-2">
            <Globe className="w-5 h-5 text-primary" />
            Select Publishing Platforms
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            <div className="mt-4 p-4 bg-orange-500/10 border border-orange-500/20 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-orange-500 mt-0.5" />
                <div>
                  <h4 className="font-medium text-orange-700 dark:text-orange-400">
                    Platform Setup Required
                  </h4>
                  <p className="text-sm text-orange-600 dark:text-orange-300 mt-1">
                    You've selected platforms that aren't connected yet. Please configure them first.
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
            <h3 className="font-serif font-semibold text-lg mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-primary" />
              Ready to Publish
            </h3>

            <Card className="p-4 bg-green-500/5 border-green-500/20">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5" />
                <div>
                  <h4 className="font-medium text-green-700 dark:text-green-400 mb-2">
                    {selectedConnectedPlatforms.length} platform{selectedConnectedPlatforms.length !== 1 ? 's' : ''} selected
                  </h4>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {selectedConnectedPlatforms.map(platformId => {
                      const platform = analytics.platforms.find(p => p.id === platformId);
                      return platform ? (
                        <span
                          key={platformId}
                          className="px-2 py-1 bg-green-500/20 text-green-700 dark:text-green-300 rounded text-xs"
                        >
                          {platform.name}
                        </span>
                      ) : null;
                    })}
                  </div>

                  <Button
                    onClick={() => setShowMetadataForm(true)}
                    className="w-full md:w-auto"
                  >
                    <Upload className="w-4 h-4 mr-2" />
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
            onSubmit={handlePublish}
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
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <Card className="w-full max-w-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-serif font-semibold text-lg">
                  Connect to {configuringPlatform.name}
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setConfiguringPlatform(null)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <p className="text-muted-foreground mb-4">
                Configure your connection to {configuringPlatform.name} to start publishing.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">API Key</label>
                  <input
                    type="password"
                    placeholder="Enter your API key..."
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Username</label>
                  <input
                    type="text"
                    placeholder="Enter your username..."
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              <div className="flex gap-2 mt-6">
                <Button
                  onClick={async () => {
                    // Mock connection - in real app this would test actual credentials
                    await analytics.connectPlatform(configuringPlatform.id, {
                      apiKey: 'mock-key',
                      username: 'mock-user'
                    });
                    setConfiguringPlatform(null);
                  }}
                  className="flex-1"
                >
                  Connect Platform
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setConfiguringPlatform(null)}
                >
                  Cancel
                </Button>
              </div>

              <div className="mt-4 p-3 bg-secondary/20 rounded text-xs text-muted-foreground">
                <ExternalLink className="w-3 h-3 inline mr-1" />
                <a href="#" className="hover:text-primary">
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
