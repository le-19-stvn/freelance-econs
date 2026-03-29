'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getAuthUserId } from '@/lib/supabase/auth-helper'
import type { Client } from '@/types'

export function useClients() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const fetchClients = useCallback(async () => {
    setLoading(true)
    setError(null)

    const userId = await getAuthUserId(supabase)
    const { data, error: err } = await supabase
      .from('clients')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (err) {
      setError(err.message)
    } else {
      setClients(data ?? [])
    }
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    fetchClients()
  }, [fetchClients])

  const createClient_ = async (client: Omit<Client, 'id' | 'user_id' | 'workspace_id' | 'created_at'>) => {
    const userId = await getAuthUserId(supabase)
    const { data, error: err } = await supabase
      .from('clients')
      .insert({ ...client, user_id: userId })
      .select()
      .single()

    if (err) throw err
    setClients(prev => [data, ...prev])
    return data
  }

  const updateClient = async (id: string, updates: Partial<Client>) => {
    const { data, error: err } = await supabase
      .from('clients')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (err) throw err
    setClients(prev => prev.map(c => (c.id === id ? data : c)))
    return data
  }

  const deleteClient = async (id: string) => {
    const { error: err } = await supabase.from('clients').delete().eq('id', id)
    if (err) throw err
    setClients(prev => prev.filter(c => c.id !== id))
  }

  return { clients, loading, error, fetchClients, createClient: createClient_, updateClient, deleteClient }
}
