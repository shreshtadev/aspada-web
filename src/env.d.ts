/// <reference types="astro/client" />

declare module "*.webp" {
  const content: any;
  export default content;
}

declare module "*.png" {
  const content: any;
  export default content;
}

declare module "*.jpg" {
  const content: any;
  export default content;
}

import type PocketBase from 'pocketbase'

interface ImportMetaEnv {
  readonly PUBLIC_PB_URL: string
  readonly PUBLIC_COMPANY_NAME: string
  readonly PUBLIC_SITE_URL: string
  readonly GEMINI_API_KEY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare global {
  namespace App {
    interface Locals {
      pb: PocketBase
      user: any
    }
  }
}
