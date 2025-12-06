import { motion, AnimatePresence } from 'framer-motion';
import {
  GitCompare,
  ArrowLeft,
  ArrowRight,
  Plus,
  Minus,
  Edit3,
  FileText,
  Calendar,
  User,
  BarChart3,
  Download,
  X,
} from 'lucide-react';
import React, { useState, useEffect } from 'react';

import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { cn, iconButtonTarget } from '../../../lib/utils';
import { useVersioning } from '../hooks/useVersioning';
import type { ChapterVersion, VersionCompareResult } from '../types';

interface VersionComparisonProps {
  version1: ChapterVersion;
  version2: ChapterVersion;
  onClose: () => void;
  className?: string;
}

const VersionComparison: React.FC<VersionComparisonProps> = ({
  version1,
  version2,
  onClose,
  className,
}) => {
  const { compareVersions } = useVersioning();
  const [comparison, setComparison] = useState<VersionCompareResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'unified' | 'side-by-side'>('unified');
  const [showStats, setShowStats] = useState(true);

  useEffect(() => {
    const loadComparison = async (): Promise<void> => {
      setIsLoading(true);
      try {
        const result = await compareVersions(version1.id, version2.id);
        setComparison(result);
      } catch (error) {
        console.error('Failed to compare versions:', error);
      } finally {
        setIsLoading(false);
      }
    };

    void loadComparison();
  }, [version1.id, version2.id, compareVersions]);

  const formatTimestamp = (timestamp: Date): string => {
    return new Date(timestamp).toLocaleString();
  };

  const exportComparison = (): void => {
    if (!comparison) return;

    const exportData = {
      comparison: {
        version1: {
          id: version1.id,
          timestamp: version1.timestamp,
          message: version1.message,
          wordCount: version1.wordCount,
        },
        version2: {
          id: version2.id,
          timestamp: version2.timestamp,
          message: version2.message,
          wordCount: version2.wordCount,
        },
        summary: {
          wordCountChange: comparison.wordCountChange,
          charCountChange: comparison.charCountChange,
          additionsCount: comparison.additionsCount,
          deletionsCount: comparison.deletionsCount,
          modificationsCount: comparison.modificationsCount,
        },
        diffs: comparison.diffs,
      },
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `version_comparison_${version1.id}_${version2.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const renderUnifiedDiff = (): React.ReactElement | null => {
    if (!comparison) return null;

    return (
      <div className='space-y-2'>
        {comparison.diffs.map((diff, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className={cn(
              'rounded-lg border-l-4 p-3 font-mono text-sm',
              diff.type === 'addition' && 'border-green-400 bg-green-50 dark:bg-green-950/20',
              diff.type === 'deletion' && 'border-red-400 bg-red-50 dark:bg-red-950/20',
              diff.type === 'modification' &&
                'border-yellow-400 bg-yellow-50 dark:bg-yellow-950/20',
            )}
          >
            <div className='mb-2 flex items-center gap-2 text-xs'>
              {diff.type === 'addition' && <Plus className='h-4 w-4 text-green-600' />}
              {diff.type === 'deletion' && <Minus className='h-4 w-4 text-red-600' />}
              {diff.type === 'modification' && <Edit3 className='h-4 w-4 text-yellow-600' />}
              <span className='font-medium capitalize'>{diff.type}</span>
              <span className='text-muted-foreground'>Line {diff.lineNumber}</span>
            </div>

            {diff.type === 'deletion' && (diff.oldContent?.length ?? 0) > 0 && (
              <div className='text-red-700 dark:text-red-300'>- {diff.oldContent}</div>
            )}

            {diff.type === 'addition' && (diff.newContent?.length ?? 0) > 0 && (
              <div className='text-green-700 dark:text-green-300'>+ {diff.newContent}</div>
            )}

            {diff.type === 'modification' && (
              <div className='space-y-1'>
                {(diff.oldContent?.length ?? 0) > 0 && (
                  <div className='text-red-700 dark:text-red-300'>- {diff.oldContent}</div>
                )}
                {(diff.newContent?.length ?? 0) > 0 && (
                  <div className='text-green-700 dark:text-green-300'>+ {diff.newContent}</div>
                )}
              </div>
            )}
          </motion.div>
        ))}
      </div>
    );
  };

  const renderSideBySide = (): React.JSX.Element => {
    const lines1 = version1.content.split('\n');
    const lines2 = version2.content.split('\n');
    return (
      <div className='grid grid-cols-2 gap-4'>
        <div>
          <h4 className='mb-2 text-sm font-medium text-muted-foreground'>
            Version 1 - {formatTimestamp(version1.timestamp)}
          </h4>
          <div className='max-h-96 overflow-y-auto rounded-lg bg-secondary/20 p-4 font-mono text-sm'>
            {lines1.map((line, index) => (
              <div key={index} className='py-1'>
                <span className='mr-4 text-xs text-muted-foreground'>
                  {(index + 1).toString().padStart(3, '0')}
                </span>
                {line}
              </div>
            ))}
          </div>
        </div>

        <div>
          <h4 className='mb-2 text-sm font-medium text-muted-foreground'>
            Version 2 - {formatTimestamp(version2.timestamp)}
          </h4>
          <div className='max-h-96 overflow-y-auto rounded-lg bg-secondary/20 p-4 font-mono text-sm'>
            {lines2.map((line, index) => (
              <div key={index} className='py-1'>
                <span className='mr-4 text-xs text-muted-foreground'>
                  {(index + 1).toString().padStart(3, '0')}
                </span>
                {line}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className='flex items-center justify-center p-8'>
        <div className='flex items-center gap-2 text-muted-foreground'>
          <GitCompare className='h-4 w-4 animate-pulse' />
          Comparing versions...
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className={cn(
        'flex h-full flex-col overflow-hidden rounded-lg border border-border/40 bg-card/50 backdrop-blur-sm',
        className,
      )}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className='flex items-center justify-between border-b border-border/40 bg-card/80 p-4'>
        <div className='flex items-center gap-3'>
          <GitCompare className='h-5 w-5 text-primary' />
          <div>
            <h3 className='font-serif text-lg font-semibold'>Version Comparison</h3>
            <p className='text-sm text-muted-foreground'>Comparing changes between two versions</p>
          </div>
        </div>

        <div className='flex items-center gap-2'>
          <Button
            variant='outline'
            size='sm'
            onClick={() => setShowStats(!showStats)}
            className='text-xs'
          >
            <BarChart3 className='mr-1 h-3 w-3' />
            {showStats ? 'Hide' : 'Show'} Stats
          </Button>

          <div className='flex overflow-hidden rounded border border-border'>
            <button
              onClick={() => setViewMode('unified')}
              className={cn(
                'px-3 py-1 text-xs transition-colors',
                viewMode === 'unified'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary/50 text-muted-foreground hover:text-foreground',
              )}
            >
              Unified
            </button>
            <button
              onClick={() => setViewMode('side-by-side')}
              className={cn(
                'px-3 py-1 text-xs transition-colors',
                viewMode === 'side-by-side'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary/50 text-muted-foreground hover:text-foreground',
              )}
            >
              Side by Side
            </button>
          </div>

          <Button variant='outline' size='sm' onClick={exportComparison} className='text-xs'>
            <Download className='mr-1 h-3 w-3' />
            Export
          </Button>

          <button
            onClick={onClose}
            className={iconButtonTarget('rounded-md text-xs')}
            aria-label='Close comparison'
          >
            <X className='h-4 w-4' />
          </button>
        </div>
      </div>

      {/* Version Info Cards */}
      <div className='flex gap-4 border-b border-border/40 bg-secondary/10 p-4'>
        <Card className='flex-1 p-3'>
          <div className='mb-2 flex items-center gap-2'>
            <ArrowLeft className='h-4 w-4 text-red-500' />
            <span className='text-sm font-medium'>Version 1 (Older)</span>
          </div>
          <div className='space-y-1 text-xs text-muted-foreground'>
            <div className='flex items-center gap-2'>
              <Calendar className='h-3 w-3' />
              {formatTimestamp(version1.timestamp)}
            </div>
            <div className='flex items-center gap-2'>
              <User className='h-3 w-3' />
              {version1.authorName}
            </div>
            <div className='flex items-center gap-2'>
              <FileText className='h-3 w-3' />
              {version1.wordCount} words
            </div>
          </div>
          <p className='mt-2 text-xs font-medium'>{version1.message}</p>
        </Card>

        <Card className='flex-1 p-3'>
          <div className='mb-2 flex items-center gap-2'>
            <ArrowRight className='h-4 w-4 text-green-500' />
            <span className='text-sm font-medium'>Version 2 (Newer)</span>
          </div>
          <div className='space-y-1 text-xs text-muted-foreground'>
            <div className='flex items-center gap-2'>
              <Calendar className='h-3 w-3' />
              {formatTimestamp(version2.timestamp)}
            </div>
            <div className='flex items-center gap-2'>
              <User className='h-3 w-3' />
              {version2.authorName}
            </div>
            <div className='flex items-center gap-2'>
              <FileText className='h-3 w-3' />
              {version2.wordCount} words
            </div>
          </div>
          <p className='mt-2 text-xs font-medium'>{version2.message}</p>
        </Card>
      </div>

      {/* Statistics Panel */}
      <AnimatePresence>
        {showStats && comparison && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className='border-b border-border/40 bg-secondary/5 p-4'
          >
            <h4 className='mb-3 text-sm font-medium'>Change Summary</h4>
            <div className='grid grid-cols-5 gap-4'>
              <div className='text-center'>
                <div className='text-2xl font-bold text-green-600'>
                  +{comparison.additionsCount}
                </div>
                <div className='text-xs text-muted-foreground'>Additions</div>
              </div>
              <div className='text-center'>
                <div className='text-2xl font-bold text-red-600'>-{comparison.deletionsCount}</div>
                <div className='text-xs text-muted-foreground'>Deletions</div>
              </div>
              <div className='text-center'>
                <div className='text-2xl font-bold text-yellow-600'>
                  {comparison.modificationsCount}
                </div>
                <div className='text-xs text-muted-foreground'>Modifications</div>
              </div>
              <div className='text-center'>
                <div
                  className={cn(
                    'text-2xl font-bold',
                    comparison.wordCountChange >= 0 ? 'text-green-600' : 'text-red-600',
                  )}
                >
                  {comparison.wordCountChange >= 0 ? '+' : ''}
                  {comparison.wordCountChange}
                </div>
                <div className='text-xs text-muted-foreground'>Words</div>
              </div>
              <div className='text-center'>
                <div
                  className={cn(
                    'text-2xl font-bold',
                    comparison.charCountChange >= 0 ? 'text-green-600' : 'text-red-600',
                  )}
                >
                  {comparison.charCountChange >= 0 ? '+' : ''}
                  {comparison.charCountChange}
                </div>
                <div className='text-xs text-muted-foreground'>Characters</div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Comparison Content */}
      <div className='flex-1 overflow-hidden'>
        <div className='h-full overflow-y-auto p-4'>
          {comparison?.diffs.length === 0 ? (
            <div className='flex h-full flex-col items-center justify-center text-center'>
              <FileText className='mb-4 h-12 w-12 text-muted-foreground/50' />
              <p className='text-muted-foreground'>No differences found between these versions.</p>
            </div>
          ) : (
            <div>{viewMode === 'unified' ? renderUnifiedDiff() : renderSideBySide()}</div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default VersionComparison;
