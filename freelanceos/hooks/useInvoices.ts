'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getAuthUserId } from '@/lib/supabase/auth-helper'
import { checkPlanLimit } from '@/lib/plan-limits'
import type { Invoice, InvoiceItem } from '@/types'

export function useInvoices() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const fetchInvoices = useCallback(async () => {
    setLoading(true)
    setError(null)

    const userId = await getAuthUserId(supabase)
    const { data, error: err } = await supabase
      .from('invoices')
      .select('*, client:clients(*), project:projects(*), items:invoice_items(*)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (err) {
      setError(err.message)
    } else {
      setInvoices(data ?? [])
    }
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    fetchInvoices()
  }, [fetchInvoices])

  const createInvoice = async (
    invoice: Omit<Invoice, 'id' | 'user_id' | 'workspace_id' | 'items' | 'client' | 'project'>,
    items: Omit<InvoiceItem, 'id' | 'invoice_id'>[]
  ) => {
    const userId = await getAuthUserId(supabase)

    // ── Plan limit check ──
    const limitCheck = await checkPlanLimit(supabase, userId, 'invoices')
    if (!limitCheck.allowed) {
      throw { error: limitCheck.error, message: limitCheck.message }
    }

    const { data: inv, error: invErr } = await supabase
      .from('invoices')
      .insert({ ...invoice, user_id: userId })
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

    // ── Pro: schedule / cancel automatic reminders (J+3, J+7, J+15) ──
    try {
      const userId = await getAuthUserId(supabase)
      const { data: profile } = await supabase
        .from('profiles')
        .select('plan_type')
        .eq('id', userId)
        .single()

      if (profile?.plan_type !== 'pro') return

      if (newStatus === 'sent' && invoice?.due_date) {
        const due = new Date(invoice.due_date)
        const reminders = [
          { step: 1, offset: 3 },
          { step: 2, offset: 7 },
          { step: 3, offset: 15 },
        ].map(r => ({
          invoice_id: id,
          user_id: userId,
          sequence_step: r.step,
          scheduled_at: new Date(due.getTime() + r.offset * 86400000).toISOString(),
          status: 'pending' as const,
        }))

        await supabase
          .from('invoice_reminders')
          .delete()
          .eq('invoice_id', id)
          .eq('status', 'pending')

        await supabase.from('invoice_reminders').insert(reminders)
      } else if (newStatus === 'paid' || newStatus === 'draft') {
        await supabase
          .from('invoice_reminders')
          .update({ status: 'failed' })
          .eq('invoice_id', id)
          .eq('status', 'pending')
      }
    } catch (err) {
      // Silently ignore — reminder scheduling shouldn't block status updates
      console.warn('Reminder scheduling skipped:', err)
    }
  }

  const deleteInvoice = async (id: string) => {
    const { error: err } = await supabase.from('invoices').delete().eq('id', id)
    if (err) throw err
    setInvoices(prev => prev.filter(i => i.id !== id))
  }

  return { invoices, loading, error, fetchInvoices, createInvoice, updateInvoice, updateStatus, deleteInvoice }
}
