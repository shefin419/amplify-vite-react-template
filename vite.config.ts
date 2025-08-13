// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
       devOptions: {
        enabled: true, // For testing PWA in dev
      },
      includeAssets: ['favicon.ico', 'robots.txt', 'fblogo2502.png', 'LivenessIcon16.png', 'LivenessIcon32.png', 'maskable_icon_x48.png','offline.html'],
      manifest: {
        name: 'My Face Reko App',
        short_name: 'FaceReko',
        description: 'Secure and efficient face recognition and liveness detection for attendance.',
        theme_color: '#ffffff',
        icons: [
          {
            src: 'favicon.ico',
            sizes: '48x48',
            type: 'image/x-icon'
          },
          {
            src: 'LivenessIcon16.png',
            type: 'image/png',
            sizes: '16x16'
          },
          {
            src: 'LivenessIcon32.png',
            type: 'image/png',
            sizes: '32x32'
          },
          {
            src: 'maskable_icon_x48.png',
            type: 'image/png',
            sizes: '48x48'
          },
          {
            src: 'maskable_icon_x72.png',
            type: 'image/png',
            sizes: '72x72'
          },
          {
            src: 'maskable_icon_x96.png',
            type: 'image/png',
            sizes: '96x96'
          },
          {
            src: 'maskable_icon_x128.png',
            type: 'image/png',
            sizes: '128x128'
          },
          {
            src: 'maskable_icon_x192.png',
            type: 'image/png',
            sizes: '192x192'
          },
          {
            src: 'maskable_icon_x384.png',
            type: 'image/png',
            sizes: '384x384'
          },
          {
            src: 'maskable_icon_x512.png',
            type: 'image/png',
            sizes: '512x512'
          }
        ],
        start_url: '.',
        display: 'standalone',
        background_color: '#ffffff'
      },
      workbox: {
        navigateFallback: '/offline.html',
        globPatterns: ['**/*.{js,css,html,png,svg}']
      }
    })
  ],
   server: {
    host: true,
    port: 5173
  }
  
});
