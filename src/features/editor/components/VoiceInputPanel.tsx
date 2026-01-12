import { Mic, MicOff, AlertCircle, Volume2, FileText } from 'lucide-react';
import React, { useState, useEffect, useRef, useCallback } from 'react';

import { logger } from '@/lib/logging/logger';
import { cn } from '@/lib/utils';
import { Button } from '@/shared/components/ui/Button';

interface VoiceInputPanelProps {
  onTranscript: (text: string) => void;
  onCommand?: (command: string, args?: string[]) => void;
  isSupported?: boolean;
  language?: string;
  continuous?: boolean;
}

// Voice commands mapping
const VOICE_COMMANDS = {
  save: ['save', 'save chapter', 'save document'],
  newChapter: ['new chapter', 'create chapter', 'add chapter'],
  undo: ['undo', 'undo that'],
  redo: ['redo', 'redo that'],
  stop: ['stop', 'stop recording', 'stop listening'],
} as const;

type VoiceCommand = keyof typeof VOICE_COMMANDS;

export const VoiceInputPanel: React.FC<VoiceInputPanelProps> = ({
  onTranscript,
  onCommand,
  isSupported: isSupportedProp,
  language = 'en-US',
  continuous = true,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [isSupported, setIsSupported] = useState(isSupportedProp ?? false);
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const finalTranscriptRef = useRef('');

  // Check browser support on mount
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const supported = !!SpeechRecognition;
    setIsSupported(supported);

    if (supported && !recognitionRef.current) {
      const recognition = new SpeechRecognition();
      recognition.continuous = continuous;
      recognition.interimResults = true;
      recognition.lang = language;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        logger.info('Voice recognition started', { component: 'VoiceInputPanel' });
        setError(null);
        setIsRecording(true);
      };

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let interim = '';
        let final = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (!result) continue;

          const transcriptText = result[0]?.transcript;
          if (!transcriptText) continue;

          if (result.isFinal) {
            final += transcriptText;

            // Check for voice commands
            const command = detectVoiceCommand(transcriptText);
            if (command && onCommand) {
              logger.info('Voice command detected', {
                component: 'VoiceInputPanel',
                command,
                text: transcriptText,
              });
              onCommand(command);

              // Stop if it's the stop command
              if (command === 'stop') {
                recognition.stop();
              }
              return;
            }
          } else {
            interim += transcriptText;
          }
        }

        if (final) {
          finalTranscriptRef.current += (finalTranscriptRef.current ? ' ' : '') + final;
          setTranscript(finalTranscriptRef.current);
          setInterimTranscript('');
        } else {
          setInterimTranscript(interim);
        }
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        logger.error('Voice recognition error', {
          component: 'VoiceInputPanel',
          error: event.error,
          message: event.message,
        });

        let errorMessage = 'Voice recognition error';
        switch (event.error) {
          case 'no-speech':
            errorMessage = 'No speech detected';
            break;
          case 'audio-capture':
            errorMessage = 'No microphone found';
            break;
          case 'not-allowed':
            errorMessage = 'Microphone access denied';
            break;
          case 'network':
            errorMessage = 'Network error occurred';
            break;
          default:
            errorMessage = `Error: ${event.error}`;
        }

        setError(errorMessage);
        setIsRecording(false);
      };

      recognition.onend = () => {
        logger.info('Voice recognition ended', { component: 'VoiceInputPanel' });
        setIsRecording(false);

        // Send final transcript
        if (finalTranscriptRef.current.trim()) {
          onTranscript(finalTranscriptRef.current.trim());
        }
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current && isRecording) {
        recognitionRef.current.stop();
      }
    };
  }, [continuous, language, onCommand, onTranscript, isRecording]);

  const detectVoiceCommand = (text: string): VoiceCommand | null => {
    const lowerText = text.toLowerCase().trim();

    for (const [command, phrases] of Object.entries(VOICE_COMMANDS)) {
      if (phrases.some(phrase => lowerText.includes(phrase))) {
        return command as VoiceCommand;
      }
    }

    return null;
  };

  const toggleRecording = useCallback(() => {
    if (!recognitionRef.current) return;

    try {
      if (isRecording) {
        recognitionRef.current.stop();
      } else {
        finalTranscriptRef.current = '';
        setTranscript('');
        setInterimTranscript('');
        setError(null);
        recognitionRef.current.start();
      }
    } catch (err) {
      logger.error('Error toggling voice recognition', {
        component: 'VoiceInputPanel',
        error: err,
      });
      setError('Failed to start voice recognition');
    }
  }, [isRecording]);

  const clearTranscript = useCallback(() => {
    setTranscript('');
    setInterimTranscript('');
    finalTranscriptRef.current = '';
  }, []);

  const insertTranscript = useCallback(() => {
    if (transcript.trim()) {
      onTranscript(transcript.trim());
      clearTranscript();
    }
  }, [transcript, onTranscript, clearTranscript]);

  if (!isSupported) {
    return (
      <div className='flex items-center gap-2 rounded-md bg-destructive/10 p-4 text-sm text-destructive'>
        <AlertCircle className='h-5 w-5' />
        <div>
          <p className='font-medium'>Voice input not supported</p>
          <p className='mt-1 text-xs text-muted-foreground'>
            Try Chrome, Edge, or Safari for voice input support
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className='flex flex-col gap-4 rounded-lg border bg-card p-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <h3 className='text-lg font-semibold'>Voice Input</h3>
        <Volume2 className='h-5 w-5 text-muted-foreground' />
      </div>

      {/* Error Display */}
      {error && (
        <div className='flex items-center gap-2 rounded-md bg-destructive/10 p-2 text-sm text-destructive'>
          <AlertCircle className='h-4 w-4' />
          {error}
        </div>
      )}

      {/* Microphone Button */}
      <div className='flex flex-col items-center gap-4'>
        <Button
          variant={isRecording ? 'destructive' : 'outline'}
          size='lg'
          className={cn(
            'h-20 w-20 rounded-full transition-all',
            isRecording && 'animate-pulse ring-4 ring-destructive/30',
          )}
          onClick={toggleRecording}
          disabled={!!error && error.includes('Microphone access denied')}
          aria-label={isRecording ? 'Stop voice recording' : 'Start voice recording'}
          data-testid='voice-recording-button'
        >
          {isRecording ? <MicOff className='h-8 w-8' /> : <Mic className='h-8 w-8' />}
        </Button>

        <div className='text-center'>
          <p className='font-medium' aria-live='polite'>
            {isRecording ? 'Listening...' : 'Click to Start Dictation'}
          </p>
          {isRecording && (
            <p className='mt-1 text-sm text-muted-foreground'>Say "Stop" to end recording</p>
          )}
        </div>
      </div>

      {/* Transcript Display */}
      {(transcript || interimTranscript) && (
        <div className='space-y-2'>
          <div className='min-h-[100px] rounded-md bg-muted p-4 text-sm'>
            <p className='whitespace-pre-wrap'>
              {transcript}
              {transcript && interimTranscript && ' '}
              <span className='italic text-muted-foreground'>{interimTranscript}</span>
            </p>
          </div>

          {/* Action Buttons */}
          {transcript && !isRecording && (
            <div className='flex gap-2'>
              <Button onClick={insertTranscript} size='sm' className='flex-1'>
                <FileText className='mr-2 h-4 w-4' />
                Insert Text
              </Button>
              <Button onClick={clearTranscript} variant='outline' size='sm'>
                Clear
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Voice Commands Help */}
      <div className='rounded-md bg-secondary/50 p-3 text-xs'>
        <p className='mb-2 font-medium text-muted-foreground'>Voice Commands:</p>
        <ul className='space-y-1 text-muted-foreground'>
          <li>• "Save" - Save current chapter</li>
          <li>• "New chapter" - Create a new chapter</li>
          <li>• "Stop" - End recording</li>
        </ul>
      </div>
    </div>
  );
};
