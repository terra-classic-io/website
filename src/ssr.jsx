import React from 'react';
import ReactDOMServer from 'react-dom/server';
// Import HelmetProvider directly
import { HelmetProvider } from 'react-helmet-async';
import { StaticRouter } from 'react-router-dom/server';
import App from './App';
import { DEFAULT_STATE } from './App';

// Create initial state that will be used for both server and client
function createInitialState(userAgent = '') {
  const isMobile = userAgent 
    ? /Android|BlackBerry|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(userAgent) 
    : false;
  
  return {
    ...DEFAULT_STATE,
    isMobile,
  };
}

/**
 * Render the app for server-side rendering
 * @param {string} url - The URL to render
 * @param {Object} options - Options for rendering
 * @param {string} [options.userAgent] - The user agent string for device detection
 * @returns {Promise<{html: string, head: string, initialState: string}>}
 */
export async function render(url, { userAgent } = {}) {
  const helmetContext = {};
  const routerContext = {};
  const { pathname } = new URL(url, 'http://localhost');
  const initialState = createInitialState(userAgent);
  
  // Ensure consistent token prices between server and client
  const fixedTokenPrices = {
    LUNC: { ...initialState.tokens?.LUNC },
    USTC: { ...initialState.tokens?.USTC },
  };
  
  // Create the final initial state with fixed prices
  const finalInitialState = {
    ...initialState,
    tokens: fixedTokenPrices,
  };
  
  try {
    // Render the app to string
    const appHtml = ReactDOMServer.renderToString(
      <HelmetProvider context={helmetContext}>
        <StaticRouter location={pathname} context={routerContext}>
          <App initialState={finalInitialState} />
        </StaticRouter>
      </HelmetProvider>
    );
    
    // Extract head content from Helmet
    const { helmet } = helmetContext;
    const head = [
      helmet?.title?.toString(),
      helmet?.meta?.toString(),
      helmet?.link?.toString(),
      helmet?.script?.toString(),
      helmet?.style?.toString(),
      helmet?.noscript?.toString()
    ].filter(Boolean).join('\n');
    
    // Return the rendered HTML, head content, and serialized initial state
    return {
      html: appHtml,
      head,
      initialState: JSON.stringify(finalInitialState).replace(/</g, '\\u003c')
    };
    
  } catch (error) {
    console.error('Error during SSR rendering:', error);
    throw error;
  }
}