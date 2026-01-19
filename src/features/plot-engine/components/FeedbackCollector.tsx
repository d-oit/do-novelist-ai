/**
 * Feedback Collector Component
 *
 * Collects user feedback for the Plot Engine feature during beta testing
 */

import { MessageSquare, Send, X } from 'lucide-react';
import React, { useState } from 'react';

import { logger } from '@/lib/logging/logger';
import { cn } from '@/lib/utils';
import { Button } from '@/shared/components/ui/Button';
import { Card } from '@/shared/components/ui/Card';

export interface FeedbackData {
  type: 'bug' | 'feature' | 'general';
  rating?: number;
  message: string;
  context?: {
    component?: string;
    action?: string;
  };
  timestamp: Date;
  userAgent: string;
}

interface FeedbackCollectorProps {
  component?: string;
  onSubmit?: (feedback: FeedbackData) => Promise<void>;
  className?: string;
}

export const FeedbackCollector: React.FC<FeedbackCollectorProps> = React.memo(
  ({ component, onSubmit, className = '' }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [feedbackType, setFeedbackType] = useState<'bug' | 'feature' | 'general'>('general');
    const [rating, setRating] = useState<number | undefined>(undefined);
    const [message, setMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = async (e: React.FormEvent): Promise<void> => {
      e.preventDefault();

      if (!message.trim()) {
        return;
      }

      setIsSubmitting(true);

      const feedback: FeedbackData = {
        type: feedbackType,
        rating,
        message: message.trim(),
        context: {
          component,
        },
        timestamp: new Date(),
        userAgent: navigator.userAgent,
      };

      try {
        // Call custom onSubmit handler if provided
        if (onSubmit) {
          await onSubmit(feedback);
        } else {
          // Default: Log feedback locally
          logger.info('User feedback collected', {
            component: 'FeedbackCollector',
            feedback,
          });

          // Store in localStorage for later retrieval
          const existingFeedback = localStorage.getItem('plot-engine-feedback');
          const feedbackList = existingFeedback ? JSON.parse(existingFeedback) : [];
          feedbackList.push(feedback);
          localStorage.setItem('plot-engine-feedback', JSON.stringify(feedbackList));
        }

        setSubmitted(true);
        setTimeout(() => {
          setIsOpen(false);
          setSubmitted(false);
          setMessage('');
          setRating(undefined);
          setFeedbackType('general');
        }, 2000);
      } catch (error) {
        logger.error('Failed to submit feedback', {
          component: 'FeedbackCollector',
          error,
        });
      } finally {
        setIsSubmitting(false);
      }
    };

    if (!isOpen) {
      return (
        <Button
          onClick={() => setIsOpen(true)}
          variant='outline'
          size='sm'
          className={cn('gap-2', className)}
          data-testid='feedback-button'
          aria-label='Provide feedback'
        >
          <MessageSquare className='h-4 w-4' />
          Feedback
        </Button>
      );
    }

    return (
      <Card className={cn('p-6', className)} data-testid='feedback-form'>
        <div className='flex items-start justify-between'>
          <div>
            <h3 className='text-lg font-semibold'>Share Your Feedback</h3>
            <p className='mt-1 text-sm text-muted-foreground'>Help us improve the AI Plot Engine</p>
          </div>
          <Button
            onClick={() => setIsOpen(false)}
            variant='ghost'
            size='sm'
            aria-label='Close feedback form'
          >
            <X className='h-4 w-4' />
          </Button>
        </div>

        {submitted ? (
          <div className='mt-6 text-center'>
            <div className='mb-2 text-4xl'>✓</div>
            <p className='font-medium text-primary'>Thank you for your feedback!</p>
            <p className='mt-1 text-sm text-muted-foreground'>
              Your input helps us make Plot Engine better.
            </p>
          </div>
        ) : (
          <form
            onSubmit={e => void handleSubmit(e)}
            role='form'
            aria-label='Feedback form'
            className='mt-6 space-y-4'
          >
            {/* Feedback Type */}
            <div>
              <label className='mb-2 block text-sm font-medium'>Feedback Type</label>
              <div className='flex gap-2'>
                <Button
                  type='button'
                  variant={feedbackType === 'bug' ? 'default' : 'outline'}
                  size='sm'
                  onClick={() => setFeedbackType('bug')}
                  className='flex-1'
                >
                  Bug Report
                </Button>
                <Button
                  type='button'
                  variant={feedbackType === 'feature' ? 'default' : 'outline'}
                  size='sm'
                  onClick={() => setFeedbackType('feature')}
                  className='flex-1'
                >
                  Feature Request
                </Button>
                <Button
                  type='button'
                  variant={feedbackType === 'general' ? 'default' : 'outline'}
                  size='sm'
                  onClick={() => setFeedbackType('general')}
                  className='flex-1'
                >
                  General
                </Button>
              </div>
            </div>

            {/* Rating (optional) */}
            <div>
              <label className='mb-2 block text-sm font-medium'>
                Rating <span className='text-muted-foreground'>(optional)</span>
              </label>
              <div className='flex gap-1'>
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    type='button'
                    onClick={() => setRating(star)}
                    className={cn(
                      'text-2xl transition-colors',
                      rating && star <= rating ? 'text-yellow-500' : 'text-gray-300',
                    )}
                    aria-label={`Rate ${star} stars`}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>

            {/* Message */}
            <div>
              <label htmlFor='feedback-message' className='mb-2 block text-sm font-medium'>
                Your Feedback <span className='text-destructive'>*</span>
              </label>
              <textarea
                id='feedback-message'
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder='Tell us what you think...'
                rows={4}
                className='w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
                required
                data-testid='feedback-message'
              />
            </div>

            {/* Submit */}
            <div className='flex justify-end gap-2'>
              <Button
                type='button'
                variant='outline'
                onClick={() => setIsOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type='submit'
                disabled={isSubmitting || !message.trim()}
                className='gap-2'
                data-testid='feedback-submit'
              >
                {isSubmitting ? (
                  'Sending...'
                ) : (
                  <>
                    <Send className='h-4 w-4' />
                    Send Feedback
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </Card>
    );
  },
);

FeedbackCollector.displayName = 'FeedbackCollector';
