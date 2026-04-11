import { SupabaseClient } from '@supabase/supabase-js'

const DEMO_USER_ID = '00000000-0000-0000-0000-000000000000'

/**
 * Get the current user ID, or a demo ID if Supabase is not configured (dev only).
 * In production, missing Supabase config will throw an error.
 */
export async function getAuthUserId(supabase: SupabaseClient): Promise<string> {
  const isConfigured =
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_URL !== ''

  if (!isConfigured) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[AUTH] Supabase not configured — using demo user ID. This must not happen in production.')
      return DEMO_USER_ID
    }
    throw new Error('Supabase is not configured. Cannot authenticate in production.')
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  return user.id
}

