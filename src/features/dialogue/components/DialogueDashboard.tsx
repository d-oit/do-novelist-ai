/**
 * Dialogue Dashboard Component
 *
 * Main view for dialogue analysis and management
 */

import { MessageSquare, Users, TrendingUp, AlertCircle } from 'lucide-react';
import React from 'react';

import { useDialogue } from '@/features/dialogue/hooks';
import { Card } from '@/shared/components/ui/Card';
import { Skeleton } from '@/shared/components/ui/Skeleton';

interface DialogueDashboardProps {
  projectId: string;
  chapterId?: string;
}

export const DialogueDashboard: React.FC<DialogueDashboardProps> = ({ projectId, chapterId }) => {
  const { analysis, voiceProfiles, isLoading } = useDialogue({
    projectId,
    chapterId,
    autoLoad: true,
  });

  if (isLoading) {
    return (
      <div className='space-y-6 p-6'>
        <Skeleton className='h-8 w-64' />
        <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-4'>
          <Skeleton className='h-32' />
          <Skeleton className='h-32' />
          <Skeleton className='h-32' />
          <Skeleton className='h-32' />
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-6 p-6'>
      <div className='flex items-center justify-between'>
        <h1 className='font-serif text-3xl font-bold'>Dialogue Analysis</h1>
      </div>

      {/* Stats Overview */}
      <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-4'>
        <Card className='p-6'>
          <div className='flex items-center gap-4'>
            <MessageSquare className='h-8 w-8 text-primary' />
            <div>
              <p className='text-sm text-muted-foreground'>Total Lines</p>
              <p className='text-2xl font-bold'>{analysis?.totalLines ?? 0}</p>
            </div>
          </div>
        </Card>

        <Card className='p-6'>
          <div className='flex items-center gap-4'>
            <Users className='h-8 w-8 text-primary' />
            <div>
              <p className='text-sm text-muted-foreground'>Characters</p>
              <p className='text-2xl font-bold'>{analysis?.speakerDistribution.length ?? 0}</p>
            </div>
          </div>
        </Card>

        <Card className='p-6'>
          <div className='flex items-center gap-4'>
            <TrendingUp className='h-8 w-8 text-primary' />
            <div>
              <p className='text-sm text-muted-foreground'>Quality Score</p>
              <p className='text-2xl font-bold'>
                {analysis?.overallQualityScore.toFixed(0) ?? '--'}
              </p>
            </div>
          </div>
        </Card>

        <Card className='p-6'>
          <div className='flex items-center gap-4'>
            <AlertCircle className='h-8 w-8 text-primary' />
            <div>
              <p className='text-sm text-muted-foreground'>Issues</p>
              <p className='text-2xl font-bold'>{analysis?.issues.length ?? 0}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Main Content Area */}
      <div className='grid gap-6 lg:grid-cols-3'>
        {/* Speaker Distribution */}
        <Card className='p-6 lg:col-span-2'>
          <h2 className='mb-4 text-xl font-semibold'>Speaker Distribution</h2>
          {analysis && analysis.speakerDistribution.length > 0 ? (
            <div className='space-y-3'>
              {analysis.speakerDistribution.map(speaker => (
                <div key={speaker.characterName} className='flex items-center gap-4'>
                  <div className='flex-1'>
                    <div className='mb-1 flex items-center justify-between'>
                      <span className='font-medium'>{speaker.characterName}</span>
                      <span className='text-sm text-muted-foreground'>
                        {speaker.count} lines ({speaker.percentage.toFixed(1)}%)
                      </span>
                    </div>
                    <div className='h-2 overflow-hidden rounded-full bg-secondary'>
                      <div
                        className='h-full bg-primary'
                        style={{ width: `${speaker.percentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className='text-muted-foreground'>No dialogue found</p>
          )}
        </Card>

        {/* Issues Summary */}
        <Card className='p-6'>
          <h2 className='mb-4 text-xl font-semibold'>Issues</h2>
          {analysis && analysis.issues.length > 0 ? (
            <div className='space-y-2'>
              {analysis.issues.slice(0, 5).map((issue, idx) => (
                <div
                  key={idx}
                  className='rounded border p-3 text-sm'
                  data-severity={issue.severity}
                >
                  <p className='font-medium'>{issue.type.replace(/_/g, ' ')}</p>
                  <p className='text-muted-foreground'>{issue.message}</p>
                </div>
              ))}
              {analysis.issues.length > 5 && (
                <p className='text-sm text-muted-foreground'>
                  +{analysis.issues.length - 5} more issues
                </p>
              )}
            </div>
          ) : (
            <p className='text-muted-foreground'>No issues found</p>
          )}
        </Card>
      </div>

      {/* Character Voice Profiles */}
      <Card className='p-6'>
        <h2 className='mb-4 text-xl font-semibold'>Character Voice Profiles</h2>
        {voiceProfiles.length > 0 ? (
          <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
            {voiceProfiles.map(profile => (
              <Card key={profile.characterId} className='border p-4'>
                <h3 className='mb-2 font-semibold'>{profile.characterName}</h3>
                <div className='space-y-1 text-sm'>
                  <p className='text-muted-foreground'>Lines: {profile.totalLines}</p>
                  <p className='text-muted-foreground'>
                    Avg words: {profile.speechPattern.averageWordCount.toFixed(1)}
                  </p>
                  <p className='text-muted-foreground'>
                    Formality: {profile.speechPattern.formalityScore}/10
                  </p>
                  <p className='text-muted-foreground'>
                    Consistency: {profile.voiceConsistencyScore.toFixed(0)}%
                  </p>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <p className='text-muted-foreground'>No character profiles available</p>
        )}
      </Card>
    </div>
  );
};
