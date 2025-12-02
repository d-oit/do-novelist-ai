import React from 'react';
import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

afterEach(() => {
  cleanup();
});

vi.mock('framer-motion', () => {
  const createMotionComponent = (elementType: string) => {
    return ({ children, ...props }: any) => {
      // Filter out Framer Motion specific props that cause React warnings
      const {
        whileHover,
        whileTap,
        whileFocus,
        whileInView,
        initial,
        animate,
        exit,
        transition,
        variants,
        layout,
        layoutId,
        drag,
        dragConstraints,
        dragElastic,
        onDragStart,
        onDrag,
        onDragEnd,
        ...domProps
      } = props;

      return React.createElement(elementType, domProps, children);
    };
  };

  return {
    motion: {
      div: createMotionComponent('div'),
      button: createMotionComponent('button'),
      a: createMotionComponent('a'),
      span: createMotionComponent('span'),
      section: createMotionComponent('section'),
      article: createMotionComponent('article'),
      header: createMotionComponent('header'),
      nav: createMotionComponent('nav'),
      h1: createMotionComponent('h1'),
      h2: createMotionComponent('h2'),
      h3: createMotionComponent('h3'),
      h4: createMotionComponent('h4'),
      h5: createMotionComponent('h5'),
      h6: createMotionComponent('h6'),
      p: createMotionComponent('p'),
      ul: createMotionComponent('ul'),
      li: createMotionComponent('li'),
      ol: createMotionComponent('ol'),
      blockquote: createMotionComponent('blockquote'),
      code: createMotionComponent('code'),
      pre: createMotionComponent('pre'),
      img: createMotionComponent('img'),
      video: createMotionComponent('video'),
      audio: createMotionComponent('audio'),
      iframe: createMotionComponent('iframe'),
      canvas: createMotionComponent('canvas'),
      svg: createMotionComponent('svg'),
      path: createMotionComponent('path'),
      circle: createMotionComponent('circle'),
      rect: createMotionComponent('rect'),
      line: createMotionComponent('line'),
      polyline: createMotionComponent('polyline'),
      polygon: createMotionComponent('polygon'),
      text: createMotionComponent('text'),
      g: createMotionComponent('g'),
      defs: createMotionComponent('defs'),
      linearGradient: createMotionComponent('linearGradient'),
      radialGradient: createMotionComponent('radialGradient'),
      stop: createMotionComponent('stop'),
      clipPath: createMotionComponent('clipPath'),
      mask: createMotionComponent('mask'),
      pattern: createMotionComponent('pattern'),
      filter: createMotionComponent('filter'),
      feBlend: createMotionComponent('feBlend'),
      feColorMatrix: createMotionComponent('feColorMatrix'),
      feComponentTransfer: createMotionComponent('feComponentTransfer'),
      feComposite: createMotionComponent('feComposite'),
      feConvolveMatrix: createMotionComponent('feConvolveMatrix'),
      feDiffuseLighting: createMotionComponent('feDiffuseLighting'),
      feDisplacementMap: createMotionComponent('feDisplacementMap'),
      feFlood: createMotionComponent('feFlood'),
      feGaussianBlur: createMotionComponent('feGaussianBlur'),
      feImage: createMotionComponent('feImage'),
      feMerge: createMotionComponent('feMerge'),
      feMergeNode: createMotionComponent('feMergeNode'),
      feMorphology: createMotionComponent('feMorphology'),
      feOffset: createMotionComponent('feOffset'),
      feSpecularLighting: createMotionComponent('feSpecularLighting'),
      feTile: createMotionComponent('feTile'),
      feTurbulence: createMotionComponent('feTurbulence'),
    },
    AnimatePresence: ({ children }: any) => children,
  };
});

global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  takeRecords() {
    return [];
  }
  unobserve() {}
} as any;

