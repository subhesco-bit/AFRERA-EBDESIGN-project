import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import viteCompression from 'vite-plugin-compression'

const BACKEND = process.env.VITE_PROXY_TARGET || 'http://localhost:3001'

export default defineConfig(async () => {
  const visualizer = process.env.ANALYZE ? (await import('rollup-plugin-visualizer')).visualizer : null
  
  return {
    plugins: [
      react(),
      tailwindcss(),
      visualizer && visualizer({
        open: true,
        gzipSize: true,
        brotliSize: true
      }),
      viteCompression({
        algorithm: 'gzip',
        ext: '.gz',
        threshold: 10240,
        deleteOriginFile: false
      }),
      viteCompression({
        algorithm: 'brotliCompress',
        ext: '.br',
        threshold: 10240,
        deleteOriginFile: false
      })
    ].filter(Boolean),
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@components': path.resolve(__dirname, './src/components'),
        '@lib': path.resolve(__dirname, './src/lib'),
        '@hooks': path.resolve(__dirname, './src/hooks'),
        '@services': path.resolve(__dirname, './src/services'),
        '@store': path.resolve(__dirname, './src/store'),
        '@utils': path.resolve(__dirname, './src/utils'),
      },
    },
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: BACKEND,
          changeOrigin: true,
        },
        '/health': {
          target: BACKEND,
          changeOrigin: true,
        },
      },
    },
    preview: {
      port: 5173,
      proxy: {
        '/api': { target: BACKEND, changeOrigin: true },
        '/health': { target: BACKEND, changeOrigin: true },
      },
    },
    build: {
      outDir: 'dist',
      sourcemap: process.env.NODE_ENV !== 'production',
      chunkSizeWarningLimit: 1500,
      minify: 'terser',
      target: 'es2015',
      cssCodeSplit: true,
      reportCompressedSize: false,
      commonjsOptions: {
        transformMixedEsModules: true
      },
      terserOptions: {
        compress: {
          drop_console: process.env.NODE_ENV === 'production',
          drop_debugger: true,
          pure_funcs: ['console.log', 'console.info', 'console.debug'],
          passes: 2
        },
        mangle: {
          safari10: true
        },
        format: {
          comments: false
        }
      },
      rollupOptions: {
        output: {
          manualChunks: (id) => {
            if (id.includes('node_modules')) {
              if (id.includes('@radix-ui') || id.includes('lucide-react')) {
                return 'ui-vendor';
              }
              if (id.includes('react-hook-form') || id.includes('@hookform') || id.includes('/node_modules/zod/')) {
                return 'forms-vendor';
              }
              if (id.includes('recharts') || id.includes('chart.js')) {
                return 'charts-vendor';
              }
              if (id.includes('@tanstack') || id.includes('axios')) {
                return 'data-vendor';
              }
              if (id.includes('zustand') || id.includes('redux')) {
                return 'state-vendor';
              }
              if (id.includes('date-fns') || id.includes('dayjs')) {
                return 'date-vendor';
              }
              if (id.includes('@sentry')) {
                return 'monitoring-vendor';
              }
              if (
                id.includes('/node_modules/react/') ||
                id.includes('/node_modules/react-dom/') ||
                id.includes('/node_modules/react-router') ||
                id.includes('/node_modules/scheduler/') ||
                id.includes('/node_modules/loose-envify/') ||
                id.includes('/node_modules/@remix-run/router/')
              ) {
                return 'react-vendor';
              }
              return 'vendor';
            }

            if (id.includes('/components/')) {
              return 'components';
            }
            if (id.includes('/modules/')) {
              return 'modules';
            }
          },
          chunkFileNames: 'assets/js/[name]-[hash].js',
          entryFileNames: 'assets/js/[name]-[hash].js',
          assetFileNames: 'assets/[ext]/[name]-[hash].[ext]'
        }
      }
    },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: './src/test/setup.js',
      coverage: {
        provider: 'v8',
        reporter: ['text', 'json', 'html'],
      },
    },
  }
})
