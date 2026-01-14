/** @type {import("eslint").Linter.Config} */
module.exports = {
    root: true,

    env: {
        browser: true,
        es2022: true,
        node: true
    },

    parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module"
    },

    extends: [
        "eslint:recommended",
        "plugin:@typescript-eslint/recommended"
    ],

    plugins: [
        "@typescript-eslint"
    ],

    overrides: [
        // --------------------
        // Astro
        // --------------------
        {
            files: ["*.astro"],
            parser: "astro-eslint-parser",
            parserOptions: {
                parser: "@typescript-eslint/parser",
                extraFileExtensions: [".astro"]
            },
            plugins: ["astro"],
            extends: ["plugin:astro/recommended"]
        },

        // --------------------
        // Svelte
        // --------------------
        {
            files: ["*.svelte"],
            parser: "svelte-eslint-parser",
            parserOptions: {
                parser: "@typescript-eslint/parser",
                extraFileExtensions: [".svelte"]
            },
            plugins: ["svelte"],
            extends: ["plugin:svelte/recommended"]
        },

        // --------------------
        // TypeScript
        // --------------------
        {
            files: ["*.ts", "*.tsx"],
            parser: "@typescript-eslint/parser",
            parserOptions: {
                project: "./tsconfig.json"
            }
        }
    ],

    ignorePatterns: [
        "dist/",
        ".astro/",
        "node_modules/"
    ]
};
