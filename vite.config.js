import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(({ command, mode }) => {
  const isPages = process.env.CF_PAGES_BUILD === 'true';
  const ssrTarget = process.env.SSR_TARGET || 'node';
  const isSSRBuild = !!process.env.SSR_TARGET; // set by our scripts when running --ssr builds

  const base = {
    plugins: [react()],
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
      // Avoid bundling DOM-heavy markdown libs; React.lazy ensures they aren't needed during SSR
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