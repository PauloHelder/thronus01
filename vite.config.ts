import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [
        react(),
        VitePWA({
          registerType: 'autoUpdate',
          includeAssets: ['icon.svg', 'icon-192.svg', 'icon-512.svg', 'apple-touch-icon.svg'],
          manifest: {
            name: 'Thronus - Gestão de Igrejas',
            short_name: 'Thronus',
            description: 'Plataforma completa de gestão para igrejas. Membros, cultos, finanças, grupos e muito mais.',
            theme_color: '#f97316',
            background_color: '#f8fafc',
            display: 'standalone',
            orientation: 'portrait',
            scope: '/',
            start_url: '/',
            categories: ['business', 'productivity'],
            icons: [
              {
                src: 'icon-192.svg',
                sizes: '192x192',
                type: 'image/svg+xml',
                purpose: 'any'
              },
              {
                src: 'icon-512.svg',
                sizes: '512x512',
                type: 'image/svg+xml',
                purpose: 'any'
              },
              {
                src: 'icon-512.svg',
                sizes: '512x512',
                type: 'image/svg+xml',
                purpose: 'maskable'
              }
            ]
          },
          workbox: {
            // Cache de páginas e navegação (App Shell)
            navigateFallback: 'index.html',
            navigateFallbackDenylist: [/^\/api/],
            maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // Aumentado para 5MB devido ao tamanho do bundle

            runtimeCaching: [
              // Cache de fontes do Google
              {
                urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
                handler: 'CacheFirst',
                options: {
                  cacheName: 'google-fonts-cache',
                  expiration: {
                    maxEntries: 10,
                    maxAgeSeconds: 60 * 60 * 24 * 365 // 1 ano
                  },
                  cacheableResponse: {
                    statuses: [0, 200]
                  }
                }
              },
              {
                urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
                handler: 'CacheFirst',
                options: {
                  cacheName: 'gstatic-fonts-cache',
                  expiration: {
                    maxEntries: 10,
                    maxAgeSeconds: 60 * 60 * 24 * 365
                  },
                  cacheableResponse: {
                    statuses: [0, 200]
                  }
                }
              },
              // Cache de dados do Supabase (Network First - tenta online, cai pro cache se offline)
              {
                urlPattern: /^https:\/\/.*\.supabase\.co\/rest\/v1\/.*/i,
                handler: 'NetworkFirst',
                options: {
                  cacheName: 'supabase-api-cache',
                  expiration: {
                    maxEntries: 100,
                    maxAgeSeconds: 60 * 60 * 24 * 7 // 7 dias
                  },
                  cacheableResponse: {
                    statuses: [0, 200]
                  },
                  networkTimeoutSeconds: 10
                }
              },
              // Cache de autenticação do Supabase (Network Only - nunca cachear auth)
              {
                urlPattern: /^https:\/\/.*\.supabase\.co\/auth\/.*/i,
                handler: 'NetworkOnly'
              },
              // Cache de imagens/avatares do Supabase Storage
              {
                urlPattern: /^https:\/\/.*\.supabase\.co\/storage\/.*/i,
                handler: 'CacheFirst',
                options: {
                  cacheName: 'supabase-storage-cache',
                  expiration: {
                    maxEntries: 200,
                    maxAgeSeconds: 60 * 60 * 24 * 30 // 30 dias
                  },
                  cacheableResponse: {
                    statuses: [0, 200]
                  }
                }
              },
              // Cache do CDN do Tailwind
              {
                urlPattern: /^https:\/\/cdn\.tailwindcss\.com\/.*/i,
                handler: 'CacheFirst',
                options: {
                  cacheName: 'tailwind-cdn-cache',
                  expiration: {
                    maxEntries: 5,
                    maxAgeSeconds: 60 * 60 * 24 * 30
                  },
                  cacheableResponse: {
                    statuses: [0, 200]
                  }
                }
              }
            ]
          }
        })
      ],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
