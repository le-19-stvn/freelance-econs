'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getAuthUserId } from '@/lib/supabase/auth-helper'
import type { Project } from '@/types'

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const fetchProjects = useCallback(async () => {
    setLoading(true)
    setError(null)
    const { data, error: err } = await supabase
      .from('projects')
      .select('*, client:clients(*)')
      .order('created_at', { ascending: false })

    if (err) {
      setError(err.message)
    } else {
      setProjects(data ?? [])
    }
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    fetchProjects()
  }, [fetchProjects])

  const createProject = async (
    project: Omit<Project, 'id' | 'user_id' | 'invoice_generated' | 'client'>
  ) => {
    const userId = await getAuthUserId(supabase)

    const { data, error: err } = await supabase
      .from('projects')
      .insert({ ...project, user_id: userId })
      .select('*, client:clients(*)')
      .single()

    if (err) throw err
    setProjects(prev => [data, ...prev])
    return data
  }

  const updateProject = async (id: string, updates: Partial<Project>) => {
    const { data, error: err } = await supabase
      .from('projects')
      .update(updates)
      .eq('id', id)
      .select('*, client:clients(*)')
      .single()

    if (err) throw err
    setProjects(prev => prev.map(p => (p.id === id ? data : p)))
    return data
  }

  const deleteProject = async (id: string) => {
    const { error: err } = await supabase.from('projects').delete().eq('id', id)
    if (err) throw err
    setProjects(prev => prev.filter(p => p.id !== id))
  }

  return { projects, loading, error, fetchProjects, createProject, updateProject, deleteProject }
}
