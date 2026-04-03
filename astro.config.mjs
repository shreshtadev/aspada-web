import netlify from '@astrojs/netlify'
import sitemap from '@astrojs/sitemap'
import svelte from '@astrojs/svelte'
import { defineConfig } from 'astro/config'
import { fileURLToPath } from 'node:url'
import UnoCSS from 'unocss/astro'
import { loadEnv } from 'vite'

const { PUBLIC_PB_URL, PUBLIC_SITE_URL } = loadEnv(
  process.env.NODE_ENV || 'development',
  process.cwd(),
  ''
)
// https://astro.build/config
export default defineConfig({
  site: PUBLIC_SITE_URL,
  output: 'server',
  integrations: [UnoCSS(), svelte({ extensions: ['.svelte'] }), sitemap()],
  adapter: netlify({ edgeMiddleware: true }),
  image: {
    domains: [
      'images.unsplash.com',
      'i.pravatar.cc',
      'placehold.co',
      'instagram.com',
      'www.instagram.com',
      'm.instagram.com',
      PUBLIC_PB_URL,
    ].filter(Boolean),
  },
  vite: {
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
        $components: fileURLToPath(new URL('./src/components', import.meta.url)),
        $lib: fileURLToPath(new URL('./src/lib', import.meta.url)),
        $types: fileURLToPath(new URL('./src/types', import.meta.url)),
        $layouts: fileURLToPath(new URL('./src/layouts', import.meta.url)),
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            // ---- Milkdown editor (largest dependency) ----
            if (id.includes('node_modules/@milkdown')) {
              return 'milkdown'
            }

            // ---- PocketBase SDK ----
            if (id.includes('node_modules/pocketbase')) {
              return 'pocketbase'
            }

            // ---- Markdown parsing ----
            if (id.includes('node_modules/marked')) {
              return 'marked'
            }
            // Default: let Astro/Vite handle everything else
          },
        },
        onwarn(warning, warn) {
          // Ignore the specific internal-helpers warning
          if (
            warning.code === 'UNUSED_EXTERNAL_IMPORT' &&
            warning.exporter === '@astrojs/internal-helpers/remote'
          ) {
            return
          }
          warn(warning)
        },
      },
    },
    server: {
      watch: {
        ignored: [
          '**/node_modules/**',
          '**/.git/**',
          '**/dist/**',
          '**/.astro/**',
          '**/dist/**',
          '**/.netlify/**',
        ],
      },
    },
  },
})
