'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { getAuthUserId } from '@/lib/supabase/auth-helper'
import { uploadAvatar } from '@/lib/actions/avatar'
import { useRouter } from 'next/navigation'
import type { Profile } from '@/types'
import { Pencil, LogOut, Shield, AlertTriangle, User, Save } from 'lucide-react'

const inputCls = 'w-full px-4 py-3 rounded-none bg-[#f5f5f5] border border-[#d9d9d9] text-sm text-[#0a0a0a] outline-none focus:border-[#0a0a0a] transition-colors tracking-[-0.02em] font-sans'
const labelCls = 'block text-[11px] font-semibold text-[#0a0a0a]/50 tracking-[-0.02em] mb-1.5 font-mono'
const cardCls = 'bg-white border border-[#d9d9d9] p-6 md:p-8'

export default function ProfilPage() {
  const supabase = createClient()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)
  const [authMethod, setAuthMethod] = useState<string>('Email')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState({ full_name: '', email: '' })
  const [passwordForm, setPasswordForm] = useState({ newPass: '', confirm: '' })

  const fetchProfile = useCallback(async () => {
    setLoading(true)
    const userId = await getAuthUserId(supabase).catch(() => null)
    if (!userId) { setLoading(false); return }

    const { data: { user } } = await supabase.auth.getUser()
    if (user?.app_metadata?.provider) {
      setAuthMethod(user.app_metadata.provider === 'google' ? 'Google' : 'Email')
    }

    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single()
    if (data) {
      const p = data as Profile
      setAvatarUrl(p.avatar_url ?? null)
      setForm({ full_name: p.full_name ?? '', email: p.email ?? '' })
    }
    setLoading(false)
  }, [supabase])

  useEffect(() => { fetchProfile() }, [fetchProfile])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 3500)
    return () => clearTimeout(t)
  }, [toast])

  const handleSave = async () => {
    setSaving(true)
    const userId = await getAuthUserId(supabase).catch(() => null)
    if (!userId) { setSaving(false); return }

    const { error } = await supabase.from('profiles').update({
      full_name: form.full_name || null,
      email: form.email,
    }).eq('id', userId)

    setToast(error
      ? { msg: 'Erreur lors de la sauvegarde', type: 'error' }
      : { msg: 'Profil sauvegarde', type: 'success' }
    )
    setSaving(false)
  }

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setToast(null)
    try {
      const url = await uploadAvatar(file)
      setAvatarUrl(url)
      setToast({ msg: 'Photo mise a jour', type: 'success' })
    } catch (err: any) {
      setToast({ msg: err?.message ?? "Erreur lors de l'upload", type: 'error' })
    }
    setUploading(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handlePasswordChange = async () => {
    if (passwordForm.newPass !== passwordForm.confirm) {
      setToast({ msg: 'Les mots de passe ne correspondent pas', type: 'error' })
      return
    }
    if (passwordForm.newPass.length < 6) {
      setToast({ msg: 'Minimum 6 caracteres', type: 'error' })
      return
    }
    const { error } = await supabase.auth.updateUser({ password: passwordForm.newPass })
    setToast(error
      ? { msg: error.message, type: 'error' }
      : { msg: 'Mot de passe mis a jour', type: 'success' }
    )
    if (!error) setPasswordForm({ newPass: '', confirm: '' })
  }

  const handleDeleteAccount = async () => {
    if (!window.confirm('Supprimer definitivement votre compte ? Cette action est irreversible.')) return
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto flex flex-col gap-8">
        <div className={`${cardCls} animate-pulse`}>
          <div className="flex items-center gap-5">
            <div className="w-[80px] h-[80px] bg-[#f0f0f0]" />
            <div className="flex-1">
              <div className="h-5 w-40 bg-[#f0f0f0] mb-2" />
              <div className="h-3 w-28 bg-[#f0f0f0]" />
            </div>
          </div>
        </div>
        {[1, 2].map((i) => (
          <div key={i} className={`${cardCls} animate-pulse`}>
            <div className="h-4 w-32 bg-[#f0f0f0] mb-6" />
            <div className="space-y-4">
              <div className="h-10 w-full bg-[#f0f0f0]" />
              <div className="h-10 w-full bg-[#f0f0f0]" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-8 font-sans">

      {/* ═══ TOAST ═══ */}
      {toast && (
        <div className={`fixed top-4 right-4 z-[100] px-5 py-3 text-[13px] font-medium tracking-[-0.02em] border font-sans ${
          toast.type === 'success'
            ? 'bg-white text-[#0a0a0a] border-[#d9d9d9]'
            : 'bg-red-50 text-red-700 border-red-200'
        }`}>
          {toast.msg}
        </div>
      )}

      {/* Hidden file input */}
      <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={handleAvatarChange} className="hidden" />

      {/* ═══ PAGE HEADER ═══ */}
      <div>
        <span className="text-[11px] font-medium text-[#0a0a0a]/40 font-mono">(Profil)</span>
        <h1 className="text-2xl font-bold text-[#0a0a0a] tracking-tight mt-1 font-sans">Mon profil</h1>
      </div>

      {/* ═══ AVATAR HEADER ═══ */}
      <div className={cardCls}>
        <div className="flex items-center gap-5">
          <div className="relative shrink-0">
            {avatarUrl ? (
              <Image src={avatarUrl} alt="Avatar" width={80} height={80} className="rounded-none object-cover w-[80px] h-[80px] border border-[#d9d9d9]" unoptimized />
            ) : (
              <div className="w-[80px] h-[80px] rounded-none bg-[#0a0a0a] flex items-center justify-center text-white font-extrabold text-[32px] font-sans">
                {(form.full_name?.[0] ?? 'F').toUpperCase()}
              </div>
            )}
            <button
              type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading}
              className={`absolute -bottom-1 -right-1 w-7 h-7 rounded-none bg-[#0a0a0a] border-2 border-white flex items-center justify-center ${uploading ? 'cursor-wait' : 'cursor-pointer hover:bg-[#0a0a0a]/80'} transition-colors`}
              title="Modifier la photo"
            >
              {uploading
                ? <span className="w-3 h-3 border-2 border-white/30 border-t-white inline-block animate-spin" />
                : <Pencil size={12} className="text-white" />
              }
            </button>
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-[#0a0a0a] tracking-tight truncate font-sans">{form.full_name || 'Freelance'}</h2>
            <p className="text-sm text-zinc-500 tracking-[-0.02em] truncate mt-0.5 font-sans">{form.email || 'email@exemple.fr'}</p>
            <button
              type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading}
              className="mt-3 px-4 py-1.5 rounded-none bg-[#0a0a0a] text-white text-[12px] font-semibold tracking-[-0.02em] hover:bg-[#0a0a0a]/80 transition-colors cursor-pointer disabled:opacity-60 font-sans"
            >
              {uploading ? 'Upload...' : 'Modifier la photo'}
            </button>
          </div>
        </div>
      </div>

      {/* ═══ IDENTITE ═══ */}
      <div className={cardCls}>
        <div className="mb-6">
          <span className="text-[11px] font-medium text-[#0a0a0a]/40 font-mono">(Identite)</span>
          <h2 className="text-base font-semibold text-[#0a0a0a] tracking-tight flex items-center gap-2 font-sans">
            <User size={16} className="text-[#0a0a0a]/40" />
            Informations personnelles
          </h2>
        </div>

        <div className="space-y-4">
          <div>
            <label className={labelCls}>(nom_complet)</label>
            <input type="text" value={form.full_name} onChange={(e) => setForm(f => ({ ...f, full_name: e.target.value }))} placeholder="Jean Dupont" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>(email)</label>
            <input type="email" value={form.email} onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))} placeholder="jean@exemple.fr" className={inputCls} />
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button onClick={handleSave} disabled={saving} className="px-6 py-2.5 rounded-none bg-[#0a0a0a] text-white text-sm font-semibold tracking-[-0.02em] hover:bg-[#0a0a0a]/90 transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2 font-sans">
            <Save size={14} />
            {saving ? 'Sauvegarde...' : 'Sauvegarder'}
          </button>
        </div>
      </div>

      {/* ═══ SECURITE ═══ */}
      <div className={cardCls}>
        <div className="mb-6">
          <span className="text-[11px] font-medium text-[#0a0a0a]/40 font-mono">(Securite)</span>
          <h2 className="text-base font-semibold text-[#0a0a0a] tracking-tight flex items-center gap-2 font-sans">
            <Shield size={16} className="text-[#0a0a0a]/40" />
            Securite
          </h2>
        </div>

        <div className="border border-[#d9d9d9] p-4 mb-5">
          <label className={labelCls}>(methode_connexion)</label>
          <span className="inline-block px-3 py-1 rounded-none bg-[#f5f5f5] border border-[#d9d9d9] text-[12px] font-semibold text-[#0a0a0a] font-mono">{authMethod}</span>
        </div>

        <div className="space-y-3">
          <label className={labelCls}>(nouveau_mot_de_passe)</label>
          <input type="password" value={passwordForm.newPass} onChange={(e) => setPasswordForm(f => ({ ...f, newPass: e.target.value }))} placeholder="Nouveau mot de passe" className={inputCls} />
          <input type="password" value={passwordForm.confirm} onChange={(e) => setPasswordForm(f => ({ ...f, confirm: e.target.value }))} placeholder="Confirmer le mot de passe" className={inputCls} />
          <div className="flex justify-end pt-2">
            <button onClick={handlePasswordChange} disabled={!passwordForm.newPass} className="px-5 py-2 rounded-none bg-[#0a0a0a] text-white text-sm font-semibold tracking-[-0.02em] hover:bg-[#0a0a0a]/90 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed font-sans">
              Mettre a jour
            </button>
          </div>
        </div>
      </div>

      {/* ═══ ZONE DE DANGER ═══ */}
      <div className="border border-red-200 p-6 md:p-8">
        <div className="mb-4">
          <span className="text-[11px] font-medium text-red-400 font-mono">(danger)</span>
          <h2 className="text-base font-semibold text-red-600 tracking-tight flex items-center gap-2 font-sans">
            <AlertTriangle size={16} />
            Zone de danger
          </h2>
        </div>
        <p className="text-sm text-[#0a0a0a]/50 tracking-[-0.02em] mb-4 font-sans">
          La suppression de votre compte est definitive. Toutes vos donnees seront perdues.
        </p>
        <button onClick={handleDeleteAccount} className="px-5 py-2.5 rounded-none border border-red-300 bg-transparent text-red-600 text-sm font-semibold tracking-[-0.02em] hover:bg-red-50 hover:border-red-400 transition-colors cursor-pointer font-sans">
          Supprimer mon compte
        </button>
      </div>

      {/* ═══ DECONNEXION ═══ */}
      <div className="flex justify-center pb-4">
        <button onClick={async () => { await supabase.auth.signOut(); router.push('/login') }} className="px-6 py-2.5 rounded-none border border-[#d9d9d9] text-[#0a0a0a]/60 hover:text-[#0a0a0a] hover:border-[#0a0a0a] text-sm font-semibold bg-white transition-colors cursor-pointer flex items-center gap-2 font-sans">
          <LogOut size={14} />
          Deconnexion
        </button>
      </div>
    </div>
  )
}
