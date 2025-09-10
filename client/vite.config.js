import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const isDevelopment = mode === 'development';
  
  return {
    plugins: [react()],
    server: {
      proxy: isDevelopment ? {
        '/api': {
          target: 'http://localhost:5002',
          changeOrigin: true,
          secure: false
        }
      } : undefined
    },
    define: {
      __API_URL__: isDevelopment 
        ? JSON.stringify('http://localhost:5002')
        : JSON.stringify('https://your-backend-domain.com')
    }
  }
})
