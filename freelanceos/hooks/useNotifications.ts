'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getAuthUserId } from '@/lib/supabase/auth-helper'
import type { Notification } from '@/types'

export function useNotifications() {
  const supabase = createClient()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  const fetchNotifications = useCallback(async () => {
    try {
      const userId = await getAuthUserId(supabase)
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .eq('is_read', false)
        .order('created_at', { ascending: false })
        .limit(20)
      setNotifications(data ?? [])
    } catch {
      setNotifications([])
    }
    setLoading(false)
  }, [supabase])

  useEffect(() => { fetchNotifications() }, [fetchNotifications])

  const markAsRead = async (id: string) => {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id)
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  const acceptTeamInvite = async (notif: Notification) => {
    if (!notif.team_id) return

    // Update team_members status to active
    const userId = await getAuthUserId(supabase)
    await supabase
      .from('team_members')
      .update({ status: 'active' })
      .eq('team_id', notif.team_id)
      .eq('user_id', userId)

    // Mark notification as read
    await markAsRead(notif.id)
  }

  const declineTeamInvite = async (notif: Notification) => {
    if (!notif.team_id) return

    // Remove the pending team_members row
    const userId = await getAuthUserId(supabase)
    await supabase
      .from('team_members')
      .delete()
      .eq('team_id', notif.team_id)
      .eq('user_id', userId)

    // Mark notification as read
    await markAsRead(notif.id)
  }

  return { notifications, loading, fetchNotifications, markAsRead, acceptTeamInvite, declineTeamInvite }
}
