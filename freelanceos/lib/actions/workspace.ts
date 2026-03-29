'use client'

import { createClient } from '@/lib/supabase/client'
import { getAuthUserId } from '@/lib/supabase/auth-helper'

export async function createWorkspace(name: string): Promise<string> {
  const supabase = createClient()
  const userId = await getAuthUserId(supabase)

  // Insert the workspace
  const { data: workspace, error: wsErr } = await supabase
    .from('workspaces')
    .insert({ name, owner_id: userId })
    .select('id')
    .single()

  if (wsErr || !workspace) {
    throw new Error(wsErr?.message ?? 'Failed to create workspace')
  }

  // Insert the creator as owner
  const { error: memErr } = await supabase
    .from('workspace_members')
    .insert({
      workspace_id: workspace.id,
      user_id: userId,
      role: 'owner',
    })

  if (memErr) {
    throw new Error(memErr.message)
  }

  return workspace.id
}
