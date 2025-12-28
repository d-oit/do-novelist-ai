import { motion } from 'framer-motion';
import { PieChart, MapPin, Calendar } from 'lucide-react';
import React from 'react';

import { Card } from '@/shared/components/ui/Card';
import { type ReaderInsights } from '@/types';

interface PlatformStatusGridProps {
  insights: ReaderInsights | null;
}

export const PlatformStatusGrid: React.FC<PlatformStatusGridProps> = ({ insights }) => {
  if (!insights) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
    >
      <h3 className='mb-4 flex items-center gap-2 font-serif text-lg font-semibold'>
        <PieChart className='h-5 w-5 text-primary' />
        Audience Insights
      </h3>

      <div className='grid grid-cols-1 gap-4 lg:grid-cols-2'>
        <Card className='p-4'>
          <h4 className='mb-3 font-medium'>Top Countries</h4>
          <div className='space-y-2'>
            {insights.audienceProfile.topCountries
              .slice(0, 5)
              .map((country: string, index: number) => (
                <div key={country} className='flex items-center justify-between'>
                  <div className='flex items-center gap-2'>
                    <MapPin className='h-4 w-4 text-muted-foreground' />
                    <span className='text-sm'>{country}</span>
                  </div>
                  <div className='h-2 w-16 rounded-full bg-secondary'>
                    <div
                      className='h-2 rounded-full bg-primary transition-all'
                      style={{ width: `${100 - index * 15}%` }}
                    />
                  </div>
                </div>
              ))}
          </div>
        </Card>

        <Card className='p-4'>
          <h4 className='mb-3 font-medium'>Peak Reading Times</h4>
          <div className='space-y-2'>
            {insights.audienceProfile.peakReadingTimes.map((time: string) => (
              <div key={time} className='flex items-center gap-2'>
                <Calendar className='h-4 w-4 text-muted-foreground' />
                <span className='text-sm'>{time}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </motion.div>
  );
};
