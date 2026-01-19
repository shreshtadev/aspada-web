import { sequence } from 'astro:middleware'
import type { MiddlewareHandler } from 'astro'
import pb from './lib/pb'

// Log middleware
const logMiddleware: MiddlewareHandler = async (context, next) => {
  const { request } = context
  const method = request.method
  const url = new URL(request.url).pathname
  const timestamp = new Date().toISOString()

  console.log(`[${timestamp}] ${method} ${url}`)
  return next()
}

// Auth middleware - only for admin routes
const authMiddleware: MiddlewareHandler = async (context, next) => {
  const { pathname } = context.url

  // Only apply to admin routes
  if (!pathname.startsWith('/admin')) {
    return next()
  }

  // Allow Astro internal assets
  if (pathname.startsWith('/_astro') || pathname.startsWith('/favicon')) {
    return next()
  }

  // Allow admin login page
  if (pathname === '/admin/login') {
    return next()
  }

  // Validate authentication for protected admin routes
  const cookieHeader = context.request.headers.get('cookie') ?? ''

  // Load the auth store from the cookie
  pb.authStore.loadFromCookie(cookieHeader)
  try {
    // If valid, refresh the token to verify it against the server
    if (pb.authStore.isValid) {
      await pb.collection('users').authRefresh()
    }
  } catch (error) {
    // Clear the auth store if refresh fails
    pb.authStore.clear()
  }

  // Check validity again
  if (!pb.authStore.isValid) {
    return Response.redirect(new URL('/admin/login', context.url), 302)
  }

  // Store authenticated PocketBase instance in locals
  context.locals.pb = pb
  context.locals.user = pb.authStore.record

  const response = await next()

  // Update the cookie in the response to reflect any changes (e.g. token refresh)
  response.headers.append(
    'set-cookie',
    pb.authStore.exportToCookie({
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
    })
  )

  return response
}

export const onRequest = sequence(logMiddleware, authMiddleware)
