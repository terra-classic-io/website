import React from 'react';
import { hydrateRoot } from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';
import { BrowserRouter } from 'react-router-dom';
import App, { DEFAULT_STATE, type AppState } from './App';
import { ThemeProvider } from './contexts/ThemeContext';
import './index.css';

// Get the initial state injected by the server into the
// <script id="__INITIAL_STATE__" type="application/json"> block
const getInitialState = (): AppState => {
  const stateElement = document.getElementById('__INITIAL_STATE__');
  const stateJson = stateElement instanceof HTMLScriptElement
    ? stateElement.textContent?.trim()
    : undefined;

  // Without SSR, the template marker is still present and is not JSON.
  if (stateJson && stateJson !== '<!-- SSR_STATE -->') {
    try {
      const state: unknown = JSON.parse(stateJson);
      if (state && typeof state === 'object' && !Array.isArray(state)) {
        return state as AppState;
      }
    } catch (error) {
      console.error('Error parsing initial state:', error);
    }
  }

  // Preserve the legacy global, but ignore elements exposed by their HTML id.
  const legacyState = window.__INITIAL_STATE__;
  if (legacyState && !(legacyState instanceof Element)) {
    return legacyState;
  }

  return DEFAULT_STATE;
};

// Get the root element
const container = document.getElementById('root');

if (!container) {
  console.error('Failed to find the root element');
} else {
  // Get the initial state
  const initialState = getInitialState();
  
  // Client-side hydration
  hydrateRoot(
    document.getElementById('root')!,
    <React.StrictMode>
      <HelmetProvider>
        <BrowserRouter>
          <ThemeProvider>
            <App initialState={initialState} />
          </ThemeProvider>
        </BrowserRouter>
      </HelmetProvider>
    </React.StrictMode>
  );
  
  // Mark that hydration is complete
  window.__HYDRATED = true;
}

// Extend the Window interface to include our custom properties
declare global {
  interface Window {
    __INITIAL_STATE__?: AppState;
    __HYDRATED?: boolean;
  }

  // For Vite environment variables
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: 'development' | 'production' | 'test';
    }
  }
  
}
