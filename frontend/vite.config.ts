import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
  ],
  server: {
    port: 5173,
    open: true,
    cors: true,
    // Proxy for API requests during development
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        // Rewrite if necessary
        // rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    minify: 'terser',
    // If you want to include assets in specific folders
    assetsDir: 'assets',
  },
  // For better path resolution
  resolve: {
    alias: {
      '@': '/src',
    },
  }
})