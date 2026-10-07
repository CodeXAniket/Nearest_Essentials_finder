import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    // During development, calls to /api/... are forwarded to the Spring Boot server.
    proxy: {
      '/api': 'http://localhost:8080',
    },
  },
})
