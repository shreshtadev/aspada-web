import {
	defineConfig,
	presetAttributify,
	presetIcons,
	presetTypography,
	presetWebFonts,
	presetWind4,
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
				navy: "#162A47", // Primary Background (Midnight)
				cream: "#FBFBEB", // Secondary Text/BG (Vanilla)
				steel: "#2E5A88", // Accent 1
				silver: "#e0ebf3ff", // Accent 2 (Champagne)
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
		presetWind4(),
		presetTypography(),
		presetAttributify(),
		presetIcons({
			scale: 1.2,
			cdn: "https://esm.sh/",
			extraProperties: {
				display: "inline-block",
				"vertical-align": "middle",
			},
		}),
		presetTypography(),
		presetWebFonts({
			provider: "google",
			fonts: {
				// Modern & Catchy: Rounded Geometric Sans
				// 'Outfit' is very circular and high-end.
				sans: "Outfit:300,400,600,700",

				// Display: Bold & Friendly
				// 'Urbanist' or 'Plus Jakarta Sans' offer that trendy, rounded tech-luxury look.
				display: "Plus Jakarta Sans:700,800",

				// Serif: Elegant & Sophisticated
				// 'Instrument Serif' is thinner and more modern than Playfair.
				serif: "Instrument Serif:400",
			},
		}),
	],
	transformers: [transformerDirectives(), transformerVariantGroup()],
});
