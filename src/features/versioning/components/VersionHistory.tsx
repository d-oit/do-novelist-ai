
import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock,
  User,
  MessageSquare,
  GitBranch,
  RotateCcw,
  Trash2,
  Download,
  Search,
  Filter,
  Eye,
  ChevronDown,
  FileText,
  Zap,
  Bot,
  Save
} from 'lucide-react';
import { useVersioning } from '../hooks/useVersioning';
import { ChapterVersion, VersionFilter, SortOrder } from '../types';
import { Chapter } from '../../../types';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { cn } from '../../../lib/utils';

interface VersionHistoryProps {
  chapter: Chapter;
  onRestoreVersion: (chapter: Chapter) => void;
  onClose: () => void;
  className?: string;
}

const typeIcons = {
  manual: Save,
  auto: Clock,
  'ai-generated': Bot,
  restore: RotateCcw,
};

const typeColors = {
  manual: 'text-blue-500',
  auto: 'text-gray-500',
  'ai-generated': 'text-purple-500',
  restore: 'text-green-500',
};

const filterOptions: { value: VersionFilter; label: string }[] = [
  { value: 'all', label: 'All Versions' },
  { value: 'manual', label: 'Manual Saves' },
  { value: 'auto', label: 'Auto Saves' },
  { value: 'ai-generated', label: 'AI Generated' },
  { value: 'restore', label: 'Restorations' },
];

const sortOptions: { value: SortOrder; label: string }[] = [
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'author', label: 'By Author' },
  { value: 'wordCount', label: 'By Word Count' },
];

