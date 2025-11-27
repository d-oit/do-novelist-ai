import React from 'react';
import { motion } from 'framer-motion';
import { PieChart, MapPin, Calendar } from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import type { PublishingInsights } from '../types';

interface PlatformStatusGridProps {
  insights: PublishingInsights | null;
}

export const PlatformStatusGrid: React.FC<PlatformStatusGridProps> = ({ insights }) => {
  if (!insights) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
    >
      <h3 className="font-serif font-semibold text-lg mb-4 flex items-center gap-2">
        <PieChart className="w-5 h-5 text-primary" />
        Audience Insights
      </h3>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-4">
          <h4 className="font-medium mb-3">Top Countries</h4>
          <div className="space-y-2">
            {insights.audienceProfile.topCountries.slice(0, 5).map((country, index) => (
              <div key={country} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">{country}</span>
                </div>
                <div className="w-16 bg-secondary rounded-full h-2">
                  <div
                    className="bg-primary rounded-full h-2 transition-all"
                    style={{ width: `${100 - index * 15}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-4">
          <h4 className="font-medium mb-3">Peak Reading Times</h4>
          <div className="space-y-2">
            {insights.audienceProfile.peakReadingTimes.map((time, index) => (
              <div key={time} className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">{time}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </motion.div>
  );
};
