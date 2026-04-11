import PocketBase from 'pocketbase'
import type { TypedPocketBase } from '../types/pocketbase-types'

// Resolve URL at runtime (Netlify Functions first)
function getPbUrl(): string {
  // 1. Runtime (Netlify SSR / Functions)
  if (typeof process !== 'undefined' && process.env.PUBLIC_PB_URL) {
    return process.env.PUBLIC_PB_URL
  }

  // 2. Build-time (Astro/Vite)
  if (import.meta.env?.PUBLIC_PB_URL) {
    return import.meta.env.PUBLIC_PB_URL
  }

  // 3. Local fallback
  return 'http://127.0.0.1:8090'
}

// Factory: create a fresh instance per request
export function createPB(cookie?: string): TypedPocketBase {
  const pb = new PocketBase(getPbUrl()) as TypedPocketBase

  if (cookie) {
    pb.authStore.loadFromCookie(cookie)
  }

  return pb
}

const pb = new PocketBase(getPbUrl()) as TypedPocketBase

export default pb;