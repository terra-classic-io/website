import React from 'react';
import { hydrateRoot } from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { ThemeProvider } from './contexts/ThemeContext';
import './index.css';

// Define the shape of our application state
type TokenInfo = {
  price: string;
  change: string;
  isPositive: boolean;
};

type AppState = {
  tokens: {
    LUNC: TokenInfo;
    USTC: TokenInfo;
  };
  staking: {
    apr: string;
  };
  isMobile: boolean;
};

// Get the initial state from the server-rendered window object
const getInitialState = (): AppState => {
  try {
    // Check for the state in the window object (set by the server)
    if (window.__INITIAL_STATE__) {
      return window.__INITIAL_STATE__ as AppState;
    }
    
    // Fallback to default state if not found
    return {
      tokens: {
        LUNC: {
          price: '$0.00023',
          change: '+5.6%',
          isPositive: true,
        },
        USTC: {
          price: '$0.016',
          change: '+2.3%',
          isPositive: true,
        },
      },
      staking: {
        apr: '7.01%',
      },
      isMobile: /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent),
    };
  } catch (error) {
    console.error('Error parsing initial state:', error);
    // Return a safe default state if parsing fails
    return {
      tokens: {
        LUNC: {
          price: '$0.00023',
          change: '+0.0%',
          isPositive: true,
        },
        USTC: {
          price: '$0.016',
          change: '+0.0%',
          isPositive: true,
        },
      },
      staking: {
        apr: '0.00%',
      },
      isMobile: false,
    };
  }
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
  
  // Only declare process if it doesn't exist
  interface ImportMetaEnv {
    MODE: 'development' | 'production';
    DEV: boolean;
    PROD: boolean;
    SSR: boolean;
  }
  
  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
}