import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

console.log('[System] Initializing React...');

const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error('[Fatal] Root element not found!');
} else {
  try {
    createRoot(rootElement).render(
      <StrictMode>
        <App />
      </StrictMode>,
    );
    console.log('[System] Render pipeline started.');
  } catch (error) {
    console.error('[System] Failed to mount application:', error);
    rootElement.innerHTML = `
      <div style="height: 100vh; display: flex; align-items: center; justify-content: center; background: #09090b; color: #ef4444; font-family: sans-serif; text-align: center; padding: 20px;">
        <div>
          <h1 style="font-size: 24px; margin-bottom: 16px;">Initialization Error</h1>
          <p style="color: #a1a1aa; margin-bottom: 24px; font-size: 14px;">${error instanceof Error ? error.message : 'Unknown error'}</p>
          <button onclick="window.location.reload()" style="background: #ef4444; color: white; border: none; padding: 10px 20px; border-radius: 8px; font-weight: bold; cursor: pointer;">Retry Application</button>
        </div>
      </div>
    `;
  }
}
