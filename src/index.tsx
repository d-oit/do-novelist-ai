import React from 'react';
import ReactDOM from 'react-dom/client';

import App from '@/app/App';
import './index.css';
import { addResourceHints, preloadCriticalResources } from '@/performance';

// Load AI SDK logger patch to prevent "m.log is not a function" errors
// This must be imported before any AI SDK code runs
import './lib/ai-sdk-logger-patch';

import ErrorBoundary from '@/components/error-boundary';
import { UserProvider } from '@/contexts/UserContext';
import { validateEnvironment } from '@/lib/env-validation';

// Environment validation at startup
const envValidation = validateEnvironment();

if (!envValidation.success) {
  console.error('❌ Environment validation failed:', envValidation.errors);

  const root = document.getElementById('root');
  if (root) {
    root.innerHTML = `
      <div style="padding: 2rem; font-family: system-ui; max-width: 800px; margin: 2rem auto;">
        <h1 style="color: #dc2626;">⚠️ Configuration Error</h1>
        <p>The application cannot start due to missing or invalid environment configuration:</p>
        <ul style="color: #dc2626;">
          ${envValidation.errors?.map(e => `<li><strong>${e.path}</strong>: ${e.message}</li>`).join('')}
        </ul>
        <p>Please check your <code>.env</code> file and ensure all required variables are set.</p>
      </div>
    `;
  }

  throw new Error('Environment validation failed');
}

console.log('✅ Environment validation passed');

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
