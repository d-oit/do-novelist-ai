/**
 * Conversation Flow Visualizer
 *
 * Visual representation of conversation dynamics and turn-taking
 */

import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import React from 'react';

import type { Conversation } from '@/features/dialogue/types';
import { cn } from '@/lib/utils';
import { Card } from '@/shared/components/ui/Card';

interface ConversationFlowProps {
  conversation: Conversation;
  onTurnClick?: (turnId: string) => void;
}

export const ConversationFlow: React.FC<ConversationFlowProps> = ({
  conversation,
  onTurnClick,
}) => {
  const getCharacterColor = (characterName: string): string => {
    let hash = 0;
    for (let i = 0; i < characterName.length; i++) {
      hash = characterName.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = Math.abs(hash % 360);
    return `hsl(${hue}, 70%, 50%)`;
  };

  const getTensionIcon = (tension: number): React.ReactNode => {
    if (tension >= 7) {
      return <TrendingUp className='h-4 w-4 text-red-500' />;
    } else if (tension <= 3) {
      return <TrendingDown className='h-4 w-4 text-blue-500' />;
    } else {
      return <Minus className='h-4 w-4 text-yellow-500' />;
    }
  };

  const getTensionColor = (tension: number): string => {
    if (tension >= 8) return 'bg-red-500';
    if (tension >= 6) return 'bg-orange-500';
    if (tension >= 4) return 'bg-yellow-500';
    if (tension >= 2) return 'bg-blue-500';
    return 'bg-green-500';
  };

  return (
    <Card className='p-6'>
      <div className='mb-6 space-y-2'>
        <div className='flex items-center justify-between'>
          <h3 className='text-xl font-semibold'>{conversation.title || 'Conversation'}</h3>
          <span className='text-sm text-muted-foreground'>{conversation.conversationType}</span>
        </div>
        <div className='flex items-center gap-4 text-sm text-muted-foreground'>
          <span>Participants: {conversation.participants.join(', ')}</span>
          <span>•</span>
          <span>{conversation.turns.length} turns</span>
          <span>•</span>
          <span>Avg tension: {conversation.averageTension.toFixed(1)}/10</span>
        </div>
      </div>

      {/* Tension Graph */}
      <div className='mb-6'>
        <div className='mb-2 flex items-center justify-between'>
          <h4 className='text-sm font-medium'>Tension Flow</h4>
          <div className='flex items-center gap-2 text-xs'>
            <span className='flex items-center gap-1'>
              <div className='h-2 w-2 rounded-full bg-green-500' />
              Low
            </span>
            <span className='flex items-center gap-1'>
              <div className='h-2 w-2 rounded-full bg-yellow-500' />
              Medium
            </span>
            <span className='flex items-center gap-1'>
              <div className='h-2 w-2 rounded-full bg-red-500' />
              High
            </span>
          </div>
        </div>
        <div className='relative h-24 rounded border bg-secondary/20'>
          <svg className='h-full w-full' preserveAspectRatio='none'>
            <polyline
              fill='none'
              stroke='currentColor'
              strokeWidth='2'
              points={conversation.turns
                .map((turn, idx) => {
                  const x = (idx / (conversation.turns.length - 1)) * 100;
                  const y = 100 - (turn.tension / 10) * 100;
                  return `${x}%,${y}%`;
                })
                .join(' ')}
            />
          </svg>
        </div>
      </div>

      {/* Conversation Turns */}
      <div className='space-y-3'>
        {conversation.turns.map((turn, index) => {
          const isLeftAligned = index % 2 === 0;
          const characterColor = getCharacterColor(turn.characterName);

          return (
            <div
              key={turn.id}
              className={cn('flex gap-3', isLeftAligned ? 'flex-row' : 'flex-row-reverse')}
            >
              {/* Character indicator */}
              <div className='flex-shrink-0'>
                <div
                  className='flex h-10 w-10 items-center justify-center rounded-full font-medium text-white'
                  style={{ backgroundColor: characterColor }}
                >
                  {turn.characterName.charAt(0)}
                </div>
              </div>

              {/* Dialogue bubble */}
              <div
                className={cn(
                  'max-w-[70%] cursor-pointer rounded-lg border p-4 transition-all hover:shadow-md',
                  isLeftAligned ? 'rounded-tl-none' : 'rounded-tr-none',
                )}
                onClick={() => onTurnClick?.(turn.id)}
              >
                <div className='mb-2 flex items-center justify-between gap-2'>
                  <span className='font-medium' style={{ color: characterColor }}>
                    {turn.characterName}
                  </span>
                  <div className='flex items-center gap-1'>
                    {getTensionIcon(turn.tension)}
                    <span className='text-xs text-muted-foreground'>{turn.tension}/10</span>
                  </div>
                </div>
                <p className='font-serif text-sm leading-relaxed'>{turn.text}</p>
                {turn.responseTime && (
                  <span className='mt-2 inline-block text-xs italic text-muted-foreground'>
                    {turn.responseTime === 'immediate' && '⚡ Immediate'}
                    {turn.responseTime === 'pause' && '⏸️ After a pause'}
                    {turn.responseTime === 'delayed' && '⏱️ Delayed response'}
                  </span>
                )}
              </div>

              {/* Tension indicator */}
              <div className='flex flex-shrink-0 items-center'>
                <div
                  className={cn('h-full w-1 rounded', getTensionColor(turn.tension))}
                  style={{ minHeight: '4rem' }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary Stats */}
      <div className='mt-6 grid grid-cols-3 gap-4 border-t pt-4'>
        <div>
          <p className='text-xs text-muted-foreground'>Dominant Speaker</p>
          <p className='font-medium'>{conversation.dominantSpeaker || 'Balanced'}</p>
        </div>
        <div>
          <p className='text-xs text-muted-foreground'>Peak Tension</p>
          <p className='font-medium'>
            {Math.max(...conversation.turns.map(t => t.tension)).toFixed(1)}/10
          </p>
        </div>
        <div>
          <p className='text-xs text-muted-foreground'>Low Point</p>
          <p className='font-medium'>
            {Math.min(...conversation.turns.map(t => t.tension)).toFixed(1)}/10
          </p>
        </div>
      </div>
    </Card>
  );
};
