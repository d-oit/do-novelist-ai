'use client';

import { Mic, MicOff, AlertCircle } from 'lucide-react';
import React, { useState } from 'react';

import { cn } from '@/lib/utils';
import { Button } from '@/shared/components/ui/Button';

interface VoiceInputPanelProps {
  onTranscript: (text: string) => void;
  isSupported?: boolean;
}

export const VoiceInputPanel: React.FC<VoiceInputPanelProps> = ({
  onTranscript,
  isSupported = true,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');

  const toggleRecording = () => {
    setIsRecording(!isRecording);
    // Logic would go here: start/stop SpeechRecognition
    if (!isRecording) {
      setTranscript('Listening...'); // Mock state
    } else {
      onTranscript('Sample captured text'); // Mock result
      setTranscript('');
    }
  };

  if (!isSupported) {
    return (
      <div className='flex items-center gap-2 rounded-md bg-destructive/10 p-2 text-sm text-destructive'>
        <AlertCircle className='h-4 w-4' />
        Voice input not supported in this browser
      </div>
    );
  }

  return (
    <div className='flex flex-col items-center gap-4 rounded-lg border bg-card p-4'>
      <Button
        variant={isRecording ? 'destructive' : 'outline'}
        size='lg'
        className={cn(
          'h-16 w-16 rounded-full',
          isRecording && 'animate-pulse ring-4 ring-destructive/30',
        )}
        onClick={toggleRecording}
      >
        {isRecording ? <MicOff className='h-6 w-6' /> : <Mic className='h-6 w-6' />}
      </Button>

      <div className='text-center'>
        <p className='font-medium'>{isRecording ? 'Listening...' : 'Click to Speak'}</p>
        {isRecording && <p className='mt-1 text-sm text-muted-foreground'>Say "Stop" to end</p>}
      </div>

      {transcript && (
        <div className='w-full rounded-md bg-muted p-3 text-sm italic'>"{transcript}"</div>
      )}
    </div>
  );
};
