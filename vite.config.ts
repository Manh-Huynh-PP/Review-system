import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import locatorBabel from "@locator/babel-jsx"

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const isDev = mode === 'development'
  
  return {
    plugins: [
      react({
        babel: {
          plugins: isDev ? [locatorBabel] : [],
        },
      }),
    ],
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
  }
})
