import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { networkInterfaces } from 'os'

// Get all non-internal IPv4 addresses
const getLocalIPs = () => {
  const interfaces = networkInterfaces()
  const ips = []

  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        ips.push(iface.address)
      }
    }
  }

  return ips.length > 0 ? ips : ['localhost']
}

const localIPs = getLocalIPs()

const generateOrigins = () => {
  const origins = [
    'http://localhost:3000',
    'https://nutri-vision.onrender.com',
    'https://nutri-vision-704d5.web.app',
    'https://nutri-vision-704d5.firebaseapp.com',
    'https://nutri-vision-app-gqepd5e8cyc8hgez.southeastasia-01.azurewebsites.net'
  ]

  localIPs.forEach(ip => origins.push(`http://${ip}:3000`))
  return origins
}

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: ['@emotion/styled', '@emotion/react', '@mui/material/Tooltip']
  },
  server: {
    host: '0.0.0.0',
    port: 3000,
    strictPort: true,
    cors: {
      origin: generateOrigins(),
      credentials: true
    }
  },
  preview: {
    port: 3000,
    strictPort: true,
    cors: {
      origin: generateOrigins(),
      credentials: true
    }
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom']
        }
      }
    }
  }
})
