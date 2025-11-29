/**
 * Writing Assistant Panel Component
 * Main UI for displaying writing suggestions and analysis
 */

import React, { useState } from 'react';
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
  EyeOff
} from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { cn } from '../../../lib/utils';
import type { WritingSuggestion, WritingSuggestionCategory } from '../types';
import useWritingAssistant from '../hooks/useWritingAssistant';

interface WritingAssistantPanelProps {
  content: string;
  chapterId?: string;
  projectId?: string;
  className?: string;
  characterContext?: any[];
  plotContext?: string;
}

const SuggestionIcon: React.FC<{ suggestion: WritingSuggestion }> = ({ suggestion }) => {
  const iconProps = { className: 'w-4 h-4' };
  
  switch (suggestion.severity) {
    case 'error':
      return <AlertTriangle {...iconProps} className="w-4 h-4 text-red-500" />;
    case 'warning':
      return <AlertTriangle {...iconProps} className="w-4 h-4 text-yellow-500" />;
    case 'suggestion':
      return <Lightbulb {...iconProps} className="w-4 h-4 text-blue-500" />;
    default:
      return <Info {...iconProps} className="w-4 h-4 text-gray-500" />;
  }
};

const SeverityBadge: React.FC<{ severity: WritingSuggestion['severity'] }> = ({ severity }) => {
  const styles = {
    error: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800',
    warning: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800',
    suggestion: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
    info: 'bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-800'
  };

  return (
    <span className={cn(
      'px-2 py-1 text-xs font-medium rounded-full border',
      styles[severity]
    )}>
      {severity.charAt(0).toUpperCase() + severity.slice(1)}
    </span>
  );
};

