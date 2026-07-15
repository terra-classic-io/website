import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import compression from 'compression';
import { createServer as createViteServer } from 'vite';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isProduction = process.env.NODE_ENV === 'production';
const PORT = process.env.PORT || 3000;
const HTML_CACHE_CONTROL = 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400';

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
        fallthrough: true
      })
    );

    logger.info('Production server started');
  }

  // Handle all other requests with SSR
  app.use('*', async (req, res, next) => {
    const url = req.originalUrl;
    
    // Skip API requests.
    if (url.startsWith('/api/')) {
      return next();
    }
    
    try {
      logger.info(`Rendering ${url} with SSR`);

      let ssrModule;
      if (!isProduction) {
        ssrModule = await vite.ssrLoadModule('/src/ssr.tsx');
      } else {
        ssrModule = await import('./dist/server/ssr.js');
      }

      const requestOrigin = `${req.protocol}://${req.get('host')}`;
      const requestUrl = new URL(req.originalUrl, requestOrigin);
      const canonicalRedirectUrl = ssrModule.getCanonicalRedirectUrl(requestUrl);
      if (canonicalRedirectUrl) {
        return res.redirect(308, canonicalRedirectUrl);
      }

      if (requestUrl.pathname === '/sitemap.xml') {
        return res
          .status(200)
          .set({
            'Content-Type': 'application/xml; charset=utf-8',
            'Cache-Control': 'public, max-age=3600, s-maxage=86400',
            'X-Content-Type-Options': 'nosniff',
          })
          .end(req.method === 'HEAD' ? undefined : ssrModule.buildSitemapXml());
      }

      if (requestUrl.pathname.includes('.')) {
        logger.warn(`Static asset not found: ${url}`);
        return res.status(404).send('Not Found');
      }

      const templatePath = path.resolve(
        __dirname,
        isProduction ? 'dist/client/index.html' : 'index.html'
      );
      let template = fs.readFileSync(templatePath, 'utf-8');
      if (!isProduction) {
        template = await vite.transformIndexHtml(url, template);
      }

      const { render } = ssrModule;
      // Render the app to string
      const { html, head, initialState } = await render(requestUrl.toString(), {
        userAgent: req.headers['user-agent'] || '' 
      });
      const { statusCode } = ssrModule.resolveSeoRoute(requestUrl.pathname);
      
      // Inject the rendered content into the template
      const responseHtml = template
        .replace('<!-- SSR_HEAD -->', head || '')
        .replace('<!-- SSR_APP -->', html || '')
        .replace('<!-- SSR_STATE -->', initialState || '{}');
      
      // Send the fully rendered page
      res
        .status(statusCode)
        .set({
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': HTML_CACHE_CONTROL,
          'X-Robots-Tag': statusCode === 404 ? 'noindex, follow' : 'index, follow',
          'X-Content-Type-Options': 'nosniff',
          'Referrer-Policy': 'strict-origin-when-cross-origin',
        })
        .end(req.method === 'HEAD' ? undefined : responseHtml);
      
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
