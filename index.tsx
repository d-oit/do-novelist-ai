import React from 'react';
import ReactDOM from 'react-dom/client';

import './src/index.css';
import './src/assets/styles.css';
import App from './src/App';
import ErrorBoundary from './src/components/error-boundary';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Could not find root element to mount to');
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
);
