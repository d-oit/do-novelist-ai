import '@testing-library/jest-dom';
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

afterEach(() => {
  cleanup();
});

vi.mock('framer-motion', () => ({
  motion: {
    div: 'div',
    button: 'button',
    a: 'a',
    span: 'span',
    section: 'section',
    article: 'article',
    header: 'header',
    nav: 'nav',
  },
  AnimatePresence: ({ children }: any) => children,
}));

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
