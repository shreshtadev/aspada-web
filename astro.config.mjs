import { defineConfig } from "astro/config";
import UnoCSS from "unocss/astro";
import netlify from "@astrojs/netlify";
import { loadEnv } from "vite";

import svelte from "@astrojs/svelte";

import sitemap from "@astrojs/sitemap";

const { PUBLIC_PB_URL, PUBLIC_SITE_URL } = loadEnv(
    process.env.NODE_ENV || "development",
    process.cwd(),
    "",
);

// https://astro.build/config
export default defineConfig({
    site: PUBLIC_SITE_URL,
    output: "server",
    integrations: [UnoCSS(), svelte({ extensions: [".svelte"] }), sitemap()],
    adapter: netlify(),
    image: {
        domains: [
            "images.unsplash.com",
            "i.pravatar.cc",
            PUBLIC_PB_URL,
        ].filter(Boolean),
    },
    vite: {
        build: {
            rollupOptions: {
                output: {
                    manualChunks(id) {
                        // ---- Milkdown editor (largest dependency) ----
                        if (id.includes("node_modules/@milkdown")) {
                            return "milkdown";
                        }

                        // ---- PocketBase SDK ----
                        if (id.includes("node_modules/pocketbase")) {
                            return "pocketbase";
                        }

                        // ---- Markdown parsing ----
                        if (id.includes("node_modules/marked")) {
                            return "marked";
                        }
                        // Default: let Astro/Vite handle everything else
                    },
                }
            }
        },
        server: {
            watch: {
                ignored: [
                    "**/node_modules/**",
                    "**/.git/**",
                    "**/dist/**",
                    "**/.astro/**",
                ],
            },
        },
    },
});