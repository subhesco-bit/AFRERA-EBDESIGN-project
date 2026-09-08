import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import viteCompression from 'vite-plugin-compression'

export default defineConfig(async () => {
  const visualizer = process.env.ANALYZE ? (await import('rollup-plugin-visualizer')).visualizer : null
  
  return {
    plugins: [
      react(),
      tailwindcss(),
      // Bundle analyzer for development
      visualizer && visualizer({
        open: true,
        gzipSize: true,
        brotliSize: true
      }),
      // Gzip compression
      viteCompression({
        algorithm: 'gzip',
        ext: '.gz',
        threshold: 10240, // Only compress files larger than 10KB
        deleteOriginFile: false
      }),
      // Brotli compression
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
          target: 'http://localhost:3000',
          changeOrigin: true,
        },
      },
    },
    build: {
      outDir: 'dist',
      sourcemap: process.env.NODE_ENV !== 'production',
      chunkSizeWarningLimit: 1500, // Increased to reduce warnings for legitimate large chunks
      minify: 'terser',
      target: 'es2015',
      cssCodeSplit: true,
      // Additional optimization for production builds
      reportCompressedSize: false, // Reduces build time
      // Optimize dependency pre-bundling
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
            // Vendor chunks. Order matters: this checks more specific
            // package names BEFORE the bare 'react' substring check below,
            // because 'react-hook-form' and '@radix-ui/react-dialog' both
            // contain the substring 'react' and would otherwise be swept
            // into react-vendor first - which is exactly what produced an
            // empty forms-vendor chunk and a vendor <-> react-vendor
            // circular-chunk warning on every build before this fix.
            if (id.includes('node_modules')) {
              // UI libraries
              if (id.includes('@radix-ui') || id.includes('lucide-react')) {
                return 'ui-vendor';
              }
              // Forms and validation
              if (id.includes('react-hook-form') || id.includes('@hookform') || id.includes('/node_modules/zod/')) {
                return 'forms-vendor';
              }
              // Charts and visualization
              if (id.includes('recharts') || id.includes('chart.js')) {
                return 'charts-vendor';
              }
              // Data fetching
              if (id.includes('@tanstack') || id.includes('axios')) {
                return 'data-vendor';
              }
              // State management
              if (id.includes('zustand') || id.includes('redux')) {
                return 'state-vendor';
              }
              // Date utilities
              if (id.includes('date-fns') || id.includes('dayjs')) {
                return 'date-vendor';
              }
              // Monitoring
              if (id.includes('@sentry')) {
                return 'monitoring-vendor';
              }
              // React core - precise package-folder matches only, checked
              // last among the react-named packages so nothing above gets
              // shadowed by this broader match. scheduler/loose-envify are
              // react-dom's own real dependencies (see its package.json) -
              // leaving them in the generic vendor chunk below creates a
              // real vendor <-> react-vendor import cycle (react-dom needs
              // scheduler, and nearly everything else in vendor needs
              // react), which is what Rollup's circular-chunk warning was
              // reporting.
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
              // Other node modules
              return 'vendor';
            }

            // Keep lazily imported pages in their own Rollup chunks. Grouping
            // every page into one manual chunk defeats route-level code
            // splitting and creates a large first-navigation payload.
            if (id.includes('/components/')) {
              return 'components';
            }
            if (id.includes('/modules/')) {
              return 'modules';
            }
          },
          // Optimize chunk file names for caching
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
