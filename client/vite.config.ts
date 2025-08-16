import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Replit-friendly Vite config with API + WebSocket proxy.
// - Proxies /api and /socket.io to the Express server on port 5000
// - Makes HMR work over HTTPS (wss) on Replit
// - Binds to 0.0.0.0 so the dev server is reachable externally

export default defineConfig(({ mode }) => {
  const isProd = mode === 'production'
  const isReplit = !!process.env.REPL_ID

  return {
    plugins: [react()],
    server: {
      host: true,         // 0.0.0.0
      port: 5173,
      strictPort: true,
      proxy: {
        '/api': {
          target: 'http://localhost:5000',
          changeOrigin: true,
          secure: false,
        },
        // If your backend exposes Socket.IO or WS endpoints
        '/socket.io': {
          target: 'ws://localhost:5000',
          ws: true,
          changeOrigin: true,
          secure: false,
        },
      },
      hmr: {
        // Replit needs WSS on port 443 for HMR in the browser
        protocol: isReplit ? 'wss' : 'ws',
        clientPort: isReplit ? 443 : 5173,
      },
    },
    preview: {
      host: true,
      port: 4173,
      proxy: {
        '/api': {
          target: 'http://localhost:5000',
          changeOrigin: true,
          secure: false,
        },
        '/socket.io': {
          target: 'ws://localhost:5000',
          ws: true,
          changeOrigin: true,
          secure: false,
        },
      },
    },
    define: {
      __APP_ENV__: JSON.stringify(mode),
    },
  }
})