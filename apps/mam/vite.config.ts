import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { federation } from '@module-federation/vite';
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js';

export default defineConfig({
  base: 'http://localhost:3004/',
  plugins: [
    cssInjectedByJsPlugin(),
    react(),
    tailwindcss(),
    federation({
      name: 'mam',
      filename: 'remoteEntry.js',
      exposes: {
        './App': './src/App.tsx',
      },
      shared: {
        react: { singleton: true, requiredVersion: false, eager: true },
        'react-dom': { singleton: true, requiredVersion: false, eager: true },
        'react/jsx-runtime': { singleton: true, requiredVersion: false, eager: true },
        'react-router-dom': { singleton: true, requiredVersion: false },
      },
    }),
  ],
  server: {
    port: 3004,
    cors: true,
  },
  preview: {
    port: 3004,
    cors: true,
  },
  build: {
    target: 'esnext',
    minify: false,
    cssCodeSplit: false,
  },
});
