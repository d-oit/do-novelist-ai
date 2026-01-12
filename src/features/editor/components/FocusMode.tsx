import { Minimize2, Play, Pause, RotateCcw, Target, Settings } from 'lucide-react';
import React, { useEffect, useState, useCallback } from 'react';

import { cn } from '@/lib/utils';
import { Button } from '@/shared/components/ui/Button';
import type { Chapter } from '@/shared/types';

interface FocusModeProps {
  isActive: boolean;
  onExit: () => void;
  chapter: Chapter;
  content: string;
  onContentChange: (content: string) => void;
  onSave: () => void;
}

interface TimerSettings {
  duration: number; // in minutes
  autoStart: boolean;
}

interface WordGoal {
  target: number;
  startCount: number;
}

export const FocusMode: React.FC<FocusModeProps> = ({
  isActive,
  onExit,
  chapter,
  content,
  onContentChange,
  onSave,
}) => {
  const [wordCount, setWordCount] = useState(0);

  // Timer state
  const [timerSeconds, setTimerSeconds] = useState(25 * 60); // 25 minutes default
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerSettings, setTimerSettings] = useState<TimerSettings>({
    duration: 25,
    autoStart: false,
  });

  // Word goal state
  const [wordGoal, setWordGoal] = useState<WordGoal | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [goalInput, setGoalInput] = useState('500');

  // Calculate word count
  useEffect(() => {
    const count = content.trim().length === 0 ? 0 : content.trim().split(/\s+/).length;
    setWordCount(count);
  }, [content]);

  // Timer countdown
  useEffect(() => {
    if (!isTimerRunning || timerSeconds <= 0) return;

    const interval = setInterval(() => {
      setTimerSeconds(prev => {
        if (prev <= 1) {
          setIsTimerRunning(false);
          // Play notification sound or show alert
          if ('Notification' in window && Notification.permission === 'granted') {
            void new Notification('Focus Session Complete!', {
              body: `You've completed your ${timerSettings.duration}-minute focus session.`,
              icon: '/pwa-192x192.svg',
            });
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isTimerRunning, timerSeconds, timerSettings.duration]);

  // Reset timer when settings change
  useEffect(() => {
    setTimerSeconds(timerSettings.duration * 60);
  }, [timerSettings.duration]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onExit();
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        onSave();
      }
      // Space to toggle timer (when not focused on textarea)
      if (e.key === ' ' && e.target === document.body) {
        e.preventDefault();
        setIsTimerRunning(prev => !prev);
      }
      // G to set goal
      if ((e.ctrlKey || e.metaKey) && e.key === 'g') {
        e.preventDefault();
        setShowSettings(prev => !prev);
      }
    };

    if (isActive) {
      document.addEventListener('keydown', handleKeyDown);
      // Request notification permission
      if ('Notification' in window && Notification.permission === 'default') {
        void Notification.requestPermission();
      }
    }
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isActive, onExit, onSave]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const resetTimer = useCallback(() => {
    setIsTimerRunning(false);
    setTimerSeconds(timerSettings.duration * 60);
  }, [timerSettings.duration]);

  const startWordGoal = useCallback(() => {
    const target = parseInt(goalInput, 10);
    if (isNaN(target) || target <= 0) return;

    setWordGoal({
      target,
      startCount: wordCount,
    });
    setShowSettings(false);
  }, [goalInput, wordCount]);

  const clearWordGoal = useCallback(() => {
    setWordGoal(null);
  }, []);

  const wordsWritten = wordGoal ? Math.max(0, wordCount - wordGoal.startCount) : 0;
  const goalProgress = wordGoal ? Math.min(100, (wordsWritten / wordGoal.target) * 100) : 0;

  if (!isActive) return null;

  return (
    <div className='animate-in fade-in fixed inset-0 z-50 bg-background transition-all duration-300'>
      {/* Header */}
      <div className='absolute left-0 right-0 top-0 bg-gradient-to-b from-background to-transparent p-4 opacity-0 transition-opacity hover:opacity-100'>
        <div className='container mx-auto flex max-w-4xl items-center justify-between'>
          <span className='text-sm font-medium text-muted-foreground'>{chapter.title}</span>
          <div className='flex items-center gap-2'>
            <Button variant='ghost' size='sm' onClick={() => setShowSettings(!showSettings)}>
              <Settings className='h-4 w-4' />
            </Button>
            <Button variant='ghost' size='sm' onClick={onExit}>
              <Minimize2 className='mr-2 h-4 w-4' />
              Exit Focus Mode
            </Button>
          </div>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className='animate-in slide-in-from-top absolute left-1/2 top-20 z-10 w-96 -translate-x-1/2 rounded-lg border border-border bg-card p-6 shadow-lg'>
          <h3 className='mb-4 text-lg font-semibold'>Focus Settings</h3>

          {/* Timer Settings */}
          <div className='mb-6'>
            <label className='mb-2 block text-sm font-medium'>Timer Duration</label>
            <div className='flex gap-2'>
              {[15, 25, 45, 60].map(duration => (
                <Button
                  key={duration}
                  variant={timerSettings.duration === duration ? 'default' : 'outline'}
                  size='sm'
                  onClick={() => setTimerSettings(prev => ({ ...prev, duration }))}
                >
                  {duration}m
                </Button>
              ))}
            </div>
          </div>

          {/* Word Goal */}
          <div>
            <label className='mb-2 block text-sm font-medium'>Word Count Goal</label>
            <div className='flex gap-2'>
              <input
                type='number'
                value={goalInput}
                onChange={e => setGoalInput(e.target.value)}
                className='flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm'
                placeholder='e.g., 500'
                min='1'
              />
              <Button onClick={startWordGoal} size='sm'>
                <Target className='mr-2 h-4 w-4' />
                Set Goal
              </Button>
            </div>
            {wordGoal && (
              <Button
                variant='ghost'
                size='sm'
                onClick={clearWordGoal}
                className='mt-2 w-full text-muted-foreground'
              >
                Clear Goal
              </Button>
            )}
          </div>

          <div className='mt-4 text-xs text-muted-foreground'>
            <p>Shortcuts: ESC to exit • Ctrl+S to save • Ctrl+G for settings</p>
          </div>
        </div>
      )}

      {/* Editor Area */}
      <div className='mx-auto h-full max-w-3xl px-8 py-20'>
        <textarea
          className='h-full w-full resize-none bg-transparent p-0 font-serif text-lg leading-relaxed focus:outline-none focus:ring-0'
          value={content}
          onChange={e => onContentChange(e.target.value)}
          placeholder='Just write...'
          autoFocus
          spellCheck={false}
        />
      </div>

      {/* Timer Controls */}
      <div className='fixed bottom-8 left-8 opacity-30 transition-opacity hover:opacity-100'>
        <div className='flex items-center gap-3 rounded-lg bg-card/80 p-3 backdrop-blur'>
          <div className='font-mono text-2xl font-bold'>{formatTime(timerSeconds)}</div>
          <div className='flex gap-1'>
            <Button
              variant='ghost'
              size='sm'
              onClick={() => setIsTimerRunning(!isTimerRunning)}
              title={isTimerRunning ? 'Pause Timer' : 'Start Timer'}
            >
              {isTimerRunning ? <Pause className='h-4 w-4' /> : <Play className='h-4 w-4' />}
            </Button>
            <Button variant='ghost' size='sm' onClick={resetTimer} title='Reset Timer'>
              <RotateCcw className='h-4 w-4' />
            </Button>
          </div>
        </div>
      </div>

      {/* Stats & Progress */}
      <div className='fixed bottom-8 right-8 opacity-30 transition-opacity hover:opacity-100'>
        <div className='text-right'>
          <div className='text-2xl font-bold'>{wordCount}</div>
          <div className='text-xs uppercase tracking-wider text-muted-foreground'>Words</div>

          {wordGoal && (
            <div className='mt-4 min-w-[120px]'>
              <div className='mb-1 flex items-center justify-between text-xs'>
                <span className='text-muted-foreground'>Goal</span>
                <span className='font-medium'>
                  {wordsWritten} / {wordGoal.target}
                </span>
              </div>
              <div className='h-2 overflow-hidden rounded-full bg-secondary'>
                <div
                  className={cn(
                    'h-full rounded-full transition-all duration-500',
                    goalProgress >= 100 ? 'bg-green-500' : 'bg-primary',
                  )}
                  style={{ width: `${goalProgress}%` }}
                />
              </div>
              {goalProgress >= 100 && (
                <div className='animate-in fade-in mt-2 text-xs font-medium text-green-500'>
                  🎉 Goal achieved!
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
