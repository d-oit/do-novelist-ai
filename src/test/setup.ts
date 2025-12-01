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

const mockIDBRequest = () => {
  const request: any = {
    result: null,
    error: null,
    onsuccess: null,
    onerror: null,
  };
  return request;
};

const mockObjectStore = {
  get: vi.fn(() => mockIDBRequest()),
  put: vi.fn(() => mockIDBRequest()),
  add: vi.fn(() => mockIDBRequest()),
  delete: vi.fn(() => mockIDBRequest()),
  clear: vi.fn(() => mockIDBRequest()),
  getAll: vi.fn(() => mockIDBRequest()),
  createIndex: vi.fn(),
  index: vi.fn(() => ({
    get: vi.fn(() => mockIDBRequest()),
    getAll: vi.fn(() => mockIDBRequest()),
  })),
};

const mockTransaction = {
  objectStore: vi.fn(() => mockObjectStore),
  oncomplete: null,
  onerror: null,
  onabort: null,
};

const mockDatabase = {
  createObjectStore: vi.fn(() => mockObjectStore),
  transaction: vi.fn(() => mockTransaction),
  close: vi.fn(),
};

global.indexedDB = {
  open: vi.fn(() => {
    const request: any = mockIDBRequest();
    request.result = mockDatabase;
    setTimeout(() => {
      if (request.onsuccess) request.onsuccess({ target: { result: mockDatabase } });
    }, 0);
    return request;
  }),
  deleteDatabase: vi.fn(() => mockIDBRequest()),
} as any;

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
