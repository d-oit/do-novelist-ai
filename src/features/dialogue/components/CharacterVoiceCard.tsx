/**
 * Character Voice Card Component
 *
 * Displays character voice profile and speech patterns
 */

import { User, TrendingUp, MessageSquare, Hash } from 'lucide-react';
import React from 'react';

import type { CharacterVoiceProfile } from '@/features/dialogue/types';
import { Badge } from '@/shared/components/ui/Badge';
import { Card } from '@/shared/components/ui/Card';
import { Progress } from '@/shared/components/ui/Progress';

interface CharacterVoiceCardProps {
  profile: CharacterVoiceProfile;
  onClick?: () => void;
}

export const CharacterVoiceCard: React.FC<CharacterVoiceCardProps> = ({ profile, onClick }) => {
  const getFormalityLabel = (score: number): string => {
    if (score >= 8) return 'Very Formal';
    if (score >= 6) return 'Formal';
    if (score >= 4) return 'Neutral';
    if (score >= 2) return 'Casual';
    return 'Very Casual';
  };

  const getComplexityColor = (complexity: string): string => {
    switch (complexity) {
      case 'simple':
        return 'bg-green-500';
      case 'moderate':
        return 'bg-yellow-500';
      case 'complex':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <Card className='cursor-pointer p-6 transition-all hover:shadow-lg' onClick={onClick}>
      {/* Header */}
      <div className='mb-4 flex items-start justify-between'>
        <div className='flex items-center gap-3'>
          <div className='flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground'>
            <User className='h-6 w-6' />
          </div>
          <div>
            <h3 className='text-lg font-semibold'>{profile.characterName}</h3>
            <p className='text-sm text-muted-foreground'>{profile.totalLines} dialogue lines</p>
          </div>
        </div>
        <Badge variant='outline'>{profile.voiceConsistencyScore.toFixed(0)}% consistent</Badge>
      </div>

      {/* Voice Consistency Score */}
      <div className='mb-4'>
        <div className='mb-2 flex items-center justify-between text-sm'>
          <span className='font-medium'>Voice Consistency</span>
          <span className='text-muted-foreground'>{profile.voiceConsistencyScore.toFixed(0)}%</span>
        </div>
        <Progress value={profile.voiceConsistencyScore} />
      </div>

      {/* Speech Pattern Stats */}
      <div className='space-y-3'>
        <div className='flex items-center justify-between text-sm'>
          <div className='flex items-center gap-2 text-muted-foreground'>
            <MessageSquare className='h-4 w-4' />
            <span>Avg words per line</span>
          </div>
          <span className='font-medium'>{profile.speechPattern.averageWordCount.toFixed(1)}</span>
        </div>

        <div className='flex items-center justify-between text-sm'>
          <div className='flex items-center gap-2 text-muted-foreground'>
            <TrendingUp className='h-4 w-4' />
            <span>Complexity</span>
          </div>
          <Badge
            variant='outline'
            className={getComplexityColor(profile.speechPattern.sentenceComplexity)}
          >
            {profile.speechPattern.sentenceComplexity}
          </Badge>
        </div>

        <div className='flex items-center justify-between text-sm'>
          <div className='flex items-center gap-2 text-muted-foreground'>
            <Hash className='h-4 w-4' />
            <span>Formality</span>
          </div>
          <span className='font-medium'>
            {getFormalityLabel(profile.speechPattern.formalityScore)}
          </span>
        </div>
      </div>

      {/* Common Phrases */}
      {profile.speechPattern.commonPhrases.length > 0 && (
        <div className='mt-4 border-t pt-4'>
          <p className='mb-2 text-sm font-medium'>Common Phrases</p>
          <div className='flex flex-wrap gap-2'>
            {profile.speechPattern.commonPhrases.slice(0, 3).map((phrase, idx) => (
              <Badge key={idx} variant='secondary' className='text-xs'>
                "{phrase}"
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Speech Tics */}
      {profile.speechPattern.speechTics.length > 0 && (
        <div className='mt-4 border-t pt-4'>
          <p className='mb-2 text-sm font-medium'>Speech Tics</p>
          <div className='flex flex-wrap gap-2'>
            {profile.speechPattern.speechTics.map((tic, idx) => (
              <Badge key={idx} variant='outline' className='text-xs'>
                {tic}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Emotional Range */}
      <div className='mt-4 border-t pt-4'>
        <p className='mb-2 text-sm font-medium'>Emotional Range</p>
        <div className='flex flex-wrap gap-2'>
          {profile.speechPattern.emotionalRange.map((emotion, idx) => (
            <Badge key={idx} variant='secondary' className='text-xs capitalize'>
              {emotion}
            </Badge>
          ))}
        </div>
      </div>

      {/* Top Tags */}
      {profile.commonTags.length > 0 && (
        <div className='mt-4 border-t pt-4'>
          <p className='mb-2 text-sm font-medium'>Most Used Tags</p>
          <div className='space-y-2'>
            {profile.commonTags.slice(0, 3).map((tagData, idx) => (
              <div key={idx} className='flex items-center justify-between text-sm'>
                <span className='text-muted-foreground'>{tagData.tag}</span>
                <span className='font-medium'>{tagData.percentage.toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Favorite Words */}
      {profile.favoriteWords.length > 0 && (
        <div className='mt-4 border-t pt-4'>
          <p className='mb-2 text-sm font-medium'>Favorite Words</p>
          <div className='flex flex-wrap gap-2'>
            {profile.favoriteWords.slice(0, 5).map((wordData, idx) => (
              <Badge key={idx} variant='outline' className='text-xs'>
                {wordData.word} ({wordData.count})
              </Badge>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
};