const VersionHistory: React.FC<VersionHistoryProps> = ({
  chapter,
  onRestoreVersion,
  onClose,
  className
}) => {
  const {
    versions,
    isLoading,
    error,
    restoreVersion,
    deleteVersion,
    exportVersionHistory,
    getFilteredVersions,
    searchVersions,
  } = useVersioning(chapter.id);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<VersionFilter>('all');
  const [selectedSort, setSelectedSort] = useState<SortOrder>('newest');
  const [selectedVersion, setSelectedVersion] = useState<ChapterVersion | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const filteredVersions = useMemo(() => {
    let result = searchQuery
      ? searchVersions(searchQuery)
      : getFilteredVersions(selectedFilter, selectedSort);

    return result;
  }, [versions, searchQuery, selectedFilter, selectedSort, searchVersions, getFilteredVersions]);

  const handleRestoreVersion = async (version: ChapterVersion) => {
    try {
      const restoredChapter = await restoreVersion(version.id);
      if (restoredChapter) {
        onRestoreVersion(restoredChapter);
        onClose();
      }
    } catch (error) {
      console.error('Failed to restore version:', error);
    }
  };

  const handleDeleteVersion = async (versionId: string) => {
    if (window.confirm('Are you sure you want to delete this version? This action cannot be undone.')) {
      await deleteVersion(versionId);
    }
  };

  const handleExportHistory = async (format: 'json' | 'csv') => {
    try {
      const data = await exportVersionHistory(chapter.id, format);
      const blob = new Blob([data], {
        type: format === 'json' ? 'application/json' : 'text/csv'
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${chapter.title}_version_history.${format}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export version history:', error);
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 60) {
      return `${diffInMinutes} minutes ago`;
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)} hours ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Clock className="w-4 h-4 animate-spin" />
          Loading version history...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center">
        <p className="text-destructive">{error}</p>
      </div>
    );
  }

  return (
    <motion.div
      className={cn(
        "flex flex-col h-full bg-card/50 backdrop-blur-sm border border-border/40 rounded-lg overflow-hidden",
        className
      )}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border/40 bg-card/80">
        <div className="flex items-center gap-2">
          <GitBranch className="w-5 h-5 text-primary" />
          <h3 className="font-serif font-semibold text-lg">Version History</h3>
          <span className="text-sm text-muted-foreground">
            ({filteredVersions.length} versions)
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExportHistory('json')}
            className="text-xs"
          >
            <Download className="w-3 h-3 mr-1" />
            Export
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="text-xs"
          >
            Close
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="p-4 border-b border-border/40 bg-secondary/20 space-y-3">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search versions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className={cn("text-xs", showFilters && "bg-primary/10")}
          >
            <Filter className="w-3 h-3 mr-1" />
            Filters
            <ChevronDown className={cn("w-3 h-3 ml-1 transition-transform", showFilters && "rotate-180")} />
          </Button>
        </div>

        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex gap-4 overflow-hidden"
            >
              <div className="flex-1">
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Filter by Type
                </label>
                <select
                  value={selectedFilter}
                  onChange={(e) => setSelectedFilter(e.target.value as VersionFilter)}
                  className="w-full text-xs bg-background border border-border rounded px-2 py-1"
                >
                  {filterOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex-1">
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Sort by
                </label>
                <select
                  value={selectedSort}
                  onChange={(e) => setSelectedSort(e.target.value as SortOrder)}
                  className="w-full text-xs bg-background border border-border rounded px-2 py-1"
                >
                  {sortOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Version List */}
      <div className="flex-1 overflow-y-auto">
        {filteredVersions.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <FileText className="w-12 h-12 text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">
              {searchQuery ? 'No versions match your search.' : 'No versions found.'}
            </p>
          </div>
        ) : (
          <div className="p-4 space-y-3">
            {filteredVersions.map((version, index) => {
              const IconComponent = typeIcons[version.type];
              const isSelected = selectedVersion?.id === version.id;

              return (
                <motion.div
                  key={version.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05, duration: 0.3 }}
                >
                  <Card
                    className={cn(
                      "p-4 cursor-pointer transition-all hover:shadow-md group relative",
                      isSelected && "ring-2 ring-primary/50 bg-primary/5"
                    )}
                    onClick={() => setSelectedVersion(isSelected ? null : version)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <div className={cn("p-2 rounded-lg bg-secondary/50", typeColors[version.type])}>
                          <IconComponent className="w-4 h-4" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium text-sm truncate">
                              {version.message}
                            </h4>
                            <span className="text-xs text-muted-foreground capitalize bg-secondary/50 px-2 py-1 rounded">
                              {version.type}
                            </span>
                          </div>

                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <User className="w-3 h-3" />
                              {version.authorName}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatTimestamp(version.timestamp)}
                            </span>
                            <span className="flex items-center gap-1">
                              <FileText className="w-3 h-3" />
                              {version.wordCount} words
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedVersion(version);
                          }}
                          className="h-8 w-8 p-0"
                        >
                          <Eye className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRestoreVersion(version);
                          }}
                          className="h-8 w-8 p-0 text-green-600 hover:text-green-700"
                        >
                          <RotateCcw className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteVersion(version.id);
                          }}
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>

                    {/* Expanded Content Preview */}
                    <AnimatePresence>
                      {isSelected && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-4 pt-4 border-t border-border/40"
                        >
                          <div className="space-y-3">
                            <div>
                              <h5 className="text-xs font-medium text-muted-foreground mb-1">Content Preview</h5>
                              <div className="text-xs bg-secondary/30 p-3 rounded max-h-32 overflow-y-auto">
                                {version.content.slice(0, 200)}
                                {version.content.length > 200 && '...'}
                              </div>
                            </div>

                            <div className="flex items-center justify-between">
                              <div className="grid grid-cols-3 gap-4 text-xs">
                                <div>
                                  <span className="text-muted-foreground">Characters: </span>
                                  <span className="font-mono">{version.charCount.toLocaleString()}</span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Words: </span>
                                  <span className="font-mono">{version.wordCount.toLocaleString()}</span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Hash: </span>
                                  <span className="font-mono">{version.contentHash.slice(0, 8)}...</span>
                                </div>
                              </div>

                              <Button
                                onClick={() => handleRestoreVersion(version)}
                                size="sm"
                                className="text-xs"
                              >
                                <RotateCcw className="w-3 h-3 mr-1" />
                                Restore This Version
                              </Button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default VersionHistory;