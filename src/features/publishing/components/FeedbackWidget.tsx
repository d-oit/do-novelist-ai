import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  MessageSquare,
  Search,
  Star,
  CheckCircle2,
  Heart,
  Clock
} from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { cn } from '../../../lib/utils';
import { DetailedFeedbackModal } from './DetailedFeedbackModal';
import type { ReaderFeedback } from '../types';

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
  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'text-green-600 bg-green-500/10 border-green-500/20';
      case 'negative': return 'text-red-600 bg-red-500/10 border-red-500/20';
      default: return 'text-gray-600 bg-gray-500/10 border-gray-500/20';
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return `${Math.floor(diffInHours / 24)}d ago`;
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="p-4 cursor-pointer hover:shadow-md transition-all" onClick={onExpand}>
        <div className="flex items-start gap-3">
          {feedback.author.avatar && (
            <img
              src={feedback.author.avatar}
              alt={feedback.author.name}
              className="w-10 h-10 rounded-full object-cover"
            />
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-medium text-sm truncate">{feedback.author.name}</h4>
              {feedback.author.isVerified && (
                <CheckCircle2 className="w-4 h-4 text-blue-500" />
              )}
              <span className={cn(
                "text-xs px-2 py-1 rounded-full capitalize border",
                getSentimentColor(feedback.sentiment)
              )}>
                {feedback.sentiment}
              </span>
            </div>

            {feedback.rating && (
              <div className="flex items-center gap-1 mb-2">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={cn(
                      "w-4 h-4",
                      i < feedback.rating! ? "text-yellow-500 fill-yellow-500" : "text-gray-300"
                    )}
                  />
                ))}
              </div>
            )}

            {feedback.content && (
              <p className="text-sm text-muted-foreground line-clamp-3 mb-2">
                {feedback.content}
              </p>
            )}

            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatTimeAgo(feedback.timestamp)}
                </span>
                <span className="flex items-center gap-1">
                  <Heart className="w-3 h-3" />
                  {feedback.likes}
                </span>
                {feedback.replies.length > 0 && (
                  <span className="flex items-center gap-1">
                    <MessageSquare className="w-3 h-3" />
                    {feedback.replies.length}
                  </span>
                )}
              </div>
              <span className="capitalize">{feedback.type}</span>
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
  onFilterChange
}) => {
  const [selectedFeedback, setSelectedFeedback] = useState<ReaderFeedback | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleFeedbackClick = (feedbackItem: ReaderFeedback) => {
    setSelectedFeedback(feedbackItem);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedFeedback(null);
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-serif font-semibold text-lg flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-primary" />
          Recent Feedback ({totalReviews} reviews)
        </h3>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search feedback..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-9 pr-4 py-2 text-sm bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <select
            value={feedbackFilter}
            onChange={(e) => onFilterChange(e.target.value as any)}
            className="text-sm bg-background border border-border rounded px-3 py-2"
          >
            <option value="all">All Feedback</option>
            <option value="positive">Positive</option>
            <option value="negative">Negative</option>
          </select>
        </div>
      </div>

      {/* Sentiment Overview */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card className="p-4 text-center bg-green-500/5 border-green-500/20">
          <div className="text-2xl font-bold text-green-600">
            {sentimentBreakdown.positive}
          </div>
          <div className="text-sm text-green-600">Positive</div>
        </Card>
        <Card className="p-4 text-center bg-gray-500/5 border-gray-500/20">
          <div className="text-2xl font-bold text-gray-600">
            {sentimentBreakdown.neutral}
          </div>
          <div className="text-sm text-gray-600">Neutral</div>
        </Card>
        <Card className="p-4 text-center bg-red-500/5 border-red-500/20">
          <div className="text-2xl font-bold text-red-600">
            {sentimentBreakdown.negative}
          </div>
          <div className="text-sm text-red-600">Negative</div>
        </Card>
      </div>

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {feedback.length === 0 ? (
          <div className="text-center py-8">
            <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">
              {searchQuery ? 'No feedback matches your search.' : 'No feedback available yet.'}
            </p>
          </div>
        ) : (
          feedback.slice(0, 10).map((item) => (
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
