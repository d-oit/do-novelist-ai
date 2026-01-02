/**
 * VoiceInputPanel Component Tests
 */

import { render, screen, fireEvent } from '@testing-library/react';
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

  // Mock SpeechRecognition
  let mockRecognition: any;

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
    it('starts recording when microphone button is clicked', () => {
      render(<VoiceInputPanel onTranscript={mockOnTranscript} />);

      const micButton = screen.getByTestId('voice-recording-button');

      expect(micButton).toBeDefined();
      fireEvent.click(micButton);

      // Start should be called when button is clicked
      expect(mockRecognition.start).toHaveBeenCalledTimes(1);
    });

    it('stops recording when clicked again', () => {
      render(<VoiceInputPanel onTranscript={mockOnTranscript} />);

      const micButton = screen.getByTestId('voice-recording-button');

      // Start recording
      fireEvent.click(micButton);

      // Stop recording
      fireEvent.click(micButton);

      // Stop should be called
      expect(mockRecognition.stop).toHaveBeenCalledTimes(1);
    });

    it('configures recognition with correct settings', () => {
      render(<VoiceInputPanel onTranscript={mockOnTranscript} language='es-ES' continuous={false} />);

      // Settings should be applied
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
    it('displays error message on recognition error', () => {
      render(<VoiceInputPanel onTranscript={mockOnTranscript} />);

      const micButton = screen.getByTestId('voice-recording-button');
      fireEvent.click(micButton);

      // Simulate error
      const errorEvent = {
        error: 'not-allowed',
        message: 'Permission denied',
      } as SpeechRecognitionErrorEvent;

      if (mockRecognition.onerror) mockRecognition.onerror(errorEvent);

      expect(screen.getByText('Microphone access denied')).toBeInTheDocument();
    });

    it('shows appropriate error for no speech detected', () => {
      render(<VoiceInputPanel onTranscript={mockOnTranscript} />);

      const micButton = screen.getByTestId('voice-recording-button');
      fireEvent.click(micButton);

      const errorEvent = {
        error: 'no-speech',
        message: 'No speech detected',
      } as SpeechRecognitionErrorEvent;

      if (mockRecognition.onerror) mockRecognition.onerror(errorEvent);

      expect(screen.getByText('No speech detected')).toBeInTheDocument();
    });

    it('disables button when microphone access is denied', () => {
      render(<VoiceInputPanel onTranscript={mockOnTranscript} />);

      const micButton = screen.getByTestId('voice-recording-button');
      fireEvent.click(micButton);

      const errorEvent = {
        error: 'not-allowed',
        message: 'Permission denied',
      } as SpeechRecognitionErrorEvent;

      if (mockRecognition.onerror) mockRecognition.onerror(errorEvent);

      // Check that error message appears first
      expect(screen.getByText('Microphone access denied')).toBeInTheDocument();

      // Then check that button is disabled
      expect(micButton).toBeDisabled();
    });
  });
});
