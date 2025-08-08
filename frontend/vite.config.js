import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  
  // Configuration pour production AWS
  build: {
    // Optimisations pour AWS
    outDir: 'dist',
    assetsDir: 'assets',
    
    // Compression et minification
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
    
    // Splitting des chunks pour optimiser le cache
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          antd: ['antd', '@ant-design/icons'],
          charts: ['recharts'],
          utils: ['axios', '@tanstack/react-query'],
        },
      },
    },
    
    // Optimisations des assets
    assetsInlineLimit: 4096,
    cssCodeSplit: true,
    
    // Source maps pour production (false pour optimiser)
    sourcemap: false,
    
    // Target moderne pour AWS CloudFront
    target: 'es2015',
    
    // Optimisation du bundle
    chunkSizeWarningLimit: 1000,
  },
  
  // Variables d'environnement
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
  },
  
  // Configuration du serveur de développement
  server: {
    port: 3000,
    host: true,
    strictPort: true,
  },
  
  // Preview (pour build local)
  preview: {
    port: 3000,
    host: true,
  },
  
  // Résolution des paths
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@components': resolve(__dirname, 'src/components'),
      '@pages': resolve(__dirname, 'src/pages'),
      '@services': resolve(__dirname, 'src/services'),
      '@utils': resolve(__dirname, 'src/utils'),
      '@assets': resolve(__dirname, 'src/assets'),
    },
  },
  
  // Configuration CSS
  css: {
    modules: {
      localsConvention: 'camelCase',
    },
    preprocessorOptions: {
      less: {
        javascriptEnabled: true,
      },
    },
  },
  
  // Optimisations pour AWS CloudFront
  base: '/',
  
  // Configuration des dépendances
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'antd',
      '@ant-design/icons',
      'axios',
      'recharts',
    ],
  },
})