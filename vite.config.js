import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

const hyperlaneValidatorApi = () => {
  let snapshotCache;
  const cacheDurationMs = 60_000;

  return {
    name: 'hyperlane-validator-api',
    configureServer(server) {
      server.middlewares.use(async (request, response, next) => {
        const pathname = new URL(request.url || '/', 'http://localhost').pathname;
        if (pathname === '/api/hyperlane/governance') {
          if (request.method !== 'GET') {
            response.statusCode = 405;
            response.setHeader('Allow', 'GET');
            response.end('Method Not Allowed');
            return;
          }
          try {
            const { getHyperlaneGovernanceSnapshot } = await server.ssrLoadModule('/src/lib/hyperlane-governance-status.ts');
            const snapshot = await getHyperlaneGovernanceSnapshot({ safeApiKey: process.env.SAFE_API_KEY });
            response.setHeader('Content-Type', 'application/json; charset=utf-8');
            response.setHeader('Cache-Control', 'public, max-age=30');
            response.end(JSON.stringify(snapshot));
          } catch {
            response.statusCode = 502;
            response.setHeader('Content-Type', 'application/json; charset=utf-8');
            response.end(JSON.stringify({ error: 'Hyperlane governance sources are unavailable.' }));
          }
          return;
        }
        if (pathname !== '/api/hyperlane/validators') {
          next();
          return;
        }
        if (request.method !== 'GET') {
          response.statusCode = 405;
          response.setHeader('Allow', 'GET');
          response.end('Method Not Allowed');
          return;
        }

        try {
          const now = Date.now();
          if (!snapshotCache || now - snapshotCache.cachedAt >= cacheDurationMs) {
            const { loadHyperlaneValidatorSnapshot } = await server.ssrLoadModule('/src/lib/hyperlane-validator-status.ts');
            snapshotCache = {
              cachedAt: now,
              snapshot: await loadHyperlaneValidatorSnapshot(),
            };
          }

          response.statusCode = 200;
          response.setHeader('Content-Type', 'application/json; charset=utf-8');
          response.setHeader('Cache-Control', 'public, max-age=30');
          response.end(JSON.stringify(snapshotCache.snapshot));
        } catch (error) {
          server.config.logger.error(`Unable to load Hyperlane validator status: ${error instanceof Error ? error.message : String(error)}`);
          response.statusCode = 502;
          response.setHeader('Content-Type', 'application/json; charset=utf-8');
          response.end(JSON.stringify({ error: 'Hyperlane validator status is temporarily unavailable.' }));
        }
      });
    },
  };
};

export default defineConfig(({ command, mode }) => {
  const isPages = process.env.CF_PAGES_BUILD === 'true';
  const ssrTarget = process.env.SSR_TARGET || 'node';
  const isSSRBuild = !!process.env.SSR_TARGET; // set by our scripts when running --ssr builds

  const base = {
    plugins: [react(), hyperlaneValidatorApi()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        'react-helmet-async': 'react-helmet-async',
      },
    },
    define: {
      __SSR_TARGET__: JSON.stringify(ssrTarget),
    },
    ssr: {
      noExternal: ['react-helmet-async'],
    },
    server: { port: 3000 },
    preview: { port: 3001 },
  };

  // Client build (first stage)
  const clientConfig = {
    ...base,
    build: {
      outDir: isPages ? 'dist' : 'dist/client',
      emptyOutDir: true,
      rollupOptions: {
        output: {
          manualChunks: {
            react: ['react', 'react-dom', 'react-router-dom'],
            vendor: ['lucide-react'],
          },
        },
      },
      commonjsOptions: {
        transformMixedEsModules: true,
        esmExternals: true,
      },
    },
  };

  // SSR build for Cloudflare Pages: produce dist/_worker.js
  const pagesSsrConfig = {
    ...base,
    ssr: {
      // Avoid bundling DOM-heavy markdown libs; route metadata remains server-rendered in App.
      noExternal: true,
      external: [
        'react-markdown',
        'remark-gfm',
        // Exclude browser-only feature routes/components; SSR will render Suspense fallback.
        './src/components/project-map/project-map-page.tsx',
        './src/components/project-map/project-map.tsx',
        // D3 libs reference document at module init; keep them out of worker bundle.
        'd3-selection',
        'd3-zoom',
      ],
      target: 'webworker',
    },
    build: {
      outDir: 'dist',
      emptyOutDir: false, // keep client assets
      rollupOptions: {
        output: {
          entryFileNames: '_worker.js',
          format: 'es',
        },
      },
      commonjsOptions: {
        transformMixedEsModules: true,
        esmExternals: true,
      },
    },
  };

  // SSR build for Node (local server.js)
  const nodeSsrConfig = {
    ...base,
    ssr: {
      noExternal: ['react-helmet-async'],
      target: 'node',
    },
    build: {
      outDir: 'dist/server',
      emptyOutDir: false,
      rollupOptions: {
        output: {
          entryFileNames: 'ssr.js',
          format: 'es',
        },
      },
      commonjsOptions: {
        transformMixedEsModules: true,
      },
    },
  };

  // Return the correct config based on the build type
  if (isSSRBuild && isPages && ssrTarget === 'webworker') {
    return pagesSsrConfig;
  }
  if (isSSRBuild && ssrTarget !== 'webworker') {
    return nodeSsrConfig;
  }
  return clientConfig;
});
