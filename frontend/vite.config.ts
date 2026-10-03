import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true
      },
      '/exams': {
        target: 'http://localhost:5000',
        changeOrigin: true
      },
      '/questions': {
        target: 'http://localhost:5000',
        changeOrigin: true
      },
      '/submissions': {
        target: 'http://localhost:5000',
        changeOrigin: true
      },
      '/results': {
        target: 'http://localhost:5000',
        changeOrigin: true
      }
    }
  }
});
