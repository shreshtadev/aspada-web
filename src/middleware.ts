import type { MiddlewareHandler } from 'astro'
import { sequence } from 'astro:middleware'
import { createPB } from './lib/pb'
import { UsersFeatureOptions } from './types/pocketbase-types'

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

  // Only apply to admin and crm routes
  if (!pathname.startsWith('/admin') && !pathname.startsWith('/crm')) {
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
  const pb = createPB(cookieHeader);
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
  context.locals.user = pb.authStore.record as any
  context.locals.token = pb.authStore.token

  // Feature-based access control
  const user = pb.authStore.record
  const features = user?.feature || []

  const featureRouteMap = [
    { path: '/admin/projects', feature: UsersFeatureOptions.website },
    { path: '/admin/socials', feature: UsersFeatureOptions.website },
    { path: '/admin/gallery', feature: UsersFeatureOptions.website },
    { path: '/admin/company', feature: UsersFeatureOptions.website },
    { path: '/admin/testimonials', feature: UsersFeatureOptions.website },
    { path: '/admin/stats', feature: UsersFeatureOptions.website },
    { path: '/admin/blog', feature: UsersFeatureOptions.blog },
    { path: '/admin/dms', feature: UsersFeatureOptions.dms },
    { path: '/crm', feature: UsersFeatureOptions.crm },
  ]

  for (const route of featureRouteMap) {
    if (pathname.startsWith(route.path)) {
      if (!features.includes(route.feature)) {
        // If user doesn't have the feature, redirect to admin dashboard
        // But only if we are not already on the admin dashboard to avoid loops
        if (pathname !== '/admin') {
          return Response.redirect(new URL('/admin', context.url), 302)
        }
      }
    }
  }

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
