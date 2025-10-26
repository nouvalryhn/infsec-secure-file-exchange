import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./test/setup.ts'],
    globals: true,
    env: {
      SESSION_SECRET: 'test-session-secret-for-testing-purposes-only',
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './'),
      '@/lib': resolve(__dirname, './lib'),
      '@/app': resolve(__dirname, './app'),
      '@/components': resolve(__dirname, './components'),
      '@/types': resolve(__dirname, './types'),
    },
  },
})