import { motion, AnimatePresence } from 'framer-motion';
import { X, MessageSquare, User, Calendar, ThumbsUp, ThumbsDown, Minus } from 'lucide-react';
import React from 'react';

import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { type ReaderFeedback } from '../types';

interface DetailedFeedbackModalProps {
  feedback: ReaderFeedback | null;
  isOpen: boolean;
  onClose: () => void;
}

export const DetailedFeedbackModal: React.FC<DetailedFeedbackModalProps> = ({
  feedback,
  isOpen,
  onClose,
}) => {
  if (!feedback) return null;

  const getSentimentIcon = (sentiment: string): JSX.Element => {
    switch (sentiment.toLowerCase()) {
      case 'positive':
        return <ThumbsUp className='h-5 w-5 text-green-600' />;
      case 'negative':
        return <ThumbsDown className='h-5 w-5 text-red-600' />;
      default:
        return <Minus className='h-5 w-5 text-gray-500' />;
    }
  };

  const getSentimentColor = (sentiment: string): string => {
    switch (sentiment.toLowerCase()) {
      case 'positive':
        return 'border-green-500/20 bg-green-500/5';
      case 'negative':
        return 'border-red-500/20 bg-red-500/5';
      default:
        return 'border-gray-500/20 bg-gray-500/5';
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className='fixed inset-0 z-50 flex items-center justify-center'>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className='absolute inset-0 bg-black/50 backdrop-blur-sm'
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className='relative z-10 mx-4 max-h-[90vh] w-full max-w-2xl overflow-hidden'
          >
            <Card className='border-2 bg-white dark:bg-gray-900'>
              {/* Header */}
              <div className='flex items-center justify-between border-b border-gray-200 p-6 dark:border-gray-700'>
                <div className='flex items-center gap-3'>
                  <MessageSquare className='h-6 w-6 text-blue-600' />
                  <h2 className='text-xl font-semibold'>Detailed Feedback</h2>
                </div>
                <Button variant='ghost' size='sm' onClick={onClose} className='h-8 w-8 p-0'>
                  <X className='h-4 w-4' />
                </Button>
              </div>

              {/* Content */}
              <div className='max-h-[70vh] overflow-y-auto p-6'>
                {/* Feedback Header */}
                <div className={`mb-6 rounded-lg p-4 ${getSentimentColor(feedback.sentiment)}`}>
                  <div className='mb-2 flex items-center justify-between'>
                    <div className='flex items-center gap-2'>
                      {getSentimentIcon(feedback.sentiment)}
                      <span className='font-medium capitalize'>{feedback.sentiment} Feedback</span>
                    </div>
                    <div className='text-sm text-gray-500'>Score: {feedback.rating}/5</div>
                  </div>

                  <div className='flex items-center gap-4 text-sm text-gray-600'>
                    <div className='flex items-center gap-1'>
                      <User className='h-4 w-4' />
                      {feedback.author.name}
                    </div>
                    <div className='flex items-center gap-1'>
                      <Calendar className='h-4 w-4' />
                      {new Date(feedback.timestamp).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                {/* Main Feedback Content */}
                <div className='space-y-4'>
                  <div>
                    <h3 className='mb-2 text-lg font-medium'>Feedback</h3>
                    <div className='prose prose-sm max-w-none dark:prose-invert'>
                      <p className='leading-relaxed text-gray-700 dark:text-gray-300'>
                        {feedback.content}
                      </p>
                    </div>
                  </div>

                  {/* Topics as Tags */}
                  {feedback.topics.length > 0 && (
                    <div>
                      <h4 className='mb-2 font-medium'>Topics</h4>
                      <div className='flex flex-wrap gap-2'>
                        {feedback.topics.map((topic: string) => (
                          <span
                            key={topic}
                            className='rounded bg-blue-100 px-2 py-1 text-sm text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                          >
                            {topic}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Platform Info */}
                  <div>
                    <h4 className='mb-2 font-medium'>Source</h4>
                    <div className='text-sm text-gray-600 dark:text-gray-400'>
                      <div>Platform: {feedback.platformId}</div>
                      <div>Type: {feedback.type}</div>
                      {(feedback.chapterReference?.length ?? 0) > 0 && (
                        <div>Chapter: {feedback.chapterReference}</div>
                      )}
                    </div>
                  </div>

                  {/* Additional Metadata */}
                  {feedback.author.isVerified !== null &&
                    feedback.author.isVerified !== undefined &&
                    feedback.author.isVerified && (
                      <div>
                        <h4 className='mb-2 font-medium'>Status</h4>
                        <div className='text-sm text-green-600 dark:text-green-400'>
                          ✓ Verified Reader
                        </div>
                      </div>
                    )}

                  {/* Engagement Info */}
                  <div>
                    <h4 className='mb-2 font-medium'>Engagement</h4>
                    <div className='text-sm text-gray-600 dark:text-gray-400'>
                      <div>Likes: {feedback.likes}</div>
                      {feedback.replies.length > 0 && <div>Replies: {feedback.replies.length}</div>}
                      <div>Visibility: {feedback.isPublic ? 'Public' : 'Private'}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className='flex justify-end border-t border-gray-200 p-6 dark:border-gray-700'>
                <Button onClick={onClose}>Close</Button>
              </div>
            </Card>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default DetailedFeedbackModal;
