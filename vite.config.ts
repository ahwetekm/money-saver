import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig(async ({ mode }) => {
  const plugins = [
    react(), 
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icon-192x192.svg'],
      manifest: {
        name: 'Finans - Akıllı Yönetim',
        short_name: 'Finans',
        description: 'Akıllı ve Local-First Finans Platformu - Offline Desteği',
        theme_color: '#0f172a',
        background_color: '#0f172a',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'icon-192x192.svg',
            sizes: '192x192',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          },
          {
            src: 'favicon.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        // Cache all static assets for offline shell
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2,woff}'],
        // Increase max file size to cache larger JS bundles
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        // Navigate fallback - serve index.html for offline navigation
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api/],
        runtimeCaching: [
          // API calls: Network First with cache fallback
          {
            urlPattern: /^\/api\/(?!auth).*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 // 24 hours
              },
              cacheableResponse: {
                statuses: [0, 200]
              },
              networkTimeoutSeconds: 10
            }
          },
          // CoinGecko API: Stale While Revalidate
          {
            urlPattern: /^https:\/\/api\.coingecko\.com\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'crypto-api-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 10 // 10 minutes
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          // Google Fonts: Cache First
          {
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          // Gun P2P: Network Only
          {
            urlPattern: /^https:\/\/gun-manhattan\.herokuapp\.com\/.*/i,
            handler: 'NetworkOnly',
            options: {
              cacheName: 'gun-p2p'
            }
          }
        ]
      },
      devOptions: {
        enabled: true
      }
    })
  ];
  
  try {
    // @ts-ignore
    const m = await import('./.vite-source-tags.js');
    plugins.push(m.sourceTags());
  } catch {}

  const env = loadEnv(mode, process.cwd(), ['VITE_', 'NEXT_PUBLIC_']);
  const processEnvDefines: Record<string, string> = {};
  for (const [key, value] of Object.entries(env)) {
    processEnvDefines[`process.env.${key}`] = JSON.stringify(value);
  }

  return {
    plugins,
    envPrefix: ['VITE_', 'NEXT_PUBLIC_'],
    define: processEnvDefines,
  };
})
