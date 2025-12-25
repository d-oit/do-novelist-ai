/**
 * InlineSuggestionTooltip Component
 * Displays inline suggestions with actions in a tooltip format
 */

import { Check, X, ChevronDown, ChevronUp, Info } from 'lucide-react';
import React, { useState, useCallback } from 'react';

import type { InlineSuggestion } from '@/features/writing-assistant/types';
import { isGrammarSuggestion } from '@/features/writing-assistant/types/grammarSuggestions';
import { cn } from '@/lib/utils';

interface InlineSuggestionTooltipProps {
  suggestion: InlineSuggestion;
  onAccept: () => void;
  onDismiss: () => void;
  position: { x: number; y: number };
  isExpanded?: boolean;
  onToggleExpand?: () => void;
}

// ============================================================================
// Component
// ============================================================================

export const InlineSuggestionTooltip: React.FC<InlineSuggestionTooltipProps> = ({
  suggestion,
  onAccept,
  onDismiss,
  position,
  isExpanded = false,
  onToggleExpand,
}) => {
  const [isAnimating, setIsAnimating] = useState(false);

  const handleAccept = useCallback(() => {
    setIsAnimating(true);
    onAccept();
    setTimeout(() => setIsAnimating(false), 200);
  }, [onAccept]);

  const handleDismiss = useCallback(() => {
    setIsAnimating(true);
    onDismiss();
    setTimeout(() => setIsAnimating(false), 200);
  }, [onDismiss]);

  const getSeverityStyles = () => {
    switch (suggestion.severity) {
      case 'error':
        return 'bg-red-500/10 border-red-500/30 text-red-700 dark:text-red-300';
      case 'warning':
        return 'bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-300';
      case 'suggestion':
        return 'bg-blue-500/10 border-blue-500/30 text-blue-700 dark:text-blue-300';
      default:
        return 'bg-gray-500/10 border-gray-500/30 text-gray-700 dark:text-gray-300';
    }
  };

  const getIcon = () => {
    switch (suggestion.severity) {
      case 'error':
        return <Info className='h-4 w-4 text-red-500' />;
      case 'warning':
        return <Info className='h-4 w-4 text-amber-500' />;
      default:
        return <Info className='h-4 w-4 text-blue-500' />;
    }
  };

  return (
    <div
      className={cn(
        'absolute z-50 min-w-[280px] max-w-md',
        'rounded-lg border shadow-lg',
        'bg-white dark:bg-gray-800',
        'transition-all duration-200',
        getSeverityStyles(),
        isAnimating && 'scale-95 opacity-0',
      )}
      style={{
        left: Math.min(position.x, typeof window !== 'undefined' ? window.innerWidth - 320 : 1000),
        top: position.y + 8,
      }}
    >
      {/* Header */}
      <div
        className='border-current/10 flex cursor-pointer items-center gap-2 border-b px-3 py-2'
        onClick={onToggleExpand}
      >
        {getIcon()}
        <span className='flex-1 truncate text-sm font-medium'>{suggestion.displayText}</span>
        {onToggleExpand && (
          <button
            className='hover:bg-current/10 rounded p-1 transition-colors'
            onClick={e => {
              e.stopPropagation();
              onToggleExpand?.();
            }}
          >
            {isExpanded ? <ChevronUp className='h-4 w-4' /> : <ChevronDown className='h-4 w-4' />}
          </button>
        )}
      </div>

      {/* Content */}
      {(isExpanded || !onToggleExpand) && (
        <div className='p-3'>
          <p className='mb-3 text-sm opacity-90'>
            {suggestion.preview ||
              ('message' in suggestion.suggestion ? suggestion.suggestion.message : '')}
          </p>

          {isGrammarSuggestion(suggestion.suggestion) && suggestion.suggestion.explanation && (
            <p className='mb-3 text-xs opacity-70'>{suggestion.suggestion.explanation}</p>
          )}

          {'suggestedText' in suggestion.suggestion && suggestion.suggestion.suggestedText && (
            <div className='bg-current/5 mb-3 rounded p-2 text-sm'>
              <span className='mb-1 block text-xs opacity-60'>Suggested:</span>
              <span className='font-medium'>{suggestion.suggestion.suggestedText}</span>
            </div>
          )}

          {/* Actions */}
          <div className='border-current/10 mt-3 flex items-center justify-end gap-2 border-t pt-3'>
            <button
              onClick={handleDismiss}
              className={cn(
                'flex items-center gap-1 px-3 py-1.5',
                'rounded-md text-sm',
                'hover:bg-current/10 transition-colors',
                'opacity-70 hover:opacity-100',
              )}
            >
              <X className='h-3.5 w-3.5' />
              Dismiss
            </button>
            <button
              onClick={handleAccept}
              className={cn(
                'flex items-center gap-1 px-3 py-1.5',
                'rounded-md text-sm',
                'bg-current text-white',
                'transition-opacity hover:opacity-90',
              )}
            >
              <Check className='h-3.5 w-3.5' />
              Accept
            </button>
          </div>
        </div>
      )}

      {/* Confidence indicator */}
      <div className='border-current/10 border-t px-3 py-1 text-xs opacity-50'>
        Confidence: {Math.round(suggestion.confidence * 100)}%
      </div>
    </div>
  );
};

// ============================================================================
// Suggestion Highlight Component
// ============================================================================

interface SuggestionHighlightProps {
  suggestion: InlineSuggestion;
  onClick: () => void;
  isSelected?: boolean;
}

export const SuggestionHighlight: React.FC<SuggestionHighlightProps> = ({
  suggestion,
  onClick,
  isSelected = false,
}) => {
  const getHighlightStyles = () => {
    switch (suggestion.severity) {
      case 'error':
        return 'bg-red-200/50 dark:bg-red-900/30 border-b-2 border-red-500';
      case 'warning':
        return 'bg-amber-200/50 dark:bg-amber-900/30 border-b-2 border-amber-500';
      case 'suggestion':
        return 'bg-blue-200/50 dark:bg-blue-900/30 border-b-2 border-blue-500';
      default:
        return 'bg-gray-200/50 dark:bg-gray-700/30 border-b-2 border-gray-500';
    }
  };

  return (
    <span
      className={cn(
        'cursor-pointer transition-all duration-150',
        getHighlightStyles(),
        isSelected && 'ring-2 ring-blue-500 ring-offset-1',
      )}
      onClick={onClick}
      title={
        'message' in suggestion.suggestion ? suggestion.suggestion.message : suggestion.displayText
      }
    >
      {suggestion.displayText}
    </span>
  );
};

// ============================================================================
// Suggestion Count Badge
// ============================================================================

interface SuggestionCountBadgeProps {
  count: number;
  severity?: InlineSuggestion['severity'];
  onClick?: () => void;
}

export const SuggestionCountBadge: React.FC<SuggestionCountBadgeProps> = ({
  count,
  severity,
  onClick,
}) => {
  const getBadgeStyles = () => {
    if (!severity) return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300';
    switch (severity) {
      case 'error':
        return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300';
      case 'warning':
        return 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300';
      case 'suggestion':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300';
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300';
    }
  };

  return (
    <button
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5',
        'rounded-full text-xs font-medium',
        'transition-opacity hover:opacity-80',
        getBadgeStyles(),
      )}
    >
      <span>{count}</span>
      {count === 1 ? 'issue' : 'issues'}
    </button>
  );
};

export default InlineSuggestionTooltip;
