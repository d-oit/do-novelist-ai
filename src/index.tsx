import React from 'react';
import ReactDOM from 'react-dom/client';

import App from './app/App';
import './assets/styles.css';
import './index.css';
import { addResourceHints, preloadCriticalResources } from './lib/performance';

// Load AI SDK logger patch to prevent "m.log is not a function" errors
// This must be imported before any AI SDK code runs
import './lib/ai-sdk-logger-patch';

import ErrorBoundary from './components/error-boundary';
import { UserProvider } from './contexts/UserContext';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Could not find root element to mount to');
}

// Initialize performance optimizations
addResourceHints();
preloadCriticalResources();

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <UserProvider>
        <App />
      </UserProvider>
    </ErrorBoundary>
  </React.StrictMode>,
);
