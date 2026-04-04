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

    // Auto-generate draft invoice with deliverables when project is marked as done
    if (updates.status === 'done') {
      const { data: existing } = await supabase
        .from('invoices')
        .select('id')
        .eq('project_id', id)
        .limit(1)

      if (!existing || existing.length === 0) {
        const userId = await getAuthUserId(supabase)
        const today = new Date().toISOString().slice(0, 10)
        const invoiceNumber = `FAC-${Date.now().toString(36).toUpperCase()}`

        // Get user's default TVA rate
        const { data: profile } = await supabase
          .from('profiles')
          .select('tva_rate')
          .eq('id', userId)
          .single()

        const { data: inv, error: invErr } = await supabase
          .from('invoices')
          .insert({
            user_id: userId,
            client_id: data.client_id,
            project_id: id,
            invoice_number: invoiceNumber,
            status: 'draft',
            issue_date: today,
            tva_rate: profile?.tva_rate ?? 20,
            notes: `Facture - ${data.name}`,
          })
          .select()
          .single()

        if (!invErr && inv) {
          // Auto-fill invoice_items from project deliverables
          const deliverables = data.deliverables ?? []
          if (deliverables.length > 0) {
            const items = deliverables.map((d: { description: string; quantity: number; unit: string; unit_price: number }) => ({
              invoice_id: inv.id,
              description: d.description,
              quantity: d.quantity,
              unit_type: d.unit,
              unit_price: d.unit_price,
            }))

            await supabase.from('invoice_items').insert(items)
          }

          invoiceGenerated = true
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
