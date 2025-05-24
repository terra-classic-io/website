import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    ssr: true,
    ssrEmitAssets: false, // Don't emit assets in SSR build
    outDir: 'dist/server',
    emptyOutDir: false, // Don't delete dist/client
    rollupOptions: {
      input: 'src/ssr.jsx',
      output: {
        format: 'esm', // Use ES modules for better tree-shaking
        entryFileNames: 'ssr.js',
      },
    },
    commonjsOptions: {
      transformMixedEsModules: true,
      esmExternals: true,
    },
  },
  ssr: {
    // Ensure these dependencies are externalized
    noExternal: ['react-helmet-async'],
    target: 'node',
  },
  optimizeDeps: {
    include: ['react-helmet-async'],
  },
});