const SuggestionCard: React.FC<{
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
        'border rounded-lg p-4 cursor-pointer transition-all hover:shadow-md',
        isSelected ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-gray-700'
      )}
      onClick={onSelect}
    >
      <div className="flex items-start gap-3">
        <SuggestionIcon suggestion={suggestion} />
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <SeverityBadge severity={suggestion.severity} />
            <span className="text-xs text-gray-500 capitalize">
              {suggestion.category.replace('_', ' ')}
            </span>
            <span className="text-xs text-gray-400 ml-auto">
              {Math.round(suggestion.confidence * 100)}% confidence
            </span>
          </div>
          
          <p className="text-sm text-gray-900 dark:text-gray-100 mb-2">
            {suggestion.message}
          </p>
          
          {suggestion.originalText && (
            <div className="bg-gray-100 dark:bg-gray-800 rounded p-2 mb-2">
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Original:</p>
              <p className="text-sm font-mono text-gray-800 dark:text-gray-200">
                "{suggestion.originalText}"
              </p>
            </div>
          )}
          
          {suggestion.suggestedText && (
            <div className="bg-green-50 dark:bg-green-900/30 rounded p-2 mb-2">
              <p className="text-xs text-green-600 dark:text-green-400 mb-1">Suggested:</p>
              <p className="text-sm font-mono text-green-800 dark:text-green-200">
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
                className="border-t pt-2 mt-2"
              >
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Reasoning:</p>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  {suggestion.reasoning}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
          
          <div className="flex items-center justify-between mt-3">
            <div className="flex gap-2">
              {suggestion.suggestedText && (
                <Button
                  size="sm"
                  variant="default"
                  onClick={(e) => {
                    e.stopPropagation();
                    onApply();
                  }}
                >
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Apply
                </Button>
              )}
              <Button
                size="sm"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  onDismiss();
                }}
              >
                <X className="w-3 h-3 mr-1" />
                Dismiss
              </Button>
            </div>
            
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                setShowDetails(!showDetails);
              }}
            >
              {showDetails ? (
                <ChevronUp className="w-3 h-3" />
              ) : (
                <ChevronDown className="w-3 h-3" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const AnalysisStats: React.FC<{
  stats: {
    totalSuggestions: number;
    highPrioritySuggestions: number;
    avgConfidence: number;
    topCategories: Array<{ category: WritingSuggestionCategory; count: number }>;
  };
  readabilityScore?: number;
  engagementScore?: number;
}> = ({ stats, readabilityScore, engagementScore }) => {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <Card className="p-3 text-center">
        <div className="text-2xl font-bold text-blue-600">{stats.totalSuggestions}</div>
        <div className="text-xs text-gray-600">Total Suggestions</div>
      </Card>
      
      <Card className="p-3 text-center">
        <div className="text-2xl font-bold text-orange-600">{stats.highPrioritySuggestions}</div>
        <div className="text-xs text-gray-600">High Priority</div>
      </Card>
      
      {readabilityScore !== undefined && (
        <Card className="p-3 text-center">
          <div className="text-2xl font-bold text-green-600">{Math.round(readabilityScore)}</div>
          <div className="text-xs text-gray-600">Readability Score</div>
        </Card>
      )}
      
      {engagementScore !== undefined && (
        <Card className="p-3 text-center">
          <div className="text-2xl font-bold text-purple-600">{Math.round(engagementScore)}</div>
          <div className="text-xs text-gray-600">Engagement Score</div>
        </Card>
      )}
    </div>
  );
};

export const WritingAssistantPanel: React.FC<WritingAssistantPanelProps> = ({
  content,
  chapterId,
  projectId,
  className,
  characterContext,
  plotContext
}) => {
  const assistant = useWritingAssistant(content, {
    chapterId,
    projectId,
    characterContext,
    plotContext,
    enablePersistence: true // Enable hybrid storage approach
  });

  const [showFilters, setShowFilters] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const categoryOptions: Array<{ value: WritingSuggestionCategory | 'all'; label: string }> = [
    { value: 'all', label: 'All Categories' },
    { value: 'readability', label: 'Readability' },
    { value: 'engagement', label: 'Engagement' },
    { value: 'consistency', label: 'Consistency' },
    { value: 'flow', label: 'Flow' },
    { value: 'dialogue', label: 'Dialogue' },
    { value: 'character_voice', label: 'Character Voice' },
    { value: 'description', label: 'Description' },
    { value: 'plot_structure', label: 'Plot Structure' },
    { value: 'show_vs_tell', label: 'Show vs Tell' }
  ];

  const sortOptions: Array<{ value: typeof assistant.sortBy; label: string }> = [
    { value: 'severity', label: 'By Severity' },
    { value: 'type', label: 'By Type' },
    { value: 'position', label: 'By Position' },
    { value: 'confidence', label: 'By Confidence' }
  ];

  return (
    <div className={cn('writing-assistant-panel', className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold">Writing Assistant</h3>
          <Button
            size="sm"
            variant={assistant.isActive ? "default" : "outline"}
            onClick={assistant.toggleAssistant}
          >
            {assistant.isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          </Button>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowSettings(!showSettings)}
          >
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {!assistant.isActive && (
        <Card className="p-4 text-center">
          <Brain className="w-12 h-12 mx-auto text-gray-400 mb-2" />
          <p className="text-gray-600 mb-3">
            Activate the Writing Assistant to get intelligent suggestions and analysis
          </p>
          <Button onClick={assistant.toggleAssistant}>
            Activate Assistant
          </Button>
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
                className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 mb-4"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Filter by Category
                    </label>
                    <select
                      value={assistant.filterBy}
                      onChange={(e) => assistant.filterSuggestions(e.target.value as WritingSuggestionCategory | 'all')}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
                    >
                      {categoryOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Sort by
                    </label>
                    <select
                      value={assistant.sortBy}
                      onChange={(e) => assistant.sortSuggestions(e.target.value as typeof assistant.sortBy)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
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
          {assistant.isAnalyzing && (
            <Card className="p-4 mb-4">
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span className="text-sm text-gray-600">Analyzing content...</span>
              </div>
            </Card>
          )}

          {assistant.analysisError && (
            <Card className="p-4 mb-4 border-red-200 bg-red-50 dark:bg-red-900/20">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                <span className="text-sm text-red-700 dark:text-red-300">
                  Analysis failed: {assistant.analysisError}
                </span>
              </div>
            </Card>
          )}

          {/* Suggestions List */}
          <div className="space-y-3">
            {assistant.filteredSuggestions.length === 0 && !assistant.isAnalyzing && (
              <Card className="p-6 text-center">
                <CheckCircle className="w-12 h-12 mx-auto text-green-500 mb-2" />
                <p className="text-gray-600">
                  {content ? 'No suggestions found. Your writing looks great!' : 'Start writing to get suggestions.'}
                </p>
              </Card>
            )}

            <AnimatePresence>
              {assistant.filteredSuggestions.map((suggestion) => (
                <SuggestionCard
                  key={suggestion.id}
                  suggestion={suggestion}
                  isSelected={assistant.selectedSuggestion === suggestion.id}
                  onSelect={() => assistant.selectSuggestion(suggestion.id)}
                  onApply={() => assistant.applySuggestion(suggestion.id)}
                  onDismiss={() => assistant.dismissSuggestion(suggestion.id)}
                />
              ))}
            </AnimatePresence>
          </div>

          {/* Manual Analysis Button */}
          <div className="mt-6 text-center">
            <Button
              variant="outline"
              onClick={() => assistant.analyzeContent(content, chapterId || '')}
              disabled={assistant.isAnalyzing}
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              Analyze Content
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

export default WritingAssistantPanel;