import { SupabaseClient } from '@supabase/supabase-js'

const DEMO_USER_ID = '00000000-0000-0000-0000-000000000000'

/**
 * Get the current user ID, or a demo ID if Supabase is not configured.
 * This allows the app to work in development without real Supabase credentials.
 */
export async function getAuthUserId(supabase: SupabaseClient): Promise<string> {
  const isConfigured =
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_URL !== ''

  if (!isConfigured) {
    return DEMO_USER_ID
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  return user.id
}
