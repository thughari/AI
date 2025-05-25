import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  console.log('API Key available:', !!env.VITE_GEMINI_API_KEY); // Logs true/false without exposing the key
  
  return {
    plugins: [react()],
    base: '/AI/',
    define: {
      
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    }
  };
});
