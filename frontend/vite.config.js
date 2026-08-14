import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig(({ mode }) => ({
  root: './',
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html')
      }
    }
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, 'src')
    },
  },
  server: {
    port: 8080
  },
  esbuild: mode === 'production'
    ? {
        pure: ['console.log', 'console.info', 'console.debug', 'console.trace']
      }
    : undefined
}))
