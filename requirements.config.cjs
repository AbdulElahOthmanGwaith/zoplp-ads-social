/**
 * ملف تكوين مركزي لإدارة جميع متطلبات التطبيق
 * Central Configuration File for Managing All Application Requirements
 * 
 * هذا الملف يحتوي على جميع إعدادات ومتطلبات التطبيق في مكان واحد
 * This file contains all application settings and requirements in one place
 */

module.exports = {
  // معلومات المشروع الأساسية
  project: {
    name: 'ZOPLP ADS Social',
    version: '1.0.0',
    description: 'تطبيق الشبكات الاجتماعية لإدارة الإعلانات',
    author: 'MiniMax Agent',
    type: 'module',
    private: true
  },

  // متطلبات Node.js والحزم
  engines: {
    node: '>=18.0.0',
    pnpm: '>=8.0.0'
  },

  // المتغيرات البيئية المطلوبة
  environmentVariables: {
    development: {
      VITE_APP_TITLE: 'ZOPLP ADS - Development',
      VITE_APP_VERSION: '1.0.0-dev',
      VITE_NODE_ENV: 'development',
      VITE_DEBUG: 'true'
    },
    production: {
      VITE_APP_TITLE: 'ZOPLP ADS',
      VITE_APP_VERSION: '1.0.0',
      VITE_NODE_ENV: 'production',
      VITE_DEBUG: 'false'
    },
    supabase: {
      VITE_SUPABASE_URL: '',  // سيتم ملؤها من المستخدم
      VITE_SUPABASE_ANON_KEY: '',  // سيتم ملؤها من المستخدم
      SUPABASE_SERVICE_ROLE_KEY: ''  // سيتم ملؤها من المستخدم
    }
  },

  // اعتماديات الإنتاج (Production Dependencies)
  dependencies: {
    // React Framework
    'react': '^18.3.1',
    'react-dom': '^18.3.1',
    'react-router-dom': '^6.0.0',
    
    // UI Components & Styling
    '@radix-ui/react-accordion': '^1.2.2',
    '@radix-ui/react-alert-dialog': '^1.1.4',
    '@radix-ui/react-aspect-ratio': '^1.1.1',
    '@radix-ui/react-avatar': '^1.1.2',
    '@radix-ui/react-checkbox': '^1.1.3',
    '@radix-ui/react-collapsible': '^1.1.2',
    '@radix-ui/react-context-menu': '^2.2.4',
    '@radix-ui/react-dialog': '^1.1.4',
    '@radix-ui/react-dropdown-menu': '^2.1.4',
    '@radix-ui/react-hover-card': '^1.1.4',
    '@radix-ui/react-label': '^2.1.1',
    '@radix-ui/react-menubar': '^1.1.4',
    '@radix-ui/react-navigation-menu': '^1.2.3',
    '@radix-ui/react-popover': '^1.1.4',
    '@radix-ui/react-progress': '^1.1.1',
    '@radix-ui/react-radio-group': '^1.2.2',
    '@radix-ui/react-scroll-area': '^1.2.2',
    '@radix-ui/react-select': '^2.1.4',
    '@radix-ui/react-separator': '^1.1.1',
    '@radix-ui/react-slider': '^1.2.2',
    '@radix-ui/react-slot': '^1.1.1',
    '@radix-ui/react-switch': '^1.1.2',
    '@radix-ui/react-tabs': '^1.1.2',
    '@radix-ui/react-toast': '^1.2.4',
    '@radix-ui/react-toggle': '^1.1.1',
    '@radix-ui/react-toggle-group': '^1.1.1',
    '@radix-ui/react-tooltip': '^1.1.6',
    
    // Utility Libraries
    'class-variance-authority': '^0.7.1',
    'clsx': '^2.1.1',
    'cmdk': '1.0.0',
    'tailwind-merge': '^2.6.0',
    'tailwindcss-animate': '^1.0.7',
    
    // Backend & Data
    '@supabase/supabase-js': '^2.57.0',
    
    // Forms & Validation
    '@hookform/resolvers': '^3.10.0',
    'react-hook-form': '^7.54.2',
    'zod': '^3.24.1',
    
    // Date & Time
    'date-fns': '^3.0.0',
    'react-day-picker': '8.10.1',
    
    // UI Enhancements
    'embla-carousel-react': '^8.5.2',
    'input-otp': '^1.4.2',
    'lucide-react': '^0.364.0',
    'next-themes': '^0.4.4',
    'react-hot-toast': '^2.6.0',
    'react-media-recorder': '^1.7.2',
    'react-resizable-panels': '^2.1.7',
    'recharts': '^2.12.4',
    'sonner': '^1.7.2',
    'vaul': '^1.1.2'
  },

  // اعتماديات التطوير (Development Dependencies)
  devDependencies: {
    // TypeScript
    'typescript': '~5.6.2',
    '@types/node': '^22.10.7',
    '@types/react': '^18.3.12',
    '@types/react-dom': '^18.3.1',
    '@types/react-router-dom': '^5.0.0',
    'typescript-eslint': '^8.15.0',
    
    // Build Tools
    'vite': '^6.0.1',
    '@vitejs/plugin-react': '^4.3.4',
    'vite-plugin-source-identifier': '1.1.2',
    
    // CSS & Styling
    'tailwindcss': 'v3.4.16',
    'postcss': '8.4.49',
    'autoprefixer': '10.4.20',
    
    // Code Quality
    'eslint': '^9.15.0',
    '@eslint/js': '^9.15.0',
    'eslint-plugin-react-hooks': '^5.0.0',
    'eslint-plugin-react-refresh': '^0.4.14',
    'globals': '^15.12.0'
  },

  // PWA Configuration
  pwa: {
    enabled: true,
    workboxConfig: {
      runtimeCaching: [
        {
          urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
          handler: 'CacheFirst',
          options: {
            cacheName: 'google-fonts-cache',
            expiration: {
              maxEntries: 10,
              maxAgeSeconds: 60 * 60 * 24 * 365 // سنة واحدة
            }
          }
        }
      ]
    },
    manifest: {
      name: 'ZOPLP ADS Social',
      short_name: 'ZOPLP ADS',
      description: 'تطبيق الشبكات الاجتماعية لإدارة الإعلانات',
      theme_color: '#000000',
      background_color: '#ffffff',
      display: 'standalone',
      orientation: 'portrait',
      scope: '/',
      start_url: '/',
      icons: [
        {
          src: '/icons/pwa-64x64.png',
          sizes: '64x64',
          type: 'image/png'
        },
        {
          src: '/icons/pwa-192x192.png',
          sizes: '192x192',
          type: 'image/png'
        },
        {
          src: '/icons/pwa-512x512.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'any maskable'
        }
      ]
    }
  },

  // Build Configuration
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    minify: 'terser',
    target: 'esnext',
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'ui-vendor': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
          'router': ['react-router-dom']
        }
      }
    }
  },

  // Development Configuration
  development: {
    port: 3000,
    open: true,
    cors: true,
    host: 'localhost'
  },

  // Scripts Configuration
  scripts: {
    'dev': 'pnpm install --prefer-offline && vite',
    'build': 'pnpm install --prefer-offline && rm -rf node_modules/.vite-temp && tsc -b && vite build',
    'build:prod': 'pnpm install --prefer-offline && rm -rf node_modules/.vite-temp && tsc -b && BUILD_MODE=prod vite build',
    'lint': 'pnpm install --prefer-offline && eslint .',
    'preview': 'pnpm install --prefer-offline && vite preview',
    'install-deps': 'pnpm install --prefer-offline',
    'clean': 'rm -rf node_modules .pnpm-store pnpm-lock.yaml && pnpm store prune',
    'setup': 'node scripts/setup-requirements.cjs',
    'check-deps': 'node scripts/check-dependencies.cjs',
    'update-config': 'node scripts/update-config.cjs'
  },

  // Security Configuration
  security: {
    allowedOrigins: ['http://localhost:3000', 'https://your-domain.com'],
    csrfProtection: true,
    rateLimit: {
      windowMs: 15 * 60 * 1000, // 15 دقيقة
      max: 100 // حد أقصى 100 طلب
    }
  },

  // Performance Configuration
  performance: {
    budgets: [
      {
        type: 'bundle',
        name: 'main',
        maximumWarning: '1mb',
        maximumError: '2mb'
      }
    ],
    optimization: {
      splitChunks: true,
      minifyCSS: true,
      minifyJS: true
    }
  },

  // Database Configuration (Supabase)
  database: {
    provider: 'supabase',
    tables: [
      'users',
      'posts',
      'comments',
      'likes',
      'ads',
      'campaigns',
      'analytics'
    ],
    auth: {
      providers: ['email', 'google', 'facebook'],
      emailConfirmation: true,
      passwordRecovery: true
    },
    storage: {
      buckets: ['avatars', 'posts-media', 'ads-media']
    }
  }
};
