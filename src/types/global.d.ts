/**
 * Global type declarations for external libraries
 */

declare global {
  interface Window {
    Sentry?: {
      captureMessage: (
        message: string,
        options?: { level?: string; extra?: Record<string, unknown> },
      ) => void;
    };
    DD_LOGS?: {
      logger: {
        info: (message: string, context?: Record<string, unknown>) => void;
      };
    };
    LogRocket?: {
      log: (message: string, data?: Record<string, unknown>) => void;
    };
    // Web Speech API
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }

  // Web Speech API Types
  interface SpeechRecognitionEvent extends Event {
    readonly resultIndex: number;
    readonly results: SpeechRecognitionResultList;
  }

  interface SpeechRecognitionResultList {
    readonly length: number;
    item(index: number): SpeechRecognitionResult;
    [index: number]: SpeechRecognitionResult;
  }

  interface SpeechRecognitionResult {
    readonly length: number;
    readonly isFinal: boolean;
    item(index: number): SpeechRecognitionAlternative;
    [index: number]: SpeechRecognitionAlternative;
  }

  interface SpeechRecognitionAlternative {
    readonly transcript: string;
    readonly confidence: number;
  }

  interface SpeechRecognitionErrorEvent extends Event {
    readonly error:
      | 'no-speech'
      | 'aborted'
      | 'audio-capture'
      | 'network'
      | 'not-allowed'
      | 'service-not-allowed'
      | 'bad-grammar'
      | 'language-not-supported';
    readonly message: string;
  }

  class SpeechRecognition extends EventTarget {
    // Properties
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    maxAlternatives: number;

    // Event handlers
    onstart: ((this: SpeechRecognition, ev: Event) => void) | null;
    onend: ((this: SpeechRecognition, ev: Event) => void) | null;
    onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => void) | null;
    onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => void) | null;

    // Methods
    start(): void;
    stop(): void;
    abort(): void;
  }
}

export {};
