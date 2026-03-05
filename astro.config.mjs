import { defineConfig } from 'astro/config'
import UnoCSS from 'unocss/astro'
import netlify from '@astrojs/netlify'
import node from '@astrojs/node'
import { fileURLToPath } from 'node:url'
import { loadEnv } from 'vite'

import svelte from '@astrojs/svelte'

import sitemap from '@astrojs/sitemap'

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
  adapter:
    process.env.NODE_ENV === 'production'
      ? netlify()
      : node({
          mode: 'standalone',
        }),
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
        '$components': fileURLToPath(new URL('./src/components', import.meta.url)),
        '$lib': fileURLToPath(new URL('./src/lib', import.meta.url)),
        '$types': fileURLToPath(new URL('./src/types', import.meta.url)),
        '$layouts': fileURLToPath(new URL('./src/layouts', import.meta.url)),
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
