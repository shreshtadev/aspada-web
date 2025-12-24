import {
	defineConfig,
	presetAttributify,
	presetIcons,
	presetTypography,
	presetUno,
	presetWebFonts,
	transformerDirectives,
	transformerVariantGroup,
} from "unocss";

export default defineConfig({
	shortcuts: [
		// High-end UI Shortcuts
		[
			"btn-primary",
			"px-8 py-3 rounded-full bg-aspada-gold text-aspada-navy font-bold transition-all hover:scale-105 hover:bg-aspada-silver active:scale-95 shadow-lg",
		],
		[
			"glass-card",
			"bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6",
		],
		[
			"section-title",
			"text-4xl md:text-5xl font-display font-bold text-aspada-cream tracking-tight mb-8",
		],
		["flex-center", "flex items-center justify-center"],
	],
	theme: {
		colors: {
			aspada: {
				gold: "#D4AF37", // Main Logo Gold
				navy: "#0A192F", // Primary Background (Midnight)
				cream: "#F5EEDC", // Secondary Text/BG (Vanilla)
				steel: "#1B3B5A", // Accent 1
				silver: "#C0C0C0", // Accent 2 (Champagne)
			},
		},
		breakpoints: {
			sm: "640px",
			md: "768px",
			lg: "1024px",
			xl: "1280px",
		},
	},
	presets: [
		presetUno(),
		presetAttributify(),
		presetIcons({
			scale: 1.2,
			cdn: "https://esm.sh/", // Faster loading in 2026
			extraProperties: {
				display: "inline-block",
				"vertical-align": "middle",
			},
		}),
		presetTypography(),
		presetWebFonts({
			provider: "google",
			fonts: {
				// Modern Real Estate Fonts
				sans: "Inter:400,600,700",
				display: "Lexend:700,800",
				serif: "Playfair Display:400,700",
			},
		}),
	],
	transformers: [transformerDirectives(), transformerVariantGroup()],
});
