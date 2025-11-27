import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, AlertCircle, Settings } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { cn } from '../../../lib/utils';
import type { PublishingPlatform } from '../types';

interface PlatformCardProps {
  platform: PublishingPlatform;
  isSelected: boolean;
  onToggle: () => void;
  onConfigure: () => void;
}

const getPlatformIcon = (name: string): string => {
  // In a real app, these would be actual platform logos
  switch (name.toLowerCase()) {
    case 'wattpad': return '📚';
    case 'archive of our own': return '🏛️';
    case 'amazon kindle direct publishing': return '📖';
    case 'personal website': return '🌐';
    default: return '📄';
  }
};

const getPlatformDescription = (platform: PublishingPlatform): string => {
  switch (platform.id) {
    case 'wattpad':
      return 'Social platform for young adult fiction. Free to publish, large community.';
    case 'ao3':
      return 'Non-profit archive for fan fiction and original works. Free and open.';
    case 'kindle':
      return 'Amazon\'s self-publishing platform. Potential for revenue generation.';
    case 'personal':
      return 'Your own website or blog. Complete control over presentation.';
    default:
      return 'Publishing platform for sharing your creative work.';
  }
};

export const PlatformCard: React.FC<PlatformCardProps> = ({
  platform,
  isSelected,
  onToggle,
  onConfigure
}) => {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      <Card className={cn(
        "p-4 cursor-pointer transition-all relative",
        isSelected
          ? "ring-2 ring-primary bg-primary/5 border-primary/30"
          : "hover:shadow-md border-border",
        !platform.isConnected && "opacity-75"
      )}>
        <div className="flex items-start gap-3">
          <div className="text-2xl">{getPlatformIcon(platform.name)}</div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-medium text-sm truncate">{platform.name}</h4>
              {platform.isConnected ? (
                <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-orange-500 flex-shrink-0" />
              )}
            </div>

            <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
              {getPlatformDescription(platform)}
            </p>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <span className="capitalize">{platform.type}</span>
                <span>•</span>
                <span>{platform.supportedFormats.join(', ')}</span>
              </div>

              <div className="flex items-center gap-1">
                {!platform.isConnected && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onConfigure();
                    }}
                    className="h-7 text-xs"
                  >
                    <Settings className="w-3 h-3 mr-1" />
                    Setup
                  </Button>
                )}

                <div className={cn(
                  "w-4 h-4 rounded border-2 transition-colors",
                  isSelected
                    ? "bg-primary border-primary"
                    : "border-border hover:border-primary/50"
                )}>
                  {isSelected && <CheckCircle2 className="w-full h-full text-primary-foreground" />}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div
          className="absolute inset-0 rounded-lg pointer-events-none"
          onClick={onToggle}
        />
      </Card>
    </motion.div>
  );
};
