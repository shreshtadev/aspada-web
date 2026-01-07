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