// Enhanced IndexedDB mock that works reliably with async operations
const createIndexedDBMock = () => {
  // In-memory storage for all test instances
  const mockStorage = {
    versions: [] as any[],
    branches: [] as any[],
  };

  const mockIDBRequest = (result: any = null) => {
    const request: any = {
      result,
      error: null,
      onsuccess: null as ((event: any) => void) | null,
      onerror: null as ((event: any) => void) | null,
      onupgradeneeded: null as ((event: any) => void) | null,
    };
    return request;
  };

  const mockObjectStore = {
    get: vi.fn().mockImplementation((id: string) => {
      const version = mockStorage.versions.find((v: any) => v.id === id);
      const request = mockIDBRequest(version || null);
      setTimeout(() => {
        if (request.onsuccess) request.onsuccess({ target: request });
      }, 0);
      return request;
    }),
    put: vi.fn(() => mockIDBRequest()),
    add: vi.fn().mockImplementation((data: any) => {
      if (data?.id && data.chapterId) {
        mockStorage.versions.push(data);
      }
      const request = mockIDBRequest(data);
      setTimeout(() => {
        if (request.onsuccess) request.onsuccess({ target: request });
      }, 0);
      return request;
    }),
    delete: vi.fn().mockImplementation((id: string) => {
      const index = mockStorage.versions.findIndex((v: any) => v.id === id);
      if (index >= 0) {
        mockStorage.versions.splice(index, 1);
      }
      const request = mockIDBRequest(undefined);
      setTimeout(() => {
        if (request.onsuccess) request.onsuccess({ target: request });
      }, 0);
      return request;
    }),
    clear: vi.fn(() => mockIDBRequest()),
    getAll: vi.fn().mockImplementation((query?: any) => {
      let results = mockStorage.versions;
      if (query) {
        results = mockStorage.versions.filter((v: any) => v.chapterId === query);
      }
      const request = mockIDBRequest(results);
      setTimeout(() => {
        if (request.onsuccess) request.onsuccess({ target: request });
      }, 0);
      return request;
    }),
    createIndex: vi.fn(),
    index: vi.fn().mockReturnValue({
      get: vi.fn(() => mockIDBRequest()),
      getAll: vi.fn().mockImplementation((chapterId: string) => {
        const results = mockStorage.versions.filter((v: any) => v.chapterId === chapterId);
        const request = mockIDBRequest(results);
        setTimeout(() => {
          if (request.onsuccess) request.onsuccess({ target: request });
        }, 0);
        return request;
      }),
    }),
  };

  const mockTransaction = {
    objectStore: vi.fn().mockReturnValue(mockObjectStore),
    oncomplete: null,
    onerror: null,
    onabort: null,
  };

  const mockDatabase = {
    createObjectStore: vi.fn().mockReturnValue(mockObjectStore),
    transaction: vi.fn().mockReturnValue(mockTransaction),
    close: vi.fn(),
    objectStoreNames: {
      contains: vi.fn().mockReturnValue(false),
    },
  };

  global.indexedDB = {
    open: vi.fn().mockImplementation((_name: string, _version: number) => {
      const request = mockIDBRequest(mockDatabase);

      // Simulate async success to allow callbacks to be set
      setTimeout(() => {
        if (request.onupgradeneeded) {
          request.onupgradeneeded({ target: { result: mockDatabase } });
        }
        if (request.onsuccess) {
          request.onsuccess({ target: request });
        }
      }, 0);

      return request;
    }),
    deleteDatabase: vi.fn(() => mockIDBRequest()),
  } as any;
};

// Set up the enhanced IndexedDB mock
createIndexedDBMock();

const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock AI SDK completely to prevent any real AI SDK initialization in tests
vi.mock('ai', () => ({
  generateText: vi.fn().mockResolvedValue({ text: 'Mock AI response' }),
  streamText: vi.fn().mockResolvedValue({ text: 'Mock AI response' }),
  createOpenAI: vi.fn(() => (model: string) => ({ model, provider: 'openai' })),
  createAnthropic: vi.fn(() => (model: string) => ({ model, provider: 'anthropic' })),
  createGoogleGenerativeAI: vi.fn(() => (model: string) => ({ model, provider: 'google' })),
}));

// Mock AI SDK provider packages
vi.mock('@ai-sdk/openai', () => ({
  createOpenAI: vi.fn(() => (model: string) => ({ model, provider: 'openai' })),
}));

vi.mock('@ai-sdk/anthropic', () => ({
  createAnthropic: vi.fn(() => (model: string) => ({ model, provider: 'anthropic' })),
}));

vi.mock('@ai-sdk/google', () => ({
  createGoogleGenerativeAI: vi.fn(() => (model: string) => ({ model, provider: 'google' })),
}));
