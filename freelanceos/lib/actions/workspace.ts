'use client'

import { createClient } from '@/lib/supabase/client'

export async function createWorkspace(name: string): Promise<string> {
  const supabase = createClient()

  const { data: wsId, error } = await supabase
    .rpc('create_workspace_for_user', { ws_name: name })

  if (error || !wsId) {
    throw new Error(error?.message ?? 'Failed to create workspace')
  }

  return wsId
}
