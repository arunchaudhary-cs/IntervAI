import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    allowedHosts: true, // Allows all tunnel domains (localtunnel, cloudflare, ngrok)
    proxy: {
      '/auth': 'http://localhost:3000',
      '/users': 'http://localhost:3000',
      '/interviews': 'http://localhost:3000',
      '/resume': 'http://localhost:3000',
      '/questions': 'http://localhost:3000',
      '/health': 'http://localhost:3000',
      '/reports': 'http://localhost:3000',
    },
  },
})
