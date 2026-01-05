/**
 * Plot Hole Detector View Component
 *
 * Display and manage detected plot holes and inconsistencies
 */

import React, { useState, useMemo } from 'react';

import type {
  PlotHoleAnalysis,
  PlotHole,
  PlotHoleSeverity,
  PlotHoleType,
} from '@/features/plot-engine';
import { cn } from '@/lib/utils';
import { Badge } from '@/shared/components/ui/Badge';
import { Button } from '@/shared/components/ui/Button';
import { Card } from '@/shared/components/ui/Card';

interface PlotHoleDetectorViewProps {
  analysis: PlotHoleAnalysis;
  onDismissHole?: (holeId: string) => void;
  onFixHole?: (holeId: string) => void;
}

export const PlotHoleDetectorView: React.FC<PlotHoleDetectorViewProps> = ({
  analysis,
  onDismissHole,
  onFixHole,
}) => {
  const [filterSeverity, setFilterSeverity] = useState<PlotHoleSeverity | 'all'>('all');
  const [filterType, setFilterType] = useState<PlotHoleType | 'all'>('all');
  const [sortBy, setSortBy] = useState<'severity' | 'confidence' | 'type'>('severity');

  // Filter and sort plot holes
  const filteredHoles = useMemo(() => {
    let holes = [...analysis.plotHoles];

    // Apply severity filter
    if (filterSeverity !== 'all') {
      holes = holes.filter(h => h.severity === filterSeverity);
    }

    // Apply type filter
    if (filterType !== 'all') {
      holes = holes.filter(h => h.type === filterType);
    }

    // Sort
    holes.sort((a, b) => {
      switch (sortBy) {
        case 'severity': {
          const severityOrder = { critical: 4, major: 3, moderate: 2, minor: 1 };
          return severityOrder[b.severity] - severityOrder[a.severity];
        }
        case 'confidence':
          return b.confidence - a.confidence;
        case 'type':
          return a.type.localeCompare(b.type);
        default:
          return 0;
      }
    });

    return holes;
  }, [analysis.plotHoles, filterSeverity, filterType, sortBy]);

  // Statistics
  const stats = useMemo(() => {
    const bySeverity = {
      critical: analysis.plotHoles.filter(h => h.severity === 'critical').length,
      major: analysis.plotHoles.filter(h => h.severity === 'major').length,
      moderate: analysis.plotHoles.filter(h => h.severity === 'moderate').length,
      minor: analysis.plotHoles.filter(h => h.severity === 'minor').length,
    };

    const byType = analysis.plotHoles.reduce(
      (acc, hole) => {
        acc[hole.type] = (acc[hole.type] || 0) + 1;
        return acc;
      },
      {} as Record<PlotHoleType, number>,
    );

    return { bySeverity, byType };
  }, [analysis.plotHoles]);

  const getScoreColor = (score: number): string => {
    if (score >= 90) return 'text-green-600 dark:text-green-400';
    if (score >= 75) return 'text-blue-600 dark:text-blue-400';
    if (score >= 60) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  return (
    <div className='space-y-6'>
      {/* Overview Card */}
      <Card className='p-6'>
        <h3 className='mb-4 text-lg font-semibold'>Plot Quality Analysis</h3>

        <div className='mb-6 flex items-center justify-between'>
          <div>
            <p className='text-sm text-muted-foreground'>Overall Score</p>
            <p className={cn('mt-1 text-4xl font-bold', getScoreColor(analysis.overallScore))}>
              {analysis.overallScore}/100
            </p>
          </div>
          <div className='text-right'>
            <p className='text-sm text-muted-foreground'>Issues Found</p>
            <p className='mt-1 text-4xl font-bold'>{analysis.plotHoles.length}</p>
          </div>
        </div>

        <p className='text-sm text-muted-foreground'>{analysis.summary}</p>

        {/* Severity Breakdown */}
        <div className='mt-6 grid grid-cols-4 gap-3'>
          <SeverityStat severity='critical' count={stats.bySeverity.critical} />
          <SeverityStat severity='major' count={stats.bySeverity.major} />
          <SeverityStat severity='moderate' count={stats.bySeverity.moderate} />
          <SeverityStat severity='minor' count={stats.bySeverity.minor} />
        </div>
      </Card>

      {/* Filters */}
      <Card className='p-6'>
        <div className='flex flex-wrap items-center gap-4'>
          <div className='flex items-center gap-2'>
            <span className='text-sm font-medium'>Filter by Severity:</span>
            <select
              value={filterSeverity}
              onChange={e => setFilterSeverity(e.target.value as PlotHoleSeverity | 'all')}
              className='rounded-md border bg-background px-3 py-1 text-sm'
              data-testid='severity-filter'
            >
              <option value='all'>All</option>
              <option value='critical'>Critical</option>
              <option value='major'>Major</option>
              <option value='moderate'>Moderate</option>
              <option value='minor'>Minor</option>
            </select>
          </div>

          <div className='flex items-center gap-2'>
            <span className='text-sm font-medium'>Filter by Type:</span>
            <select
              value={filterType}
              onChange={e => setFilterType(e.target.value as PlotHoleType | 'all')}
              className='rounded-md border bg-background px-3 py-1 text-sm'
              data-testid='type-filter'
            >
              <option value='all'>All</option>
              <option value='continuity'>Continuity</option>
              <option value='logic'>Logic</option>
              <option value='character_inconsistency'>Character</option>
              <option value='timeline'>Timeline</option>
              <option value='unresolved_thread'>Unresolved</option>
              <option value='contradictory_facts'>Contradictions</option>
              <option value='missing_motivation'>Motivation</option>
            </select>
          </div>

          <div className='flex items-center gap-2'>
            <span className='text-sm font-medium'>Sort by:</span>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as 'severity' | 'confidence' | 'type')}
              className='rounded-md border bg-background px-3 py-1 text-sm'
              data-testid='sort-select'
            >
              <option value='severity'>Severity</option>
              <option value='confidence'>Confidence</option>
              <option value='type'>Type</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Plot Holes List */}
      <Card className='p-6'>
        <h3 className='mb-4 text-lg font-semibold'>Issues ({filteredHoles.length})</h3>

        {filteredHoles.length > 0 ? (
          <div className='space-y-4'>
            {filteredHoles.map(hole => (
              <PlotHoleCard
                key={hole.id}
                plotHole={hole}
                onDismiss={onDismissHole}
                onFix={onFixHole}
              />
            ))}
          </div>
        ) : (
          <div className='py-8 text-center'>
            <p className='text-muted-foreground'>
              {analysis.plotHoles.length > 0
                ? 'No issues match your filters'
                : 'No plot holes detected! Your story is coherent.'}
            </p>
          </div>
        )}
      </Card>
    </div>
  );
};

