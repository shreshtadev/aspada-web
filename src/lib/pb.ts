import PocketBase from 'pocketbase';

// 1. Helper to get the URL regardless of environment
const getPbUrl = () => {
    // Check Vite/Astro context first (Client & Server SSR)
    if (import.meta.env?.PUBLIC_PB_URL) {
        return import.meta.env.PUBLIC_PB_URL;
    }

    // Fallback to Node.js process.env (Scripts or certain SSR environments)
    if (typeof process !== 'undefined' && process.env?.PUBLIC_PB_URL) {
        return process.env.PUBLIC_PB_URL;
    }

    // Local fallback
    return 'http://127.0.0.1:8090';
};

// 2. Initialize the Singleton
const pb = new PocketBase(getPbUrl());

export default pb;