import { motion } from 'framer-motion';
import { MessageSquare, Search, Star, CheckCircle2, Heart, Clock } from 'lucide-react';
import React, { useState } from 'react';

import { DetailedFeedbackModal } from '@/features/publishing/components/DetailedFeedbackModal';
import { cn } from '@/lib/utils';
import { Card } from '@/shared/components/ui/Card';
import { type ReaderFeedback } from '@/types';

interface FeedbackWidgetProps {
  feedback: ReaderFeedback[];
  totalReviews: number;
  sentimentBreakdown: {
    positive: number;
    neutral: number;
    negative: number;
  };
  searchQuery: string;
  onSearchChange: (query: string) => void;
  feedbackFilter: 'all' | 'positive' | 'negative';
  onFilterChange: (filter: 'all' | 'positive' | 'negative') => void;
}

const FeedbackCard: React.FC<{
  feedback: ReaderFeedback;
  onExpand?: () => void;
}> = ({ feedback, onExpand }) => {
  const getSentimentColor = (sentiment: string): string => {
    switch (sentiment) {
      case 'positive':
        return 'text-green-600 bg-green-500/10 border-green-500/20';
      case 'negative':
        return 'text-red-600 bg-red-500/10 border-red-500/20';
      default:
        return 'text-gray-600 bg-gray-500/10 border-gray-500/20';
    }
  };

  const formatTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return `${Math.floor(diffInHours / 24)}d ago`;
  };

  return (
    <motion.div whileHover={{ scale: 1.02 }} transition={{ duration: 0.2 }}>
      <Card className='cursor-pointer p-4 transition-all hover:shadow-md' onClick={onExpand}>
        <div className='flex items-start gap-3'>
          {(feedback.author.avatar?.length ?? 0) > 0 && (
            <img
              src={feedback.author.avatar}
              alt={feedback.author.name}
              className='h-10 w-10 rounded-full object-cover'
            />
          )}

          <div className='min-w-0 flex-1'>
            <div className='mb-1 flex items-center gap-2'>
              <h4 className='truncate text-sm font-medium'>{feedback.author.name}</h4>
              {feedback.author.isVerified !== null &&
                feedback.author.isVerified !== undefined &&
                feedback.author.isVerified && <CheckCircle2 className='h-4 w-4 text-blue-500' />}
              <span
                className={cn(
                  'rounded-full border px-2 py-1 text-xs capitalize',
                  getSentimentColor(feedback.sentiment),
                )}
              >
                {feedback.sentiment}
              </span>
            </div>

            {feedback.rating != null && !isNaN(feedback.rating) && feedback.rating > 0 && (
              <div className='mb-2 flex items-center gap-1'>
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={cn(
                      'h-4 w-4',
                      i < (feedback.rating ?? 0)
                        ? 'fill-yellow-500 text-yellow-500'
                        : 'text-gray-300',
                    )}
                  />
                ))}
              </div>
            )}

            {(feedback.content?.length ?? 0) > 0 && (
              <p className='mb-2 line-clamp-3 text-sm text-muted-foreground'>{feedback.content}</p>
            )}

            <div className='flex items-center justify-between text-xs text-muted-foreground'>
              <div className='flex items-center gap-4'>
                <span className='flex items-center gap-1'>
                  <Clock className='h-3 w-3' />
                  {formatTimeAgo(feedback.timestamp)}
                </span>
                <span className='flex items-center gap-1'>
                  <Heart className='h-3 w-3' />
                  {feedback.likes}
                </span>
                {feedback.replies.length > 0 && (
                  <span className='flex items-center gap-1'>
                    <MessageSquare className='h-3 w-3' />
                    {feedback.replies.length}
                  </span>
                )}
              </div>
              <span className='capitalize'>{feedback.type}</span>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};

export const FeedbackWidget: React.FC<FeedbackWidgetProps> = ({
  feedback,
  totalReviews,
  sentimentBreakdown,
  searchQuery,
  onSearchChange,
  feedbackFilter,
  onFilterChange,
}) => {
  const [selectedFeedback, setSelectedFeedback] = useState<ReaderFeedback | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleFeedbackClick = (feedbackItem: ReaderFeedback): void => {
    setSelectedFeedback(feedbackItem);
    setIsModalOpen(true);
  };

  const handleCloseModal = (): void => {
    setIsModalOpen(false);
    setSelectedFeedback(null);
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <div className='mb-4 flex items-center justify-between'>
        <h3 className='flex items-center gap-2 font-serif text-lg font-semibold'>
          <MessageSquare className='h-5 w-5 text-primary' />
          Recent Feedback ({totalReviews} reviews)
        </h3>

        <div className='flex items-center gap-2'>
          <div className='relative'>
            <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-muted-foreground' />
            <input
              type='text'
              placeholder='Search feedback...'
              value={searchQuery}
              onChange={e => onSearchChange(e.target.value)}
              className='rounded-md border border-border bg-background py-2 pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20'
            />
          </div>

          <select
            value={feedbackFilter}
            onChange={e => onFilterChange(e.target.value as 'all' | 'positive' | 'negative')}
            className='rounded border border-border bg-background px-3 py-2 text-sm'
          >
            <option value='all'>All Feedback</option>
            <option value='positive'>Positive</option>
            <option value='negative'>Negative</option>
          </select>
        </div>
      </div>

      {/* Sentiment Overview */}
      <div className='mb-6 grid grid-cols-3 gap-4'>
        <Card className='border-green-500/20 bg-green-500/5 p-4 text-center'>
          <div className='text-2xl font-bold text-green-600'>{sentimentBreakdown.positive}</div>
          <div className='text-sm text-green-600'>Positive</div>
        </Card>
        <Card className='border-gray-500/20 bg-gray-500/5 p-4 text-center'>
          <div className='text-2xl font-bold text-gray-600'>{sentimentBreakdown.neutral}</div>
          <div className='text-sm text-gray-600'>Neutral</div>
        </Card>
        <Card className='border-red-500/20 bg-red-500/5 p-4 text-center'>
          <div className='text-2xl font-bold text-red-600'>{sentimentBreakdown.negative}</div>
          <div className='text-sm text-red-600'>Negative</div>
        </Card>
      </div>

      <div className='max-h-96 space-y-3 overflow-y-auto'>
        {feedback.length === 0 ? (
          <div className='py-8 text-center'>
            <MessageSquare className='mx-auto mb-4 h-12 w-12 text-muted-foreground/50' />
            <p className='text-muted-foreground'>
              {searchQuery ? 'No feedback matches your search.' : 'No feedback available yet.'}
            </p>
          </div>
        ) : (
          feedback
            .slice(0, 10)
            .map(item => (
              <FeedbackCard
                key={item.id}
                feedback={item}
                onExpand={() => handleFeedbackClick(item)}
              />
            ))
        )}
      </div>

      {/* Detailed Feedback Modal */}
      <DetailedFeedbackModal
        feedback={selectedFeedback}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </motion.div>
  );
};
