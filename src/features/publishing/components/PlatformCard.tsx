
import { motion } from 'framer-motion';
import { CheckCircle2, AlertCircle, Settings } from 'lucide-react';
import React from 'react';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/utils';
import { type PublishingPlatform } from '@/types';

interface PlatformCardProps {
  platform: PublishingPlatform;
  isSelected: boolean;
  onToggle: () => void;
  onConfigure: () => void;
}

const getPlatformIcon = (name: string): string => {
  // In a real app, these would be actual platform logos
  switch (name.toLowerCase()) {
    case 'wattpad':
      return '📚';
    case 'archive of our own':
      return '🏛️';
    case 'amazon kindle direct publishing':
      return '📖';
    case 'personal website':
      return '🌐';
    default:
      return '📄';
  }
};

const getPlatformDescription = (platform: PublishingPlatform): string => {
  switch (platform.id) {
    case 'wattpad':
      return 'Social platform for young adult fiction. Free to publish, large community.';
    case 'ao3':
      return 'Non-profit archive for fan fiction and original works. Free and open.';
    case 'kindle':
      return "Amazon's self-publishing platform. Potential for revenue generation.";
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
  onConfigure,
}) => {
  return (
    <motion.div whileHover={{ scale: 1.02 }} transition={{ duration: 0.2 }}>
      <Card
        className={cn(
          'relative cursor-pointer p-4 transition-all',
          isSelected
            ? 'border-primary/30 bg-primary/5 ring-2 ring-primary'
            : 'border-border hover:shadow-md',
          !platform.isConnected && 'opacity-75'
        )}
      >
        <div className='flex items-start gap-3'>
          <div className='text-2xl'>{getPlatformIcon(platform.name)}</div>

          <div className='min-w-0 flex-1'>
            <div className='mb-1 flex items-center gap-2'>
              <h4 className='truncate text-sm font-medium'>{platform.name}</h4>
              {platform.isConnected ? (
                <CheckCircle2 className='h-4 w-4 flex-shrink-0 text-green-500' />
              ) : (
                <AlertCircle className='h-4 w-4 flex-shrink-0 text-orange-500' />
              )}
            </div>

            <p className='mb-3 line-clamp-2 text-xs text-muted-foreground'>
              {getPlatformDescription(platform)}
            </p>

            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-1 text-xs text-muted-foreground'>
                <span className='capitalize'>{platform.type}</span>
                <span>•</span>
                <span>{platform.supportedFormats.join(', ')}</span>
              </div>

              <div className='flex items-center gap-1'>
                {!platform.isConnected && (
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={e => {
                      e.stopPropagation();
                      onConfigure();
                    }}
                    className='h-7 text-xs'
                  >
                    <Settings className='mr-1 h-3 w-3' />
                    Setup
                  </Button>
                )}

                <div
                  className={cn(
                    'h-4 w-4 rounded border-2 transition-colors',
                    isSelected
                      ? 'border-primary bg-primary'
                      : 'border-border hover:border-primary/50'
                  )}
                >
                  {isSelected && <CheckCircle2 className='h-full w-full text-primary-foreground' />}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className='pointer-events-none absolute inset-0 rounded-lg' onClick={onToggle} />
      </Card>
    </motion.div>
  );
};
