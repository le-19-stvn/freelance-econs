import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Free-plan usage limits.
 * Pro plan has no limits.
 */
export const FREE_LIMITS = {
  clients: 3,
  projects: 4,      // only counts active (ongoing) projects
  invoices: 5,
} as const

export type LimitResource = keyof typeof FREE_LIMITS

export interface LimitCheckResult {
  allowed: boolean
  error?: 'LIMIT_REACHED'
  message?: string
  current?: number
  max?: number
}

/**
 * Check whether the current user can create a new record of the given resource.
 * For projects, only "ongoing" projects count toward the limit.
 */
export async function checkPlanLimit(
  supabase: SupabaseClient,
  userId: string,
  resource: LimitResource
): Promise<LimitCheckResult> {
  // 1. Fetch user's plan_type
  const { data: profile } = await supabase
    .from('profiles')
    .select('plan_type')
    .eq('id', userId)
    .single()

  const planType = profile?.plan_type ?? 'free'

  // Pro users: no limits
  if (planType === 'pro') {
    return { allowed: true }
  }

  // 2. Count existing records
  const limit = FREE_LIMITS[resource]
  let count: number | null = null

  if (resource === 'clients') {
    const { data, error } = await supabase
      .from('clients')
      .select('id')
      .eq('user_id', userId)
    if (!error && Array.isArray(data)) count = data.length
  } else if (resource === 'projects') {
    // Only count active (ongoing) projects
    const { data, error } = await supabase
      .from('projects')
      .select('id')
      .eq('user_id', userId)
      .eq('status', 'ongoing')
    if (!error && Array.isArray(data)) count = data.length
  } else if (resource === 'invoices') {
    const { data, error } = await supabase
      .from('invoices')
      .select('id')
      .eq('user_id', userId)
    if (!error && Array.isArray(data)) count = data.length
  }

  // Fail closed: if we can't verify the count, block the action
  if (count === null) {
    return {
      allowed: false,
      error: 'LIMIT_REACHED',
      message: 'Impossible de vérifier la limite. Réessayez.',
    }
  }

  // 3. Enforce limit
  if (count >= limit) {
    return {
      allowed: false,
      error: 'LIMIT_REACHED',
      message: `Limite atteinte (${count}/${limit}). Passez au plan Pro pour continuer !`,
      current: count,
      max: limit,
    }
  }

  return { allowed: true, current: count, max: limit }
}
