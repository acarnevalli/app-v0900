import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

const originalCharAt = String.prototype.charAt;

String.prototype.charAt = function(index: number) {
  if (this === null || this === undefined) {
    console.error('charAt called on null/undefined:', new Error().stack);
    return '';
  }
  
  try {
    return originalCharAt.call(this, index);
  } catch (error) {
    console.error('charAt error:', error, 'String:', this, 'Index:', index);
    return '';
  }
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
