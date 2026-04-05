'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getAuthUserId } from '@/lib/supabase/auth-helper'
import type { Team, TeamMember, TeamProject, TeamTask, TaskStatus } from '@/types'

export function useTeams() {
  const supabase = createClient()
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)

  const fetchTeams = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('teams')
      .select('*')
      .order('created_at', { ascending: false })
    setTeams(data ?? [])
    setLoading(false)
  }, [supabase])

  useEffect(() => { fetchTeams() }, [fetchTeams])

  const createTeam = async (name: string): Promise<Team> => {
    const { data, error } = await supabase.rpc('create_team_with_owner', { _name: name })
    if (error) throw error
    await fetchTeams()
    return teams[0]
  }

  return { teams, loading, fetchTeams, createTeam }
}

export function useTeamMembers(teamId: string | null) {
  const supabase = createClient()
  const [members, setMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)

  const fetchMembers = useCallback(async () => {
    if (!teamId) { setMembers([]); setLoading(false); return }
    setLoading(true)
    const { data } = await supabase
      .from('team_members')
      .select('*, profile:profiles(email, full_name)')
      .eq('team_id', teamId)
      .order('created_at', { ascending: true })
    const rows: TeamMember[] = (data ?? []).map((m: any) => ({
      id: m.id,
      team_id: m.team_id,
      user_id: m.user_id,
      role: m.role,
      status: m.status ?? 'active',
      created_at: m.created_at,
      email: m.profile?.email ?? '',
      full_name: m.profile?.full_name ?? null,
    }))
    setMembers(rows)
    setLoading(false)
  }, [supabase, teamId])

  useEffect(() => { fetchMembers() }, [fetchMembers])

  const addMember = async (email: string, role: string = 'member') => {
    // 1. Find the user by email
    const { data: profile, error: pErr } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email.trim())
      .single()
    if (pErr || !profile) throw new Error("Aucun utilisateur trouve avec cet email.")

    // 2. Insert as pending
    const { error } = await supabase
      .from('team_members')
      .insert({ team_id: teamId, user_id: profile.id, role, status: 'pending' })
    if (error) throw error

    // 3. Get team name for notification message
    const { data: team } = await supabase
      .from('teams')
      .select('name')
      .eq('id', teamId!)
      .single()

    // 4. Create TEAM_INVITE notification for the invited user
    await supabase.from('notifications').insert({
      user_id: profile.id,
      type: 'TEAM_INVITE',
      message: `Vous avez ete invite a rejoindre l'equipe "${team?.name ?? 'Equipe'}"`,
      team_id: teamId,
    })

    await fetchMembers()
  }

  const removeMember = async (userId: string) => {
    await supabase
      .from('team_members')
      .delete()
      .eq('team_id', teamId!)
      .eq('user_id', userId)
    await fetchMembers()
  }

  return { members, loading, fetchMembers, addMember, removeMember }
}

export function useTeamProjects(teamId: string | null) {
  const supabase = createClient()
  const [projects, setProjects] = useState<TeamProject[]>([])
  const [loading, setLoading] = useState(true)

  const fetchProjects = useCallback(async () => {
    if (!teamId) { setProjects([]); setLoading(false); return }
    setLoading(true)
    const { data } = await supabase
      .from('team_projects')
      .select('*')
      .eq('team_id', teamId)
      .order('created_at', { ascending: false })
    setProjects(data ?? [])
    setLoading(false)
  }, [supabase, teamId])

  useEffect(() => { fetchProjects() }, [fetchProjects])

  const createProject = async (name: string, description?: string) => {
    const { data, error } = await supabase
      .from('team_projects')
      .insert({ team_id: teamId, name, description: description || null })
      .select()
      .single()
    if (error) throw error
    setProjects(prev => [data, ...prev])
    return data
  }

  const deleteProject = async (id: string) => {
    await supabase.from('team_projects').delete().eq('id', id)
    setProjects(prev => prev.filter(p => p.id !== id))
  }

  return { projects, loading, fetchProjects, createProject, deleteProject }
}

export function useTeamTasks(projectId: string | null) {
  const supabase = createClient()
  const [tasks, setTasks] = useState<TeamTask[]>([])
  const [loading, setLoading] = useState(true)

  const fetchTasks = useCallback(async () => {
    if (!projectId) { setTasks([]); setLoading(false); return }
    setLoading(true)
    const { data } = await supabase
      .from('team_tasks')
      .select('*, assignee:profiles!team_tasks_assigned_to_fkey(full_name)')
      .eq('project_id', projectId)
      .order('position', { ascending: true })
    const rows: TeamTask[] = (data ?? []).map((t: any) => ({
      ...t,
      assignee_name: t.assignee?.full_name ?? null,
    }))
    setTasks(rows)
    setLoading(false)
  }, [supabase, projectId])

  useEffect(() => { fetchTasks() }, [fetchTasks])

  const createTask = async (title: string, status: TaskStatus = 'todo') => {
    const maxPos = tasks.filter(t => t.status === status).reduce((max, t) => Math.max(max, t.position), -1)
    const { data, error } = await supabase
      .from('team_tasks')
      .insert({ project_id: projectId, title, status, position: maxPos + 1 })
      .select()
      .single()
    if (error) throw error
    setTasks(prev => [...prev, { ...data, assignee_name: null }])
    return data
  }

  const updateTaskStatus = async (taskId: string, status: TaskStatus) => {
    const { error } = await supabase
      .from('team_tasks')
      .update({ status })
      .eq('id', taskId)
    if (error) throw error
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status } : t))
  }

  const assignTask = async (taskId: string, userId: string | null) => {
    const { error } = await supabase
      .from('team_tasks')
      .update({ assigned_to: userId })
      .eq('id', taskId)
    if (error) throw error
    await fetchTasks()
  }

  const deleteTask = async (taskId: string) => {
    await supabase.from('team_tasks').delete().eq('id', taskId)
    setTasks(prev => prev.filter(t => t.id !== taskId))
  }

  return { tasks, loading, fetchTasks, createTask, updateTaskStatus, assignTask, deleteTask }
}
