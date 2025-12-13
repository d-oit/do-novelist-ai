
import { motion } from 'framer-motion';
import type { FC } from 'react';

import { EventNode } from '@/features/timeline/components/EventNode';
import type { TimelineEvent } from '@/types';

interface TimelineCanvasProps {
  events: TimelineEvent[];
  onEventClick: (eventId: string) => void;
  selectedEventId: string | null;
}

export const TimelineCanvas: FC<TimelineCanvasProps> = ({
  events,
  onEventClick,
  selectedEventId,
}) => {
  // Sort events by chronological index
  const sortedEvents = [...events].sort((a, b) => a.chronologicalIndex - b.chronologicalIndex);

  return (
    <div className='h-full w-full overflow-x-auto overflow-y-hidden bg-zinc-50/50 p-8 dark:bg-zinc-900/50'>
      <div className='relative flex h-full min-w-max items-center p-8'>
        {/* The Rail */}
        <div className='absolute left-0 right-0 top-1/2 -z-10 h-1 -translate-y-1/2 transform bg-border' />

        <div className='flex items-center gap-12'>
          {sortedEvents.map(event => (
            <div key={event.id} className='group relative'>
              {/* Dot on the rail */}
              <div className='absolute left-1/2 top-1/2 z-0 h-4 w-4 -translate-x-1/2 -translate-y-1/2 transform rounded-full bg-primary ring-4 ring-background transition-transform group-hover:scale-125' />

              {/* Connector Line to Card - Alternating Top/Bottom possibly? For now, we'll keep them centered or top aligned */}

              <div
                className={
                  event.chronologicalIndex % 2 === 0
                    ? 'mb-16 -translate-y-1/2 transform'
                    : 'mt-16 translate-y-1/2 transform'
                }
              >
                <EventNode
                  event={event}
                  onClick={() => onEventClick(event.id)}
                  isSelected={selectedEventId === event.id}
                />
              </div>
            </div>
          ))}

          {/* Add Event Placeholder */}
          <motion.div
            className='flex h-12 w-12 cursor-pointer items-center justify-center rounded-full border-2 border-dashed border-muted-foreground opacity-50 transition-colors hover:bg-muted hover:opacity-100'
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            title='Add Event'
          >
            <span className='text-xl'>+</span>
          </motion.div>
        </div>
      </div>
    </div>
  );
};
