import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // PHP: php -S localhost:8080 -t backend/public (z SUPABASE_JWT_SECRET)
      '/api': { target: 'http://localhost:8080', changeOrigin: true },
      // Kalkulator w iframe modala (FirstLeadDetailModal): `frontend/kalkulator` na porcie 5174
      '/embed-kalkulator': {
        target: 'http://localhost:5174',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/embed-kalkulator/, '') || '/',
      },
    },
  },
})