// Severity Stat Component
interface SeverityStatProps {
  severity: PlotHoleSeverity;
  count: number;
}

const SeverityStat: React.FC<SeverityStatProps> = ({ severity, count }) => {
  const colors = {
    critical:
      'bg-red-50 border-red-200 text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400',
    major:
      'bg-orange-50 border-orange-200 text-orange-700 dark:bg-orange-900/20 dark:border-orange-800 dark:text-orange-400',
    moderate:
      'bg-yellow-50 border-yellow-200 text-yellow-700 dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-yellow-400',
    minor:
      'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-400',
  };

  return (
    <div className={cn('rounded-lg border p-3 text-center', colors[severity])}>
      <p className='text-2xl font-bold'>{count}</p>
      <p className='mt-1 text-xs font-medium capitalize'>{severity}</p>
    </div>
  );
};

// Plot Hole Card Component
interface PlotHoleCardProps {
  plotHole: PlotHole;
  onDismiss?: (holeId: string) => void;
  onFix?: (holeId: string) => void;
}

const PlotHoleCard: React.FC<PlotHoleCardProps> = ({ plotHole, onDismiss, onFix }) => {
  const [expanded, setExpanded] = useState(false);

  const severityColors = {
    critical: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    major: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
    moderate: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
    minor: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  };

  const typeColors = {
    continuity: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
    logic: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    character_inconsistency: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    timeline: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    unresolved_thread: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
    contradictory_facts: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    missing_motivation: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  };

  return (
    <div className='space-y-3 rounded-lg border p-4' data-testid='plot-hole-card'>
      <div className='flex items-start justify-between gap-3'>
        <div className='flex-1'>
          <h4 className='font-medium'>{plotHole.title}</h4>
          <p className='mt-1 text-sm text-muted-foreground'>{plotHole.description}</p>
        </div>
        <div className='flex flex-col gap-2'>
          <Badge className={severityColors[plotHole.severity]}>{plotHole.severity}</Badge>
          <Badge className={typeColors[plotHole.type]}>{plotHole.type.replace('_', ' ')}</Badge>
        </div>
      </div>

      {/* Metadata */}
      <div className='flex items-center gap-4 text-xs text-muted-foreground'>
        <span>Confidence: {Math.round(plotHole.confidence * 100)}%</span>
        {plotHole.affectedChapters.length > 0 && (
          <span>Affects {plotHole.affectedChapters.length} chapter(s)</span>
        )}
        {plotHole.affectedCharacters.length > 0 && (
          <span>Involves {plotHole.affectedCharacters.length} character(s)</span>
        )}
      </div>

      {/* Suggested Fix */}
      {plotHole.suggestedFix && (
        <div className='rounded-lg bg-muted/50 p-3'>
          <p className='mb-1 text-sm font-medium text-muted-foreground'>Suggested Fix:</p>
          <p className='text-sm'>{plotHole.suggestedFix}</p>
        </div>
      )}

      {/* Actions */}
      <div className='flex items-center gap-2 pt-2'>
        <Button size='sm' variant='outline' onClick={() => setExpanded(!expanded)}>
          {expanded ? 'Hide Details' : 'Show Details'}
        </Button>
        {onFix && (
          <Button size='sm' onClick={() => onFix(plotHole.id)}>
            Mark as Fixed
          </Button>
        )}
        {onDismiss && (
          <Button size='sm' variant='ghost' onClick={() => onDismiss(plotHole.id)}>
            Dismiss
          </Button>
        )}
      </div>

      {/* Expanded Details */}
      {expanded && (
        <div className='space-y-2 border-t pt-3'>
          <div>
            <p className='text-sm font-medium'>Detected:</p>
            <p className='text-sm text-muted-foreground'>
              {new Date(plotHole.detected).toLocaleString()}
            </p>
          </div>
          {plotHole.affectedChapters.length > 0 && (
            <div>
              <p className='text-sm font-medium'>Affected Chapters:</p>
              <p className='text-sm text-muted-foreground'>
                {plotHole.affectedChapters.join(', ')}
              </p>
            </div>
          )}
          {plotHole.affectedCharacters.length > 0 && (
            <div>
              <p className='text-sm font-medium'>Affected Characters:</p>
              <p className='text-sm text-muted-foreground'>
                {plotHole.affectedCharacters.join(', ')}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
