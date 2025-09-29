import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import compression from 'compression';
import { createServer as createViteServer } from 'vite';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isProduction = process.env.NODE_ENV === 'production';
const PORT = process.env.PORT || 3000;

// Create a simple logger
const logger = {
  info: (message) => console.log(`[${new Date().toISOString()}] ${message}`),
  error: (message) => console.error(`[${new Date().toISOString()}] ERROR: ${message}`),
  warn: (message) => console.warn(`[${new Date().toISOString()}] WARN: ${message}`)
};

async function createServer() {
  const app = express();
  
  // Use compression middleware
  app.use(compression());
  
  let vite;
  if (!isProduction) {
    logger.info('Starting development server...');
    
    // In development: Create Vite dev server with HMR
    try {
      vite = await createViteServer({
        server: { middlewareMode: 'ssr' },
        appType: 'custom',
        logLevel: 'info',
      });

      // Use vite's connect instance as middleware
      app.use(vite.middlewares);
      
      // Serve static files in development
      app.use(express.static('public'));
      
      logger.info('Development server started with HMR');
    } catch (err) {
      logger.error('Failed to start Vite dev server:');
      console.error(err);
      process.exit(1);
    }
  } else {
    logger.info('Starting production server...');
    
    // In production: Serve built client assets
    app.use(
      express.static(path.join(__dirname, 'dist/client'), {
        index: false, // Don't serve index.html for all routes
        maxAge: '1y',
        etag: true,
        lastModified: true,
        fallthrough: false // Don't fall through to the next middleware
      })
    );
    
    // Serve index.html for all other routes (client-side routing)
    app.use('*', (req, res, next) => {
      res.sendFile(path.join(__dirname, 'dist/client/index.html'));
    });
    
    logger.info('Production server started');
  }

  // Handle all other requests with SSR
  app.use('*', async (req, res, next) => {
    const url = req.originalUrl;
    
    // Skip API requests and static files
    if (url.startsWith('/api/')) {
      return next();
    }

    if (url.includes('.')) {
      if (!res.headersSent) {
        logger.warn(`Static asset not found: ${url}`);
        res.status(404).send('Not Found');
      }
      return;
    }
    
    try {
      logger.info(`Rendering ${url} with SSR`);
      
      // Read the template file
      let template = fs.readFileSync(
        path.resolve(__dirname, 'index.html'), 
        'utf-8'
      );
      
      let render;
      if (!isProduction) {
        // In development: Apply Vite HTML transforms and load module
        template = await vite.transformIndexHtml(url, template);
        ({ render } = await vite.ssrLoadModule('/src/ssr.jsx'));
      } else {
        // In production: Load the built SSR module
        ({ render } = await import('./dist/server/ssr.js'));
      }
      
      // Render the app to string
      const { html, head, initialState } = await render(url, { 
        userAgent: req.headers['user-agent'] || '' 
      });
      
      // Inject the rendered content into the template
      const responseHtml = template
        .replace('<!-- SSR_HEAD -->', head || '')
        .replace('<!-- SSR_APP -->', html || '')
        .replace('<!-- SSR_STATE -->', 
          `<script>window.__INITIAL_STATE__ = ${JSON.stringify(initialState || {}).replace(/</g, '\\u003c')}</script>`
        );
      
      // Send the fully rendered page
      res.status(200).set({ 'Content-Type': 'text/html' }).end(responseHtml);
      
    } catch (e) {
      // If an error is caught, let vite fix the stack trace for dev
      if (!isProduction && vite) {
        vite.ssrFixStacktrace(e);
      }
      
      logger.error(`Error rendering ${url}:`);
      console.error(e);
      
      // Try to fall back to client-side rendering
      if (!res.headersSent) {
        try {
          const template = fs.readFileSync(
            path.resolve(__dirname, isProduction ? 'dist/client/index.html' : 'index.html'), 
            'utf-8'
          );
          res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
        } catch (err) {
          res.status(500).end('Internal Server Error');
        }
      }
    }
  });

  // Fallback 404 handler for requests not captured above
  app.use((req, res, next) => {
    if (!res.headersSent) {
      res.status(404).send('Not Found');
    }
  });

  // Error handling middleware
  app.use((err, req, res, next) => {
    logger.error('Unhandled error:');
    console.error(err);
    
    if (!res.headersSent) {
      res.status(500).send('Internal Server Error');
    }
  });

  // Start the server
  const server = app.listen(PORT, '0.0.0.0', () => {
    const address = server.address();
    const url = typeof address === 'string' 
      ? address 
      : `http://localhost:${address.port}`;
      
    logger.info(`Server listening on ${url}`);
    logger.info(`Environment: ${isProduction ? 'production' : 'development'}`);
  });

  // Handle server errors
  server.on('error', (err) => {
    if (err.syscall !== 'listen') {
      throw err;
    }

    const bind = typeof PORT === 'string' ? 'Pipe ' + PORT : 'Port ' + PORT;

    // Handle specific listen errors with friendly messages
    switch (err.code) {
      case 'EACCES':
        logger.error(bind + ' requires elevated privileges');
        process.exit(1);
        break;
      case 'EADDRINUSE':
        logger.error(bind + ' is already in use');
        process.exit(1);
        break;
      default:
        throw err;
    }
  });

  // Handle server shutdown gracefully
  const shutdown = (signal) => {
    logger.info(`${signal} received: Shutting down server...`);
    
    server.close((err) => {
      if (err) {
        logger.error('Error during server shutdown:');
        console.error(err);
        process.exit(1);
      }
      
      logger.info('Server stopped');
      process.exit(0);
    });
    
    // Force close after 5 seconds
    setTimeout(() => {
      logger.warn('Forcing server shutdown...');
      process.exit(1);
    }, 5000);
  };

  // Handle signals
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
  
  // Handle uncaught exceptions
  process.on('uncaughtException', (err) => {
    logger.error('Uncaught Exception:');
    console.error(err);
    shutdown('uncaughtException');
  });
  
  // Handle unhandled promise rejections
  process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at:');
    console.error(promise);
    logger.error('Reason:');
    console.error(reason);
    // Don't shut down for unhandled rejections to keep the server running
  });
}

// Start the server
createServer().catch((err) => {
  logger.error('Failed to start server:');
  console.error(err);
  process.exit(1);
});