import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Builds the React dashboard straight into the Spring Boot static resources
// directory so `mvn package` produces one self-contained executable jar.
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: '../src/main/resources/static',
    emptyOutDir: true,
  },
  server: {
    port: 5173,
    // `npm run dev` proxies API calls to the running Spring Boot app.
    proxy: {
      '/api': 'http://localhost:8080',
      '/actuator': 'http://localhost:8080',
    },
  },
})
