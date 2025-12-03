import React from 'react';
import ReactDOM from 'react-dom/client';

import App from './app/App';
import './index.css';

// Load AI SDK logger patch to prevent "m.log is not a function" errors
// This must be imported before any AI SDK code runs
import './lib/ai-sdk-logger-patch';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Could not find root element to mount to');
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
