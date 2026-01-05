/// <reference types="astro/client" />

import type PocketBase from "pocketbase";

interface ImportMetaEnv {
    readonly PUBLIC_PB_URL: string;
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
