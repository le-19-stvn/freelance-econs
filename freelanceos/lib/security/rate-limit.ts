import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { NextRequest, NextResponse } from 'next/server'

/**
 * Tiered rate limiter backed by Upstash Redis.
 *
 * Tiers target distinct abuse profiles:
 *  - default  (10 req / 10 s)   generic read/status endpoints
 *  - uploads  (5  req / 1 min)  avatar + logo uploads (storage + bandwidth)
 *  - emails   (5  req / 1 min)  invoice emails (protects Resend quota)
 *  - checkout (3  req / 1 min)  Stripe checkout + billing-portal creation
 *  - exports  (5  req / 1 min)  Excel / PDF bulk exports (CPU-heavy)
 *
 * Fails open if Upstash env vars are not set — which is intentional for
 * local dev but logged loudly in production so deploys without the env
 * vars can't silently ship with rate limiting disabled.
 */

export type RateLimitTier =
  | 'default'
  | 'uploads'
  | 'emails'
  | 'checkout'
  | 'exports'

type Duration = Parameters<typeof Ratelimit.slidingWindow>[1]

const TIER_CONFIG: Record<
  RateLimitTier,
  { requests: number; window: Duration }
> = {
  default: { requests: 10, window: '10 s' },
  uploads: { requests: 5, window: '1 m' },
  emails: { requests: 5, window: '1 m' },
  checkout: { requests: 3, window: '1 m' },
  exports: { requests: 5, window: '1 m' },
}

let redis: Redis | null = null
let redisInitialized = false
const limiters = new Map<RateLimitTier, Ratelimit>()

function getRedis(): Redis | null {
  if (redisInitialized) return redis
  redisInitialized = true

  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN

  if (!url || !token) {
    if (process.env.NODE_ENV === 'production') {
      console.warn(
        '[SECURITY] UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN is not set. ' +
          'Rate limiting is DISABLED in production. This is a security risk.'
      )
    }
    return null
  }

  redis = new Redis({ url, token })
  return redis
}

function getLimiter(tier: RateLimitTier): Ratelimit | null {
  if (limiters.has(tier)) return limiters.get(tier)!
  const r = getRedis()
  if (!r) return null

  const { requests, window } = TIER_CONFIG[tier]
  const limiter = new Ratelimit({
    redis: r,
    limiter: Ratelimit.slidingWindow(requests, window),
    analytics: false,
    prefix: `rl:${tier}`,
  })
  limiters.set(tier, limiter)
  return limiter
}

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    '127.0.0.1'
  )
}

/**
 * Route-handler rate limit (IP-based).
 * Returns a 429 NextResponse if the limit is exceeded, null otherwise.
 * Accepts an optional tier — defaults to 'default' to preserve existing
 * callers.
 */
export async function checkRateLimit(
  request: NextRequest,
  tier: RateLimitTier = 'default'
): Promise<NextResponse | null> {
  try {
    const limiter = getLimiter(tier)
    if (!limiter) return null // no Redis → allow

    const key = `${tier}:ip:${getClientIp(request)}`
    const { success, limit, remaining, reset } = await limiter.limit(key)

    if (!success) {
      const retryAfter = Math.max(1, Math.ceil((reset - Date.now()) / 1000))
      return NextResponse.json(
        { error: 'Trop de requêtes. Réessayez dans quelques instants.' },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': String(limit),
            'X-RateLimit-Remaining': String(remaining),
            'X-RateLimit-Reset': String(reset),
            'Retry-After': String(retryAfter),
          },
        }
      )
    }

    return null
  } catch (err) {
    // Redis outage → fail open, don't block users
    console.warn('Rate limit check failed (Redis unavailable):', err)
    return null
  }
}

/**
 * Server-action rate limit (user-id based).
 * Throws a user-friendly Error when the limit is exceeded — let the
 * exception bubble so the UI's catch(err) surfaces the message.
 * No-op when Upstash isn't configured (fail-open).
 */
export async function enforceUserRateLimit(
  userId: string,
  tier: RateLimitTier
): Promise<void> {
  const limiter = getLimiter(tier)
  if (!limiter) return

  try {
    const key = `${tier}:user:${userId}`
    const { success } = await limiter.limit(key)
    if (!success) {
      throw new RateLimitError()
    }
  } catch (err) {
    if (err instanceof RateLimitError) throw err
    // Redis outage → fail open
    console.warn('User rate limit check failed:', err)
  }
}

export class RateLimitError extends Error {
  constructor() {
    super(
      'Trop de tentatives. Merci de patienter quelques instants avant de réessayer.'
    )
    this.name = 'RateLimitError'
  }
}
