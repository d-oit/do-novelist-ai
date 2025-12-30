/**
 * Writing Assistant Panel Component
 * Main UI for displaying writing suggestions and analysis
 */

import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain,
  ChevronDown,
  ChevronUp,
  Settings,
  Filter,
  CheckCircle,
  X,
  AlertTriangle,
  Info,
  Lightbulb,
  BarChart3,
  Eye,
  EyeOff,
} from 'lucide-react';
import type { FC } from 'react';
import { useState } from 'react';

import { type Character } from '@/features/characters/types';
import useWritingAssistant from '@/features/writing-assistant/hooks/useWritingAssistant';
import { cn } from '@/lib/utils';
import { Button } from '@/shared/components/ui/Button';
import { Card } from '@/shared/components/ui/Card';
import { type WritingSuggestion, type WritingSuggestionCategory } from '@/types';

interface WritingAssistantPanelProps {
  content: string;
  chapterId?: string;
  projectId?: string;
  className?: string;
  characterContext?: Character[];
  plotContext?: string;
}

const SuggestionIcon: FC<{ suggestion: WritingSuggestion }> = ({ suggestion }) => {
  const iconProps = { className: 'w-4 h-4' };

  switch (suggestion.severity) {
    case 'error':
      return <AlertTriangle {...iconProps} className='h-4 w-4 text-red-500' />;
    case 'warning':
      return <AlertTriangle {...iconProps} className='h-4 w-4 text-yellow-500' />;
    case 'suggestion':
      return <Lightbulb {...iconProps} className='h-4 w-4 text-blue-500' />;
    default:
      return <Info {...iconProps} className='h-4 w-4 text-gray-500' />;
  }
};

const SeverityBadge: FC<{ severity: WritingSuggestion['severity'] }> = ({ severity }) => {
  const styles = {
    error:
      'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800',
    warning:
      'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800',
    suggestion:
      'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
    info: 'bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-800',
  };

  return (
    <span className={cn('rounded-full border px-2 py-1 text-xs font-medium', styles[severity])}>
      {severity.charAt(0).toUpperCase() + severity.slice(1)}
    </span>
  );
};

