import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { NextRequest, NextResponse } from 'next/server'

/**
 * Rate limiter: 10 requests per 10 seconds per IP.
 * Falls back to allowing all requests if Redis env vars are not set (dev mode).
 */

let ratelimit: Ratelimit | null = null

function getRatelimit(): Ratelimit | null {
  if (ratelimit) return ratelimit

  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN

  if (!url || !token) {
    // No Redis configured — skip rate limiting (dev mode)
    return null
  }

  ratelimit = new Ratelimit({
    redis: new Redis({ url, token }),
    limiter: Ratelimit.slidingWindow(10, '10 s'),
    analytics: false,
  })

  return ratelimit
}

/**
 * Check rate limit for an incoming request.
 * Returns a 429 NextResponse if limit exceeded, or null if allowed.
 * If Redis is not configured, always returns null (allows the request).
 */
export async function checkRateLimit(request: NextRequest): Promise<NextResponse | null> {
  try {
    const limiter = getRatelimit()
    if (!limiter) return null // No Redis → allow

    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      ?? request.headers.get('x-real-ip')
      ?? '127.0.0.1'

    const { success, limit, remaining, reset } = await limiter.limit(ip)

    if (!success) {
      return NextResponse.json(
        { error: 'Trop de requêtes. Réessayez dans quelques secondes.' },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': String(limit),
            'X-RateLimit-Remaining': String(remaining),
            'X-RateLimit-Reset': String(reset),
            'Retry-After': '10',
          },
        }
      )
    }

    return null // Allowed
  } catch (err) {
    // Redis error → don't block the request, just log
    console.warn('Rate limit check failed (Redis unavailable):', err)
    return null
  }
}
