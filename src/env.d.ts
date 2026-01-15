/// <reference types="astro/client" />

import type PocketBase from "pocketbase";

interface ImportMetaEnv {
    readonly PUBLIC_PB_URL: string;
    readonly PUBLIC_COMPANY_NAME: string;
    readonly PUBLIC_SITE_URL: string;
    readonly GEMINI_API_KEY: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}

declare global {
    namespace App {
        interface Locals {
            pb: PocketBase;
            user: any;
        }
    }
}