const SuggestionCard: FC<{
  suggestion: WritingSuggestion;
  isSelected?: boolean;
  onSelect: () => void;
  onApply: () => void;
  onDismiss: () => void;
}> = ({ suggestion, isSelected, onSelect, onApply, onDismiss }) => {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={cn(
        'cursor-pointer rounded-lg border p-4 transition-all hover:shadow-md',
        isSelected === true
          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
          : 'border-gray-200 dark:border-gray-700',
      )}
      onClick={onSelect}
    >
      <div className='flex items-start gap-3'>
        <SuggestionIcon suggestion={suggestion} />

        <div className='min-w-0 flex-1'>
          <div className='mb-2 flex items-center gap-2'>
            <SeverityBadge severity={suggestion.severity} />
            <span className='text-xs capitalize text-gray-500'>
              {suggestion.category.replace('_', ' ')}
            </span>
            <span className='ml-auto text-xs text-gray-400'>
              {Math.round(suggestion.confidence * 100)}% confidence
            </span>
          </div>

          <p className='mb-2 text-sm text-gray-900 dark:text-gray-100'>{suggestion.message}</p>

          {suggestion.originalText != null && (
            <div className='mb-2 rounded bg-gray-100 p-2 dark:bg-gray-800'>
              <p className='mb-1 text-xs text-gray-600 dark:text-gray-400'>Original:</p>
              <p className='font-mono text-sm text-gray-800 dark:text-gray-200'>
                "{suggestion.originalText}"
              </p>
            </div>
          )}

          {suggestion.suggestedText != null && (
            <div className='mb-2 rounded bg-green-50 p-2 dark:bg-green-900/30'>
              <p className='mb-1 text-xs text-green-600 dark:text-green-400'>Suggested:</p>
              <p className='font-mono text-sm text-green-800 dark:text-green-200'>
                "{suggestion.suggestedText}"
              </p>
            </div>
          )}

          <AnimatePresence>
            {showDetails && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className='mt-2 border-t pt-2'
              >
                <p className='mb-1 text-xs text-gray-600 dark:text-gray-400'>Reasoning:</p>
                <p className='text-sm text-gray-700 dark:text-gray-300'>{suggestion.reasoning}</p>
              </motion.div>
            )}
          </AnimatePresence>

          <div className='mt-3 flex items-center justify-between'>
            <div className='flex gap-2'>
              {(suggestion.suggestedText?.length ?? 0) > 0 && (
                <Button
                  size='sm'
                  variant='default'
                  onClick={e => {
                    e.stopPropagation();
                    onApply();
                  }}
                >
                  <CheckCircle className='mr-1 h-3 w-3' />
                  Apply
                </Button>
              )}
              <Button
                size='sm'
                variant='ghost'
                onClick={e => {
                  e.stopPropagation();
                  onDismiss();
                }}
              >
                <X className='mr-1 h-3 w-3' />
                Dismiss
              </Button>
            </div>

            <Button
              size='sm'
              variant='ghost'
              onClick={e => {
                e.stopPropagation();
                setShowDetails(!showDetails);
              }}
            >
              {showDetails ? (
                <ChevronUp className='h-3 w-3' />
              ) : (
                <ChevronDown className='h-3 w-3' />
              )}
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const AnalysisStats: FC<{
  stats: {
    totalSuggestions: number;
    highPrioritySuggestions: number;
    avgConfidence: number;
    topCategories: { category: WritingSuggestionCategory; count: number }[];
  };
  readabilityScore?: number;
  engagementScore?: number;
}> = ({ stats, readabilityScore, engagementScore }) => {
  return (
    <div className='mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4'>
      <Card className='p-3 text-center'>
        <div className='text-2xl font-bold text-blue-600'>{stats.totalSuggestions}</div>
        <div className='text-xs text-gray-600'>Total Suggestions</div>
      </Card>

      <Card className='p-3 text-center'>
        <div className='text-2xl font-bold text-orange-600'>{stats.highPrioritySuggestions}</div>
        <div className='text-xs text-gray-600'>High Priority</div>
      </Card>

      {readabilityScore !== undefined && (
        <Card className='p-3 text-center'>
          <div className='text-2xl font-bold text-green-600'>{Math.round(readabilityScore)}</div>
          <div className='text-xs text-gray-600'>Readability Score</div>
        </Card>
      )}

      {engagementScore !== undefined && (
        <Card className='p-3 text-center'>
          <div className='text-2xl font-bold text-purple-600'>{Math.round(engagementScore)}</div>
          <div className='text-xs text-gray-600'>Engagement Score</div>
        </Card>
      )}
    </div>
  );
};

