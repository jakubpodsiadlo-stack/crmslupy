import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  envPrefix: ['VITE_', 'SUPABASE_', 'NEXT_PUBLIC_'],
  server: {
    port: 5174,
    strictPort: true,
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true
  }
});
