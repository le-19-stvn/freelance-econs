import { NextRequest, NextResponse } from 'next/server'

/**
 * Validate that the request Origin matches the application domain.
 * Blocks cross-origin POST requests to prevent CSRF attacks.
 *
 * - Reads the Origin header (or Referer as fallback).
 * - Compares against NEXT_PUBLIC_APP_URL or the Host header.
 * - In development (localhost), always allows.
 * - Stripe webhooks should NOT use this check (they come from Stripe servers).
 *
 * Returns a 403 NextResponse if blocked, or null if allowed.
 */
export function checkOrigin(request: NextRequest): NextResponse | null {
  const origin = request.headers.get('origin')
  const referer = request.headers.get('referer')
  const host = request.headers.get('host') ?? ''

  // In development, allow all origins
  if (process.env.NODE_ENV === 'development') {
    return null
  }

  // Determine the source origin
  const sourceOrigin = origin ?? (referer ? new URL(referer).origin : null)

  // If no Origin/Referer at all, block the request (non-browser or scripted)
  if (!sourceOrigin) {
    return NextResponse.json(
      { error: 'Requête refusée : origine manquante' },
      { status: 403 }
    )
  }

  // Build the allowed origin from env or host header
  const appUrl = process.env.NEXT_PUBLIC_APP_URL
  const allowedOrigins: string[] = []

  if (appUrl) {
    try {
      allowedOrigins.push(new URL(appUrl).origin)
    } catch {
      // Invalid URL in env — ignore
    }
  }

  // Also allow the Host header as origin (covers cases where APP_URL is not set)
  if (host) {
    const protocol = request.headers.get('x-forwarded-proto') ?? 'https'
    allowedOrigins.push(`${protocol}://${host}`)
  }

  // Check if the source origin matches any allowed origin
  const isAllowed = allowedOrigins.some(
    (allowed) => sourceOrigin.toLowerCase() === allowed.toLowerCase()
  )

  if (!isAllowed) {
    return NextResponse.json(
      { error: 'Requête refusée : origine non autorisée' },
      { status: 403 }
    )
  }

  return null // Allowed
}