export const WritingAssistantPanel: FC<WritingAssistantPanelProps> = ({
  content,
  chapterId,
  projectId,
  className,
  characterContext,
  plotContext,
}) => {
  const assistant = useWritingAssistant(content, {
    chapterId,
    projectId,
    characterContext,
    plotContext,
    enablePersistence: true, // Enable hybrid storage approach
  });

  const [showFilters, setShowFilters] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const categoryOptions: { value: WritingSuggestionCategory | 'all'; label: string }[] = [
    { value: 'all', label: 'All Categories' },
    { value: 'readability', label: 'Readability' },
    { value: 'engagement', label: 'Engagement' },
    { value: 'consistency', label: 'Consistency' },
    { value: 'flow', label: 'Flow' },
    { value: 'dialogue', label: 'Dialogue' },
    { value: 'character_voice', label: 'Character Voice' },
    { value: 'description', label: 'Description' },
    { value: 'plot_structure', label: 'Plot Structure' },
    { value: 'show_vs_tell', label: 'Show vs Tell' },
  ];

  const sortOptions: { value: typeof assistant.sortBy; label: string }[] = [
    { value: 'severity', label: 'By Severity' },
    { value: 'type', label: 'By Type' },
    { value: 'position', label: 'By Position' },
    { value: 'confidence', label: 'By Confidence' },
  ];

  return (
    <div className={cn('writing-assistant-panel', className)}>
      {/* Header */}
      <div className='mb-4 flex items-center justify-between'>
        <div className='flex items-center gap-2'>
          <Brain className='h-5 w-5 text-blue-600' />
          <h3 className='text-lg font-semibold'>Writing Assistant</h3>
          <Button
            size='sm'
            variant={assistant.isActive ? 'default' : 'outline'}
            onClick={assistant.toggleAssistant}
          >
            {assistant.isActive ? <Eye className='h-4 w-4' /> : <EyeOff className='h-4 w-4' />}
          </Button>
        </div>

        <div className='flex items-center gap-2'>
          <Button size='sm' variant='ghost' onClick={() => setShowFilters(!showFilters)}>
            <Filter className='h-4 w-4' />
          </Button>
          <Button size='sm' variant='ghost' onClick={() => setShowSettings(!showSettings)}>
            <Settings className='h-4 w-4' />
          </Button>
        </div>
      </div>

      {!assistant.isActive && (
        <Card className='p-4 text-center'>
          <Brain className='mx-auto mb-2 h-12 w-12 text-gray-400' />
          <p className='mb-3 text-gray-600'>
            Activate the Writing Assistant to get intelligent suggestions and analysis
          </p>
          <Button onClick={assistant.toggleAssistant}>Activate Assistant</Button>
        </Card>
      )}

      {assistant.isActive && (
        <>
          {/* Filters */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className='mb-4 rounded-lg bg-gray-50 p-4 dark:bg-gray-900'
              >
                <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                  <div>
                    <label className='mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300'>
                      Filter by Category
                    </label>
                    <select
                      value={assistant.filterBy}
                      onChange={e =>
                        assistant.filterSuggestions(
                          e.target.value as WritingSuggestionCategory | 'all',
                        )
                      }
                      className='w-full rounded-md border border-gray-300 bg-white px-3 py-2 dark:border-gray-600 dark:bg-gray-800'
                    >
                      {categoryOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className='mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300'>
                      Sort by
                    </label>
                    <select
                      value={assistant.sortBy}
                      onChange={e =>
                        assistant.sortSuggestions(e.target.value as typeof assistant.sortBy)
                      }
                      className='w-full rounded-md border border-gray-300 bg-white px-3 py-2 dark:border-gray-600 dark:bg-gray-800'
                    >
                      {sortOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Analysis Stats */}
          {assistant.currentAnalysis && (
            <AnalysisStats
              stats={assistant.analysisStats}
              readabilityScore={assistant.currentAnalysis.readabilityScore}
              engagementScore={assistant.currentAnalysis.engagementScore}
            />
          )}

          {/* Analysis Status */}
          {(assistant.isAnalyzing || assistant.isAnalyzingLocal) && (
            <Card className='mb-4 p-4'>
              <div className='flex items-center gap-2'>
                <div
                  className={cn(
                    'h-4 w-4 animate-spin rounded-full border-b-2',
                    assistant.isAnalyzing ? 'border-blue-600' : 'border-green-500',
                  )}
                />
                <span className='text-sm text-gray-600'>
                  {assistant.isAnalyzing ? 'Deep analysis in progress...' : 'Updating metrics...'}
                </span>
              </div>
            </Card>
          )}

          {(assistant.analysisError?.length ?? 0) > 0 && (
            <Card className='mb-4 border-red-200 bg-red-50 p-4 dark:bg-red-900/20'>
              <div className='flex items-center gap-2'>
                <AlertTriangle className='h-4 w-4 text-red-500' />
                <span className='text-sm text-red-700 dark:text-red-300'>
                  Analysis failed: {assistant.analysisError}
                </span>
              </div>
            </Card>
          )}

          {/* Suggestions List */}
          <div className='space-y-3'>
            {assistant.filteredSuggestions.length === 0 && !assistant.isAnalyzing && (
              <Card className='p-6 text-center'>
                <CheckCircle className='mx-auto mb-2 h-12 w-12 text-green-500' />
                <p className='text-gray-600'>
                  {content
                    ? 'No suggestions found. Your writing looks great!'
                    : 'Start writing to get suggestions.'}
                </p>
              </Card>
            )}

            <AnimatePresence>
              {assistant.filteredSuggestions.map(suggestion => (
                <SuggestionCard
                  key={suggestion.id}
                  suggestion={suggestion}
                  isSelected={assistant.selectedSuggestion === suggestion.id}
                  onSelect={() => assistant.selectSuggestion(suggestion.id)}
                  onApply={() => void assistant.applySuggestion(suggestion.id)}
                  onDismiss={() => void assistant.dismissSuggestion(suggestion.id)}
                />
              ))}
            </AnimatePresence>
          </div>

          {/* Manual Analysis Button */}
          <div className='mt-6 text-center'>
            <Button
              variant='outline'
              onClick={() => void assistant.analyzeContent(content, chapterId ?? '')}
              disabled={assistant.isAnalyzing}
            >
              <BarChart3 className='mr-2 h-4 w-4' />
              Analyze Content
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

export default WritingAssistantPanel;
