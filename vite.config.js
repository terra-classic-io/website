import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      // Use ESM version of react-helmet-async
      'react-helmet-async': 'react-helmet-async',
    },
  },
  ssr: {
    // Externalize node_modules except react-helmet-async
    noExternal: ['react-helmet-async'],
  },
  build: {
    outDir: 'dist/client',
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
      // Ensure proper handling of CommonJS modules
      transformMixedEsModules: true,
      // Handle named exports from CommonJS modules
      esmExternals: true,
    },
  },
  server: {
    port: 3000,
  },
  preview: {
    port: 3001,
  },
}));