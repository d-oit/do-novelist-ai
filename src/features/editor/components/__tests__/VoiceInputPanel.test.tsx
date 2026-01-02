/**
 * VoiceInputPanel Component Tests
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { VoiceInputPanel } from '@/features/editor/components/VoiceInputPanel';

// Mock the logger
vi.mock('@/lib/logging/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
  },
}));

describe('VoiceInputPanel', () => {
  const mockOnTranscript = vi.fn();
  const mockOnCommand = vi.fn();

  // Mock SpeechRecognition
  let mockRecognition: {
    start: ReturnType<typeof vi.fn>;
    stop: ReturnType<typeof vi.fn>;
    abort: ReturnType<typeof vi.fn>;
    onstart: ((event: Event) => void) | null;
    onend: ((event: Event) => void) | null;
    onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
    onresult: ((event: SpeechRecognitionEvent) => void) | null;
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    maxAlternatives: number;
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Create mock recognition instance
    mockRecognition = {
      start: vi.fn(),
      stop: vi.fn(),
      abort: vi.fn(),
      onstart: null,
      onend: null,
      onerror: null,
      onresult: null,
      continuous: false,
      interimResults: false,
      lang: '',
      maxAlternatives: 1,
    };

    // Mock SpeechRecognition constructor
    class MockSpeechRecognition {
      start = mockRecognition.start;
      stop = mockRecognition.stop;
      abort = mockRecognition.abort;
      onstart = mockRecognition.onstart;
      onend = mockRecognition.onend;
      onerror = mockRecognition.onerror;
      onresult = mockRecognition.onresult;
      continuous = mockRecognition.continuous;
      interimResults = mockRecognition.interimResults;
      lang = mockRecognition.lang;
      maxAlternatives = mockRecognition.maxAlternatives;

      constructor() {
        // Return the mock instance properties
        Object.assign(this, mockRecognition);
      }
    }

    (window as any).SpeechRecognition = MockSpeechRecognition;
    (window as any).webkitSpeechRecognition = MockSpeechRecognition;
  });

  afterEach(() => {
    delete (window as any).SpeechRecognition;
    delete (window as any).webkitSpeechRecognition;
  });

  describe('Browser Support', () => {
    it('shows unsupported message when Speech API is not available', () => {
      delete (window as any).SpeechRecognition;
      delete (window as any).webkitSpeechRecognition;

      render(<VoiceInputPanel onTranscript={mockOnTranscript} isSupported={false} />);

      expect(screen.getByText('Voice input not supported')).toBeInTheDocument();
      expect(screen.getByText(/Try Chrome, Edge, or Safari/)).toBeInTheDocument();
    });

    it('renders voice input UI when supported', () => {
      render(<VoiceInputPanel onTranscript={mockOnTranscript} />);

      expect(screen.getByText('Voice Input')).toBeInTheDocument();
      expect(screen.getByText('Click to Start Dictation')).toBeInTheDocument();
    });

    it('detects browser support automatically', () => {
      render(<VoiceInputPanel onTranscript={mockOnTranscript} />);

      // Should render the main UI, not the unsupported message
      expect(screen.getByText('Voice Input')).toBeInTheDocument();
      expect(screen.queryByText('Voice input not supported')).not.toBeInTheDocument();
    });
  });

  describe('Recording Controls', () => {
    it('starts recording when microphone button is clicked', async () => {
      render(<VoiceInputPanel onTranscript={mockOnTranscript} />);

      // Find the large circular mic button
      const buttons = screen.getAllByRole('button');
      const micButton = buttons.find(btn => btn.className.includes('h-20 w-20 rounded-full'));

      expect(micButton).toBeDefined();
      fireEvent.click(micButton!);

      await waitFor(
        () => {
          expect(mockRecognition.start).toHaveBeenCalledTimes(1);
        },
        { timeout: 2000 },
      );
    });

    it('stops recording when clicked again', async () => {
      render(<VoiceInputPanel onTranscript={mockOnTranscript} />);

      const buttons = screen.getAllByRole('button');
      const micButton = buttons.find(btn => btn.className.includes('h-20 w-20 rounded-full'));

      // Start recording
      fireEvent.click(micButton!);
      if (mockRecognition.onstart) mockRecognition.onstart(new Event('start'));

      await waitFor(
        () => {
          expect(screen.getByText('Listening...')).toBeInTheDocument();
        },
        { timeout: 2000 },
      );

      // Stop recording
      fireEvent.click(micButton!);

      await waitFor(
        () => {
          expect(mockRecognition.stop).toHaveBeenCalledTimes(1);
        },
        { timeout: 2000 },
      );
    });

    it('shows listening state when recording', async () => {
      render(<VoiceInputPanel onTranscript={mockOnTranscript} />);

      const buttons = screen.getAllByRole('button');
      const micButton = buttons.find(btn => btn.className.includes('h-20 w-20 rounded-full'));
      fireEvent.click(micButton!);

      // Simulate start event
      if (mockRecognition.onstart) mockRecognition.onstart(new Event('start'));

      await waitFor(
        () => {
          expect(screen.getByText('Listening...')).toBeInTheDocument();
          expect(screen.getByText(/Say "Stop" to end/)).toBeInTheDocument();
        },
        { timeout: 2000 },
      );
    });

    it('configures recognition with correct settings', async () => {
      render(<VoiceInputPanel onTranscript={mockOnTranscript} language='es-ES' continuous={false} />);

      await waitFor(() => {
        expect(mockRecognition.lang).toBe('es-ES');
        expect(mockRecognition.continuous).toBe(false);
        expect(mockRecognition.interimResults).toBe(true);
        expect(mockRecognition.maxAlternatives).toBe(1);
      });
    });
  });

  describe('Transcript Handling', () => {
    it('displays interim transcript with italic style', async () => {
      render(<VoiceInputPanel onTranscript={mockOnTranscript} />);

      const micButton = screen.getByRole('button', { name: /microphone/i });
      fireEvent.click(micButton);
      if (mockRecognition.onstart) mockRecognition.onstart(new Event('start'));

      // Simulate interim result
      const mockResult = {
        resultIndex: 0,
        results: [
          {
            0: { transcript: 'interim text', confidence: 0.8 },
            isFinal: false,
            length: 1,
            item: () => ({ transcript: 'interim text', confidence: 0.8 }),
          },
        ],
      } as unknown as SpeechRecognitionEvent;

      if (mockRecognition.onresult) mockRecognition.onresult(mockResult);

      await waitFor(() => {
        const interimText = screen.getByText('interim text');
        expect(interimText).toHaveClass('italic', 'text-muted-foreground');
      });
    });

    it('accumulates final transcript results', async () => {
      render(<VoiceInputPanel onTranscript={mockOnTranscript} />);

      const micButton = screen.getByRole('button', { name: /microphone/i });
      fireEvent.click(micButton);
      if (mockRecognition.onstart) mockRecognition.onstart(new Event('start'));

      // Simulate first final result
      const mockResult1 = {
        resultIndex: 0,
        results: [
          {
            0: { transcript: 'Hello', confidence: 0.9 },
            isFinal: true,
            length: 1,
            item: () => ({ transcript: 'Hello', confidence: 0.9 }),
          },
        ],
      } as unknown as SpeechRecognitionEvent;

      if (mockRecognition.onresult) mockRecognition.onresult(mockResult1);

      await waitFor(() => {
        expect(screen.getByText(/Hello/)).toBeInTheDocument();
      });

      // Simulate second final result
      const mockResult2 = {
        resultIndex: 1,
        results: [
          {
            0: { transcript: 'Hello', confidence: 0.9 },
            isFinal: true,
            length: 1,
            item: () => ({ transcript: 'Hello', confidence: 0.9 }),
          },
          {
            0: { transcript: 'world', confidence: 0.9 },
            isFinal: true,
            length: 1,
            item: () => ({ transcript: 'world', confidence: 0.9 }),
          },
        ],
      } as unknown as SpeechRecognitionEvent;

      if (mockRecognition.onresult) mockRecognition.onresult(mockResult2);

      await waitFor(() => {
        expect(screen.getByText(/Hello world/)).toBeInTheDocument();
      });
    });

    it('calls onTranscript when recording ends', async () => {
      render(<VoiceInputPanel onTranscript={mockOnTranscript} />);

      const micButton = screen.getByRole('button', { name: /microphone/i });
      fireEvent.click(micButton);
      if (mockRecognition.onstart) mockRecognition.onstart(new Event('start'));

      // Add transcript
      const mockResult = {
        resultIndex: 0,
        results: [
          {
            0: { transcript: 'Test transcript', confidence: 0.9 },
            isFinal: true,
            length: 1,
            item: () => ({ transcript: 'Test transcript', confidence: 0.9 }),
          },
        ],
      } as unknown as SpeechRecognitionEvent;

      if (mockRecognition.onresult) mockRecognition.onresult(mockResult);

      // End recording
      if (mockRecognition.onend) mockRecognition.onend(new Event('end'));

      await waitFor(() => {
        expect(mockOnTranscript).toHaveBeenCalledWith('Test transcript');
      });
    });

    it('shows insert button when transcript is available and not recording', async () => {
      render(<VoiceInputPanel onTranscript={mockOnTranscript} />);

      const micButton = screen.getByRole('button', { name: /microphone/i });
      fireEvent.click(micButton);
      if (mockRecognition.onstart) mockRecognition.onstart(new Event('start'));

      // Add transcript
      const mockResult = {
        resultIndex: 0,
        results: [
          {
            0: { transcript: 'Test', confidence: 0.9 },
            isFinal: true,
            length: 1,
            item: () => ({ transcript: 'Test', confidence: 0.9 }),
          },
        ],
      } as unknown as SpeechRecognitionEvent;

      if (mockRecognition.onresult) mockRecognition.onresult(mockResult);
      if (mockRecognition.onend) mockRecognition.onend(new Event('end'));

      await waitFor(() => {
        expect(screen.getByText('Insert Text')).toBeInTheDocument();
      });
    });

    it('inserts transcript when insert button is clicked', async () => {
      render(<VoiceInputPanel onTranscript={mockOnTranscript} />);

      const micButton = screen.getByRole('button', { name: /microphone/i });
      fireEvent.click(micButton);
      if (mockRecognition.onstart) mockRecognition.onstart(new Event('start'));

      const mockResult = {
        resultIndex: 0,
        results: [
          {
            0: { transcript: 'Insert this', confidence: 0.9 },
            isFinal: true,
            length: 1,
            item: () => ({ transcript: 'Insert this', confidence: 0.9 }),
          },
        ],
      } as unknown as SpeechRecognitionEvent;

      if (mockRecognition.onresult) mockRecognition.onresult(mockResult);
      if (mockRecognition.onend) mockRecognition.onend(new Event('end'));

      await waitFor(() => {
        const insertButton = screen.getByText('Insert Text');
        fireEvent.click(insertButton);
        expect(mockOnTranscript).toHaveBeenCalledWith('Insert this');
      });
    });

    it('clears transcript when clear button is clicked', async () => {
      render(<VoiceInputPanel onTranscript={mockOnTranscript} />);

      const micButton = screen.getByRole('button', { name: /microphone/i });
      fireEvent.click(micButton);
      if (mockRecognition.onstart) mockRecognition.onstart(new Event('start'));

      const mockResult = {
        resultIndex: 0,
        results: [
          {
            0: { transcript: 'Clear me', confidence: 0.9 },
            isFinal: true,
            length: 1,
            item: () => ({ transcript: 'Clear me', confidence: 0.9 }),
          },
        ],
      } as unknown as SpeechRecognitionEvent;

      if (mockRecognition.onresult) mockRecognition.onresult(mockResult);
      if (mockRecognition.onend) mockRecognition.onend(new Event('end'));

      await waitFor(() => {
        expect(screen.getByText(/Clear me/)).toBeInTheDocument();
      });

      const clearButton = screen.getByText('Clear');
      fireEvent.click(clearButton);

      await waitFor(() => {
        expect(screen.queryByText(/Clear me/)).not.toBeInTheDocument();
      });
    });
  });

  describe('Voice Commands', () => {
    it('detects "save" command', async () => {
      render(<VoiceInputPanel onTranscript={mockOnTranscript} onCommand={mockOnCommand} />);

      const micButton = screen.getByRole('button', { name: /microphone/i });
      fireEvent.click(micButton);
      if (mockRecognition.onstart) mockRecognition.onstart(new Event('start'));

      const mockResult = {
        resultIndex: 0,
        results: [
          {
            0: { transcript: 'save chapter', confidence: 0.9 },
            isFinal: true,
            length: 1,
            item: () => ({ transcript: 'save chapter', confidence: 0.9 }),
          },
        ],
      } as unknown as SpeechRecognitionEvent;

      if (mockRecognition.onresult) mockRecognition.onresult(mockResult);

      await waitFor(() => {
        expect(mockOnCommand).toHaveBeenCalledWith('save');
      });
    });

    it('detects "new chapter" command', async () => {
      render(<VoiceInputPanel onTranscript={mockOnTranscript} onCommand={mockOnCommand} />);

      const micButton = screen.getByRole('button', { name: /microphone/i });
      fireEvent.click(micButton);
      if (mockRecognition.onstart) mockRecognition.onstart(new Event('start'));

      const mockResult = {
        resultIndex: 0,
        results: [
          {
            0: { transcript: 'create chapter', confidence: 0.9 },
            isFinal: true,
            length: 1,
            item: () => ({ transcript: 'create chapter', confidence: 0.9 }),
          },
        ],
      } as unknown as SpeechRecognitionEvent;

      if (mockRecognition.onresult) mockRecognition.onresult(mockResult);

      await waitFor(() => {
        expect(mockOnCommand).toHaveBeenCalledWith('newChapter');
      });
    });

    it('stops recording on "stop" command', async () => {
      render(<VoiceInputPanel onTranscript={mockOnTranscript} onCommand={mockOnCommand} />);

      const micButton = screen.getByRole('button', { name: /microphone/i });
      fireEvent.click(micButton);
      if (mockRecognition.onstart) mockRecognition.onstart(new Event('start'));

      const mockResult = {
        resultIndex: 0,
        results: [
          {
            0: { transcript: 'stop recording', confidence: 0.9 },
            isFinal: true,
            length: 1,
            item: () => ({ transcript: 'stop recording', confidence: 0.9 }),
          },
        ],
      } as unknown as SpeechRecognitionEvent;

      if (mockRecognition.onresult) mockRecognition.onresult(mockResult);

      await waitFor(() => {
        expect(mockOnCommand).toHaveBeenCalledWith('stop');
        expect(mockRecognition.stop).toHaveBeenCalled();
      });
    });

    it('displays voice commands help', () => {
      render(<VoiceInputPanel onTranscript={mockOnTranscript} />);

      expect(screen.getByText('Voice Commands:')).toBeInTheDocument();
      expect(screen.getByText(/"Save" - Save current chapter/)).toBeInTheDocument();
      expect(screen.getByText(/"New chapter" - Create a new chapter/)).toBeInTheDocument();
      expect(screen.getByText(/"Stop" - End recording/)).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('displays error message on recognition error', async () => {
      render(<VoiceInputPanel onTranscript={mockOnTranscript} />);

      const micButton = screen.getByRole('button', { name: /microphone/i });
      fireEvent.click(micButton);

      // Simulate error
      const errorEvent = {
        error: 'not-allowed',
        message: 'Permission denied',
      } as SpeechRecognitionErrorEvent;

      if (mockRecognition.onerror) mockRecognition.onerror(errorEvent);

      await waitFor(() => {
        expect(screen.getByText('Microphone access denied')).toBeInTheDocument();
      });
    });

    it('shows appropriate error for no speech detected', async () => {
      render(<VoiceInputPanel onTranscript={mockOnTranscript} />);

      const micButton = screen.getByRole('button', { name: /microphone/i });
      fireEvent.click(micButton);

      const errorEvent = {
        error: 'no-speech',
        message: 'No speech detected',
      } as SpeechRecognitionErrorEvent;

      if (mockRecognition.onerror) mockRecognition.onerror(errorEvent);

      await waitFor(() => {
        expect(screen.getByText('No speech detected')).toBeInTheDocument();
      });
    });

    it('disables button when microphone access is denied', async () => {
      render(<VoiceInputPanel onTranscript={mockOnTranscript} />);

      const micButton = screen.getByRole('button', { name: /microphone/i });
      fireEvent.click(micButton);

      const errorEvent = {
        error: 'not-allowed',
        message: 'Permission denied',
      } as SpeechRecognitionErrorEvent;

      if (mockRecognition.onerror) mockRecognition.onerror(errorEvent);

      await waitFor(() => {
        expect(micButton).toBeDisabled();
      });
    });
  });
});
