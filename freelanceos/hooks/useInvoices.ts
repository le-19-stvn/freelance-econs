'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getAuthUserId } from '@/lib/supabase/auth-helper'
import { useWorkspace } from '@/context/WorkspaceContext'
import type { Invoice, InvoiceItem } from '@/types'

export function useInvoices() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()
  const { activeWorkspaceId } = useWorkspace()

  const fetchInvoices = useCallback(async () => {
    setLoading(true)
    setError(null)

    const userId = await getAuthUserId(supabase)

    let query = supabase
      .from('invoices')
      .select('*, client:clients(*), project:projects(*), items:invoice_items(*)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    const { data, error: err } = await query

    if (err) {
      setError(err.message)
    } else {
      setInvoices(data ?? [])
    }
    setLoading(false)
  }, [supabase, activeWorkspaceId])

  useEffect(() => {
    fetchInvoices()
  }, [fetchInvoices])

  const createInvoice = async (
    invoice: Omit<Invoice, 'id' | 'user_id' | 'workspace_id' | 'items' | 'client' | 'project'>,
    items: Omit<InvoiceItem, 'id' | 'invoice_id'>[]
  ) => {
    const userId = await getAuthUserId(supabase)

    const { data: inv, error: invErr } = await supabase
      .from('invoices')
      .insert({ ...invoice, user_id: userId, workspace_id: activeWorkspaceId ?? undefined })
      .select()
      .single()

    if (invErr) throw invErr

    if (items.length > 0) {
      const { error: itemsErr } = await supabase
        .from('invoice_items')
        .insert(items.map(item => ({ ...item, invoice_id: inv.id })))

      if (itemsErr) throw itemsErr
    }

    await fetchInvoices()
    return inv
  }

  const updateInvoice = async (
    id: string,
    updates: Partial<Invoice>,
    items?: Omit<InvoiceItem, 'id' | 'invoice_id'>[]
  ) => {
    const { client, project, items: _items, ...invoiceUpdates } = updates
    const { error: invErr } = await supabase
      .from('invoices')
      .update(invoiceUpdates)
      .eq('id', id)

    if (invErr) throw invErr

    if (items !== undefined) {
      await supabase.from('invoice_items').delete().eq('invoice_id', id)
      if (items.length > 0) {
        const { error: itemsErr } = await supabase
          .from('invoice_items')
          .insert(items.map(item => ({ ...item, invoice_id: id })))
        if (itemsErr) throw itemsErr
      }
    }

    await fetchInvoices()
  }

  const updateStatus = async (id: string, newStatus: Invoice['status']) => {
    const updates: Record<string, unknown> = { status: newStatus }

    const invoice = invoices.find(i => i.id === id)
    if (invoice && invoice.status === 'draft' && newStatus === 'sent') {
      updates.issue_date = new Date().toISOString().slice(0, 10)
    }

    const { error: err } = await supabase
      .from('invoices')
      .update(updates)
      .eq('id', id)

    if (err) throw err

    setInvoices(prev =>
      prev.map(i => (i.id === id ? { ...i, ...updates } as Invoice : i))
    )
  }

  const deleteInvoice = async (id: string) => {
    const { error: err } = await supabase.from('invoices').delete().eq('id', id)
    if (err) throw err
    setInvoices(prev => prev.filter(i => i.id !== id))
  }

  return { invoices, loading, error, fetchInvoices, createInvoice, updateInvoice, updateStatus, deleteInvoice }
}
