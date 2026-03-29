'use client'

import { createClient } from '@/lib/supabase/client'
import { getAuthUserId } from '@/lib/supabase/auth-helper'

const MAX_SIZE = 2 * 1024 * 1024 // 2MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

export async function uploadAvatar(file: File): Promise<string> {
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error('Format non supporté. Utilisez JPG, PNG, WebP ou GIF.')
  }
  if (file.size > MAX_SIZE) {
    throw new Error('Le fichier est trop volumineux (max 2 Mo).')
  }

  const supabase = createClient()
  const userId = await getAuthUserId(supabase)

  const ext = file.name.split('.').pop() ?? 'png'
  const path = `${userId}/avatar.${ext}`

  // Upload (upsert to overwrite existing)
  const { error: uploadErr } = await supabase.storage
    .from('avatars')
    .upload(path, file, { upsert: true, contentType: file.type })

  if (uploadErr) throw new Error(uploadErr.message)

  // Get public URL
  const { data: urlData } = supabase.storage
    .from('avatars')
    .getPublicUrl(path)

  const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`

  // Update profile
  const { error: updateErr } = await supabase
    .from('profiles')
    .update({ avatar_url: publicUrl })
    .eq('id', userId)

  if (updateErr) throw new Error(updateErr.message)

  return publicUrl
}
