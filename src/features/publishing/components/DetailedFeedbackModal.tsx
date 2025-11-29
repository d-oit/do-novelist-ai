import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MessageSquare, User, Calendar, ThumbsUp, ThumbsDown, Minus } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import type { ReaderFeedback } from '../types';

interface DetailedFeedbackModalProps {
  feedback: ReaderFeedback | null;
  isOpen: boolean;
  onClose: () => void;
}

export const DetailedFeedbackModal: React.FC<DetailedFeedbackModalProps> = ({
  feedback,
  isOpen,
  onClose
}) => {
  if (!feedback) return null;

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment.toLowerCase()) {
      case 'positive':
        return <ThumbsUp className="w-5 h-5 text-green-600" />;
      case 'negative':
        return <ThumbsDown className="w-5 h-5 text-red-600" />;
      default:
        return <Minus className="w-5 h-5 text-gray-500" />;
    }
  };

  const getSentimentColor = (sentiment: string) => {
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
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative z-10 w-full max-w-2xl max-h-[90vh] mx-4 overflow-hidden"
          >
            <Card className="bg-white dark:bg-gray-900 border-2">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <MessageSquare className="w-6 h-6 text-blue-600" />
                  <h2 className="text-xl font-semibold">Detailed Feedback</h2>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="h-8 w-8 p-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {/* Content */}
              <div className="p-6 max-h-[70vh] overflow-y-auto">
                {/* Feedback Header */}
                <div className={`p-4 rounded-lg mb-6 ${getSentimentColor(feedback.sentiment)}`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getSentimentIcon(feedback.sentiment)}
                      <span className="font-medium capitalize">
                        {feedback.sentiment} Feedback
                      </span>
                    </div>
                    <div className="text-sm text-gray-500">
                      Score: {feedback.rating}/5
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <User className="w-4 h-4" />
                      {feedback.author.name}
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {new Date(feedback.timestamp).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                {/* Main Feedback Content */}
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium text-lg mb-2">Feedback</h3>
                    <div className="prose prose-sm max-w-none dark:prose-invert">
                      <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                        {feedback.content}
                      </p>
                    </div>
                  </div>

                  {/* Topics as Tags */}
                  {feedback.topics && feedback.topics.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Topics</h4>
                      <div className="flex flex-wrap gap-2">
                        {feedback.topics.map((topic: string) => (
                          <span
                            key={topic}
                            className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-sm"
                          >
                            {topic}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Platform Info */}
                  <div>
                    <h4 className="font-medium mb-2">Source</h4>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      <div>Platform: {feedback.platformId}</div>
                      <div>Type: {feedback.type}</div>
                      {feedback.chapterReference && (
                        <div>Chapter: {feedback.chapterReference}</div>
                      )}
                    </div>
                  </div>

                  {/* Additional Metadata */}
                  {feedback.author.isVerified && (
                    <div>
                      <h4 className="font-medium mb-2">Status</h4>
                      <div className="text-sm text-green-600 dark:text-green-400">
                        ✓ Verified Reader
                      </div>
                    </div>
                  )}

                  {/* Engagement Info */}
                  <div>
                    <h4 className="font-medium mb-2">Engagement</h4>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      <div>Likes: {feedback.likes}</div>
                      {feedback.replies && feedback.replies.length > 0 && (
                        <div>Replies: {feedback.replies.length}</div>
                      )}
                      <div>Visibility: {feedback.isPublic ? 'Public' : 'Private'}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex justify-end p-6 border-t border-gray-200 dark:border-gray-700">
                <Button onClick={onClose}>
                  Close
                </Button>
              </div>
            </Card>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default DetailedFeedbackModal;