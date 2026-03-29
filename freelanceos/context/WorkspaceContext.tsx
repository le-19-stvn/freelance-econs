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
  setActiveWorkspaceId: (id: string) => void
  loading: boolean
  refetch: () => Promise<void>
}

const WorkspaceContext = createContext<WorkspaceContextValue>({
  workspaces: [],
  activeWorkspaceId: null,
  setActiveWorkspaceId: () => {},
  loading: true,
  refetch: async () => {},
})

export function useWorkspace() {
  return useContext(WorkspaceContext)
}

const STORAGE_KEY = 'freelanceos_active_workspace'

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [activeWorkspaceId, setActiveWorkspaceIdState] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const setActiveWorkspaceId = (id: string) => {
    setActiveWorkspaceIdState(id)
    try {
      localStorage.setItem(STORAGE_KEY, id)
    } catch {}
  }

  const fetchWorkspaces = useCallback(async () => {
    setLoading(true)
    try {
      const userId = await getAuthUserId(supabase)

      // Get workspace IDs this user belongs to
      const { data: memberships, error: memErr } = await supabase
        .from('workspace_members')
        .select('workspace_id')
        .eq('user_id', userId)

      if (memErr || !memberships?.length) {
        // No workspace yet — use RPC to atomically create workspace + owner membership
        const { data: newWsId, error: rpcErr } = await supabase
          .rpc('create_workspace_for_user', { ws_name: 'Mon Espace' })

        if (rpcErr || !newWsId) {
          setWorkspaces([])
          setActiveWorkspaceIdState(null)
          setLoading(false)
          return
        }

        const { data: freshWs } = await supabase
          .from('workspaces')
          .select('*')
          .eq('id', newWsId)
          .single()

        if (freshWs) {
          const ws: Workspace = {
            id: freshWs.id,
            name: freshWs.name,
            created_at: freshWs.created_at,
          }
          setWorkspaces([ws])
          setActiveWorkspaceIdState(ws.id)
          try { localStorage.setItem(STORAGE_KEY, ws.id) } catch {}
        }
        setLoading(false)
        return
      }

      const wsIds = memberships.map((m: any) => m.workspace_id)

      // Fetch workspace details
      const { data: ws, error: wsErr } = await supabase
        .from('workspaces')
        .select('*')
        .in('id', wsIds)
        .order('created_at', { ascending: true })

      if (wsErr || !ws?.length) {
        setWorkspaces([])
        setActiveWorkspaceIdState(null)
        setLoading(false)
        return
      }

      const workspaceList: Workspace[] = ws.map((w: any) => ({
        id: w.id,
        name: w.name,
        created_at: w.created_at,
      }))
      setWorkspaces(workspaceList)

      // Restore last active workspace from localStorage, fallback to first
      let savedId: string | null = null
      try {
        savedId = localStorage.getItem(STORAGE_KEY)
      } catch {}

      const validSaved = savedId && workspaceList.some((w) => w.id === savedId)
      setActiveWorkspaceIdState(validSaved ? savedId : workspaceList[0].id)
    } catch {
      setWorkspaces([])
      setActiveWorkspaceIdState(null)
    }
    setLoading(false)
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
