'use client'

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react'
import { createClient } from '@/lib/supabase/client'
import { getAuthUserId } from '@/lib/supabase/auth-helper'
import type { Workspace } from '@/types'

interface WorkspaceContextValue {
  workspaces: Workspace[]
  activeWorkspaceId: string | null
  setActiveWorkspaceId: (id: string | null) => void
  loading: boolean
  refetch: () => Promise<void>
}

const WorkspaceContext = createContext<WorkspaceContextValue>({
  workspaces: [],
  activeWorkspaceId: null,
  setActiveWorkspaceId: () => {},
  loading: false,
  refetch: async () => {},
})

export function useWorkspace() {
  return useContext(WorkspaceContext)
}

const STORAGE_KEY = 'freelanceos_active_workspace'

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [activeWorkspaceId, setActiveWorkspaceIdState] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const setActiveWorkspaceId = (id: string | null) => {
    setActiveWorkspaceIdState(id)
    try {
      if (id) localStorage.setItem(STORAGE_KEY, id)
      else localStorage.removeItem(STORAGE_KEY)
    } catch {}
  }

  const fetchWorkspaces = useCallback(async () => {
    try {
      const userId = await getAuthUserId(supabase)

      const { data: memberships } = await supabase
        .from('workspace_members')
        .select('workspace_id')
        .eq('user_id', userId)

      if (!memberships?.length) {
        setWorkspaces([])
        setActiveWorkspaceIdState(null)
        setLoading(false)
        return
      }

      const wsIds = memberships.map((m: any) => m.workspace_id)

      const { data: ws } = await supabase
        .from('workspaces')
        .select('*')
        .in('id', wsIds)
        .order('created_at', { ascending: true })

      if (!ws?.length) {
        setWorkspaces([])
        setActiveWorkspaceIdState(null)
        return
      }

      const workspaceList: Workspace[] = ws.map((w: any) => ({
        id: w.id,
        name: w.name,
        created_at: w.created_at,
      }))
      setWorkspaces(workspaceList)

      // Restore saved workspace, or leave null (personal mode)
      let savedId: string | null = null
      try {
        savedId = localStorage.getItem(STORAGE_KEY)
      } catch {}

      const validSaved = savedId && workspaceList.some((w) => w.id === savedId)
      setActiveWorkspaceIdState(validSaved ? savedId : null)
    } catch {
      setWorkspaces([])
      setActiveWorkspaceIdState(null)
    }
  }, [supabase])

  useEffect(() => {
    fetchWorkspaces()
  }, [fetchWorkspaces])

  return (
    <WorkspaceContext.Provider
      value={{
        workspaces,
        activeWorkspaceId,
        setActiveWorkspaceId,
        loading,
        refetch: fetchWorkspaces,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  )
}
