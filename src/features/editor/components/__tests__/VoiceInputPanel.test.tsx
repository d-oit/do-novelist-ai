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
  let mockRecognition: any;

  beforeEach(() => {
    vi.clearAllMocks();

    // Create a mock recognition instance that will be returned by the constructor
    const mockInstance = {
      start: vi.fn(),
      stop: vi.fn(),
      abort: vi.fn(),
      onstart: null as ((event: Event) => void) | null,
      onend: null as ((event: Event) => void) | null,
      onerror: null as ((event: SpeechRecognitionErrorEvent) => void) | null,
      onresult: null as ((event: SpeechRecognitionEvent) => void) | null,
    };

    // Store the mock instance so we can access it in tests
    (global as any).__mockRecognitionInstance = mockInstance;
    mockRecognition = mockInstance;

    // Mock SpeechRecognition constructor
    const MockSpeechRecognition = vi.fn().mockImplementation(function (this: any) {
      // Return the mock instance
      return mockInstance;
    });

    (window as any).SpeechRecognition = MockSpeechRecognition as any;
    (window as any).webkitSpeechRecognition = MockSpeechRecognition as any;
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

      expect(screen.getByText('Voice Input')).toBeInTheDocument();
      expect(screen.queryByText('Voice input not supported')).not.toBeInTheDocument();
    });
  });

  describe('Recording Controls', () => {
    it('starts recording when microphone button is clicked', () => {
      render(<VoiceInputPanel onTranscript={mockOnTranscript} />);

      const micButton = screen.getByTestId('voice-recording-button');

      expect(micButton).toBeDefined();
      fireEvent.click(micButton);

      const mockInstance = (global as any).__mockRecognitionInstance;
      expect(mockInstance.start).toHaveBeenCalledTimes(1);
    });

    it('stops recording when clicked again', async () => {
      render(<VoiceInputPanel onTranscript={mockOnTranscript} />);

      const micButton = screen.getByTestId('voice-recording-button');

      // Start recording
      fireEvent.click(micButton);

      // Trigger onstart callback to update isRecording state
      if (mockRecognition.onstart) {
        mockRecognition.onstart(new Event('start'));
      }

      // Wait for state update
      await waitFor(() => {
        expect(screen.getByText('Listening...')).toBeInTheDocument();
      });

      // Stop recording
      fireEvent.click(micButton);

      expect(mockRecognition.stop).toHaveBeenCalled();
    });

    it('shows listening state when recording', async () => {
      render(<VoiceInputPanel onTranscript={mockOnTranscript} />);

      const micButton = screen.getByTestId('voice-recording-button');

      fireEvent.click(micButton);

      // Trigger onstart callback
      if (mockRecognition.onstart) {
        mockRecognition.onstart(new Event('start'));
      }

      await waitFor(() => {
        expect(screen.getByText('Listening...')).toBeInTheDocument();
      });

      expect(screen.getByText(/Say "Stop" to end recording/)).toBeInTheDocument();
    });

    it('configures recognition with correct settings', () => {
      render(<VoiceInputPanel onTranscript={mockOnTranscript} language='es-ES' continuous={false} />);

      expect(mockRecognition.lang).toBe('es-ES');
      expect(mockRecognition.continuous).toBe(false);
      expect(mockRecognition.interimResults).toBe(true);
      expect(mockRecognition.maxAlternatives).toBe(1);
    });
  });

  describe('Voice Commands', () => {
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

      const micButton = screen.getByTestId('voice-recording-button');
      fireEvent.click(micButton);

      // Simulate error
      const errorEvent = {
        error: 'not-allowed',
        message: 'Permission denied',
      } as SpeechRecognitionErrorEvent;

      if (mockRecognition.onerror) {
        mockRecognition.onerror(errorEvent);
      }

      await waitFor(() => {
        expect(screen.getByText('Microphone access denied')).toBeInTheDocument();
      });
    });

    it('shows appropriate error for no speech detected', async () => {
      render(<VoiceInputPanel onTranscript={mockOnTranscript} />);

      const micButton = screen.getByTestId('voice-recording-button');
      fireEvent.click(micButton);

      const errorEvent = {
        error: 'no-speech',
        message: 'No speech detected',
      } as SpeechRecognitionErrorEvent;

      if (mockRecognition.onerror) {
        mockRecognition.onerror(errorEvent);
      }

      await waitFor(() => {
        expect(screen.getByText('No speech detected')).toBeInTheDocument();
      });
    });

    it('disables button when microphone access is denied', async () => {
      render(<VoiceInputPanel onTranscript={mockOnTranscript} />);

      const micButton = screen.getByTestId('voice-recording-button');
      fireEvent.click(micButton);

      const errorEvent = {
        error: 'not-allowed',
        message: 'Permission denied',
      } as SpeechRecognitionErrorEvent;

      if (mockRecognition.onerror) {
        mockRecognition.onerror(errorEvent);
      }

      // Check that error message appears first
      await waitFor(() => {
        expect(screen.getByText('Microphone access denied')).toBeInTheDocument();
      });

      // Then check that button is disabled
      expect(micButton).toBeDisabled();
    });
  });
});
