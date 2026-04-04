'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getAuthUserId } from '@/lib/supabase/auth-helper'
import { checkPlanLimit } from '@/lib/plan-limits'
import type { Project } from '@/types'

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const fetchProjects = useCallback(async () => {
    setLoading(true)
    setError(null)

    const userId = await getAuthUserId(supabase)
    const { data, error: err } = await supabase
      .from('projects')
      .select('*, client:clients(*)')
      .eq('user_id', userId)
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
    project: Omit<Project, 'id' | 'user_id' | 'workspace_id' | 'invoice_generated' | 'client'>
  ) => {
    const userId = await getAuthUserId(supabase)

    // ── Plan limit check (only counts "ongoing" projects) ──
    const limitCheck = await checkPlanLimit(supabase, userId, 'projects')
    if (!limitCheck.allowed) {
      throw { error: limitCheck.error, message: limitCheck.message }
    }

    const { data, error: err } = await supabase
      .from('projects')
      .insert({ ...project, user_id: userId })
      .select('*, client:clients(*)')
      .single()

    if (err) throw err
    setProjects(prev => [data, ...prev])
    return data
  }

  const updateProject = async (id: string, updates: Partial<Project>): Promise<Project & { invoiceGenerated?: boolean }> => {
    const { data, error: err } = await supabase
      .from('projects')
      .update(updates)
      .eq('id', id)
      .select('*, client:clients(*)')
      .single()

    if (err) throw err
    setProjects(prev => prev.map(p => (p.id === id ? data : p)))

    let invoiceGenerated = false

    // Auto-generate draft invoice when project is marked as done
    if (updates.status === 'done') {
      // Check if an invoice already exists for this project
      const { data: existing } = await supabase
        .from('invoices')
        .select('id')
        .eq('project_id', id)
        .limit(1)

      if (!existing || existing.length === 0) {
        const userId = await getAuthUserId(supabase)
        const today = new Date().toISOString().slice(0, 10)
        const invoiceNumber = `FAC-${Date.now().toString(36).toUpperCase()}`

        const { error: invErr } = await supabase
          .from('invoices')
          .insert({
            user_id: userId,
            client_id: data.client_id,
            project_id: id,
            invoice_number: invoiceNumber,
            status: 'draft',
            issue_date: today,
            tva_rate: 0,
            notes: `Facture - ${data.name}`,
          })

        if (!invErr) {
          invoiceGenerated = true
          // Mark project so we know an invoice was generated
          await supabase.from('projects').update({ invoice_generated: true }).eq('id', id)
          setProjects(prev => prev.map(p => (p.id === id ? { ...p, invoice_generated: true } : p)))
        }
      }
    }

    return { ...data, invoiceGenerated }
  }

  const deleteProject = async (id: string) => {
    const { error: err } = await supabase.from('projects').delete().eq('id', id)
    if (err) throw err
    setProjects(prev => prev.filter(p => p.id !== id))
  }

  return { projects, loading, error, fetchProjects, createProject, updateProject, deleteProject }
}
