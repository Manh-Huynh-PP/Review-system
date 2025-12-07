import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  // Increase chunk size warning limit to reduce noisy warnings for large bundles
  // Value is in kilobytes (2000 KB = 2 MB)
  build: {
    chunkSizeWarningLimit: 2000,
  },
})
