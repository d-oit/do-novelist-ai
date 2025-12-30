import { motion } from 'framer-motion';
import { Calendar, MapPin, Users } from 'lucide-react';
import React from 'react';

import { cn } from '@/lib/utils';
import { Badge } from '@/shared/components/ui/Badge';
import type { TimelineEvent } from '@/types';

interface EventNodeProps {
  event: TimelineEvent;
  isSelected: boolean;
  onClick: () => void;
}

export const EventNode: React.FC<EventNodeProps> = ({ event, isSelected, onClick }) => {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={cn('w-[250px] min-w-[250px] cursor-pointer', isSelected && 'ring-2 ring-blue-500')}
    >
      <div className='flex h-full flex-col gap-2 rounded-lg border bg-card p-4 text-card-foreground shadow-sm'>
        <div className='flex items-center justify-between'>
          <span className='font-mono text-xs text-muted-foreground'>
            #{event.chronologicalIndex}
          </span>
          {event.importance === 'major' && (
            <Badge variant='destructive' className='h-5 px-1 text-[10px]'>
              Major
            </Badge>
          )}
        </div>

        <h3 className='text-lg font-semibold leading-tight'>{event.title}</h3>
        <p className='line-clamp-3 text-sm text-muted-foreground'>{event.description}</p>

        <div className='mt-auto flex flex-col gap-1 border-t pt-2 text-xs text-muted-foreground'>
          {event.date && (
            <div className='flex items-center gap-1'>
              <Calendar className='h-3 w-3' />
              <span>{event.date}</span>
            </div>
          )}
          {event.locationId && (
            <div className='flex items-center gap-1'>
              <MapPin className='h-3 w-3' />
              <span>{event.locationId}</span>
            </div>
          )}
          {event.charactersInvolved.length > 0 && (
            <div className='flex items-center gap-1'>
              <Users className='h-3 w-3' />
              <span>{event.charactersInvolved.length} Characters</span>
            </div>
          )}
        </div>

        {event.tags.length > 0 && (
          <div className='mt-2 flex flex-wrap gap-1'>
            {event.tags.map(tag => (
              <span
                key={tag}
                className='rounded-md bg-secondary px-1.5 py-0.5 text-[10px] text-secondary-foreground'
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};
