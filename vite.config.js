import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],

  build: {
    // Modern target: smaller output, no legacy polyfills
    target: 'es2020',

    // esbuild minifier is faster and produces smaller output than terser
    minify: 'esbuild',

    chunkSizeWarningLimit: 400,

    rollupOptions: {
      output: {
        /*
          Manual chunk strategy
          ─────────────────────
          vendor  → react + react-dom  (rarely changes → long-lived CDN cache)
          landing → Landing.jsx        (54 KB CSS-heavy, isolated from Tool visitors)
          tool    → Tool.jsx           (61 KB, isolated from Landing visitors)

          Result: landing page visitors download ~vendor + landing only.
          Tool visitors download ~vendor + tool only.
        */
        manualChunks(id) {
          if (id.includes('node_modules/react-dom') || id.includes('node_modules/react/')) {
            return 'vendor';
          }
          if (id.includes('/src/Landing')) {
            return 'landing';
          }
          if (id.includes('/src/Tool')) {
            return 'tool';
          }
        },

        // Human-readable, stable names for debugging
        chunkFileNames:  'assets/[name]-[hash].js',
        entryFileNames:  'assets/[name]-[hash].js',
        assetFileNames:  'assets/[name]-[hash].[ext]',
      },
    },
  },
})