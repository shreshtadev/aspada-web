import { defineConfig } from "astro/config";
import UnoCSS from "unocss/astro";
import netlify from "@astrojs/netlify";
import { loadEnv } from "vite";

import svelte from "@astrojs/svelte";

const { PUBLIC_PB_URL } = loadEnv(
	process.env.NODE_ENV || "development",
	process.cwd(),
	"",
);

// https://astro.build/config
export default defineConfig({
	output: "server",
	integrations: [UnoCSS(), svelte({ extensions: [".svelte"] })],
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
