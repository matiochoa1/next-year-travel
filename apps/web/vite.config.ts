import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    // Same-origin in development, mirroring the Vercel rewrite used in production.
    proxy: { '/api': process.env.VITE_API_PROXY ?? 'http://localhost:7071' },
  },
  build: {
    target: 'es2022',
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('maplibre-gl')) return 'maplibre'
          if (/node_modules\/(\.pnpm\/)?(react|react-dom|scheduler)[@/]/.test(id)) return 'react'
        },
      },
    },
  },
  test: { environment: 'jsdom', include: ['src/**/*.test.{ts,tsx}'] },
})
