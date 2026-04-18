'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getAuthUserId } from '@/lib/supabase/auth-helper'

const MAX_SIZE = 2 * 1024 * 1024 // 2MB
// SVG is intentionally excluded — it can embed <script> / foreignObject
// payloads that execute when the logo is rendered in a browser context.
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

export async function uploadLogo(formData: FormData): Promise<string> {
  const file = formData.get('file') as File | null
  if (!file) throw new Error('Aucun fichier fourni.')

  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error('Format non supporte. Utilisez JPG, PNG ou WebP.')
  }
  if (file.size > MAX_SIZE) {
    throw new Error('Le fichier est trop volumineux (max 2 Mo).')
  }

  const supabase = createServerSupabaseClient()
  const userId = await getAuthUserId(supabase)

  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'png'
  const path = `${userId}/invoice-logo.${ext}`

  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  const { error: uploadErr } = await supabase.storage
    .from('avatars')
    .upload(path, buffer, { upsert: true, contentType: file.type })

  if (uploadErr) throw new Error(uploadErr.message)

  const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path)
  const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`

  const { error: updateErr } = await supabase
    .from('profiles')
    .update({ invoice_logo_url: publicUrl })
    .eq('id', userId)

  if (updateErr) throw new Error(updateErr.message)

  return publicUrl
}
