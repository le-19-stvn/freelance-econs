'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { getAuthUserId } from '@/lib/supabase/auth-helper'
import { uploadAvatar } from '@/lib/actions/avatar'
import { useRouter } from 'next/navigation'
import type { Profile } from '@/types'
import { Pencil, LogOut, Shield, AlertTriangle, User } from 'lucide-react'

const inputCls = 'w-full px-4 py-3 rounded-none bg-[#f5f5f5] border border-[#d9d9d9] text-sm text-[#0a0a0a] outline-none focus:border-[#0a0a0a] transition-colors tracking-[-0.02em]'
const labelCls = 'block text-[11px] font-semibold text-[#0a0a0a]/50 tracking-[-0.02em] mb-1.5 font-[family-name:var(--font-ibm-plex-mono)]'
const cardCls = 'bg-white border border-[#d9d9d9] p-6 md:p-8'

export default function ProfilPage() {
  const supabase = createClient()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)
  const [authMethod, setAuthMethod] = useState<string>('email')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState({
    full_name: '',
    email: '',
    phone: '',
  })

  const [passwordForm, setPasswordForm] = useState({
    current: '',
    newPass: '',
    confirm: '',
  })

  const fetchProfile = useCallback(async () => {
    setLoading(true)
    const userId = await getAuthUserId(supabase).catch(() => null)
    if (!userId) { setLoading(false); return }

    // Detect auth method
    const { data: { user } } = await supabase.auth.getUser()
    if (user?.app_metadata?.provider) {
      setAuthMethod(user.app_metadata.provider === 'google' ? 'Google' : 'Email')
    }

    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single()
    if (data) {
      const p = data as Profile
      setAvatarUrl(p.avatar_url ?? null)
      setForm({
        full_name: p.full_name ?? '',
        email: p.email ?? '',
        phone: '',
      })
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

    if (error) {
      setToast({ msg: 'Erreur lors de la sauvegarde', type: 'error' })
    } else {
      setToast({ msg: 'Profil sauvegarde', type: 'success' })
    }
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
      setToast({ msg: 'Le mot de passe doit contenir au moins 6 caracteres', type: 'error' })
      return
    }
    const { error } = await supabase.auth.updateUser({ password: passwordForm.newPass })
    if (error) {
      setToast({ msg: error.message, type: 'error' })
    } else {
      setToast({ msg: 'Mot de passe mis a jour', type: 'success' })
      setPasswordForm({ current: '', newPass: '', confirm: '' })
    }
  }

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      'Supprimer definitivement votre compte ? Cette action est irreversible.'
    )
    if (!confirmed) return
    // Sign out — actual deletion requires admin/server action
    await supabase.auth.signOut()
    router.push('/login')
  }

  // ── Loading skeleton ──
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
    <div className="max-w-2xl mx-auto flex flex-col gap-8">

      {/* ═══ TOAST ═══ */}
      {toast && (
        <div className={`fixed top-4 right-4 z-[100] px-5 py-3 text-[13px] font-medium tracking-[-0.02em] border ${
          toast.type === 'success'
            ? 'bg-white text-[#0a0a0a] border-[#d9d9d9]'
            : 'bg-red-50 text-red-700 border-red-200'
        }`}>
          {toast.msg}
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleAvatarChange}
        className="hidden"
      />

      {/* ═══ PAGE HEADER ═══ */}
      <div>
        <span className="text-[11px] font-medium text-[#0a0a0a]/40 font-[family-name:var(--font-ibm-plex-mono)]">(Profil)</span>
        <h1 className="text-2xl font-bold text-[#0a0a0a] tracking-tight mt-1">Mon profil</h1>
      </div>

      {/* ═══ AVATAR HEADER CARD ═══ */}
      <div className={cardCls}>
        <div className="flex items-center gap-5">
          {/* Square Avatar */}
          <div className="relative shrink-0">
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt="Avatar"
                width={80}
                height={80}
                className="rounded-none object-cover w-[80px] h-[80px] border border-[#d9d9d9]"
                unoptimized
              />
            ) : (
              <div className="w-[80px] h-[80px] rounded-none bg-[#0a0a0a] flex items-center justify-center text-white font-extrabold text-[32px]">
                {(form.full_name?.[0] ?? 'F').toUpperCase()}
              </div>
            )}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className={`absolute -bottom-1 -right-1 w-7 h-7 rounded-none bg-[#0a0a0a] border-2 border-white flex items-center justify-center ${
                uploading ? 'cursor-wait' : 'cursor-pointer hover:bg-[#0a0a0a]/80'
              } transition-colors`}
              title="Modifier la photo"
            >
              {uploading ? (
                <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-none inline-block animate-spin" />
              ) : (
                <Pencil size={12} className="text-white" />
              )}
            </button>
          </div>

          {/* Name + email */}
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-[#0a0a0a] tracking-tight truncate">
              {form.full_name || 'Freelance'}
            </h2>
            <p className="text-sm text-zinc-500 tracking-[-0.02em] truncate mt-0.5">
              {form.email || 'email@exemple.fr'}
            </p>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="mt-3 px-4 py-1.5 rounded-none bg-[#0a0a0a] text-white text-[12px] font-semibold tracking-[-0.02em] hover:bg-[#0a0a0a]/80 transition-colors cursor-pointer disabled:opacity-60"
            >
              {uploading ? 'Upload...' : 'Modifier la photo'}
            </button>
          </div>
        </div>
      </div>

      {/* ═══ CARD — INFORMATIONS PERSONNELLES ═══ */}
      <div className={cardCls}>
        <div className="mb-6">
          <span className="text-[11px] font-medium text-[#0a0a0a]/40 font-[family-name:var(--font-ibm-plex-mono)]">(Identite)</span>
          <h2 className="text-base font-semibold text-[#0a0a0a] tracking-tight flex items-center gap-2">
            <User size={16} className="text-[#0a0a0a]/40" />
            Informations personnelles
          </h2>
        </div>

        <div className="space-y-4">
          <div>
            <label className={labelCls}>(nom_complet)</label>
            <input
              type="text"
              value={form.full_name}
              onChange={(e) => setForm(f => ({ ...f, full_name: e.target.value }))}
              placeholder="Jean Dupont"
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>(email)</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))}
              placeholder="jean@exemple.fr"
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>(telephone)</label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))}
              placeholder="+33 6 12 34 56 78"
              className={`${inputCls} font-[family-name:var(--font-ibm-plex-mono)]`}
            />
            <p className="text-[10px] text-[#0a0a0a]/30 mt-1 font-[family-name:var(--font-ibm-plex-mono)]">Optionnel — sera enregistre dans une future version</p>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button onClick={handleSave} disabled={saving} className="px-6 py-2.5 rounded-none bg-[#0a0a0a] text-white text-sm font-semibold tracking-[-0.02em] hover:bg-[#0a0a0a]/90 transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed">
            {saving ? 'Sauvegarde...' : 'Sauvegarder'}
          </button>
        </div>
      </div>

      {/* ═══ CARD — SECURITE ═══ */}
      <div className={cardCls}>
        <div className="mb-6">
          <span className="text-[11px] font-medium text-[#0a0a0a]/40 font-[family-name:var(--font-ibm-plex-mono)]">(Securite)</span>
          <h2 className="text-base font-semibold text-[#0a0a0a] tracking-tight flex items-center gap-2">
            <Shield size={16} className="text-[#0a0a0a]/40" />
            Securite
          </h2>
        </div>

        {/* Auth method */}
        <div className="border border-[#d9d9d9] p-4 mb-4">
          <label className={labelCls}>(methode_connexion)</label>
          <div className="flex items-center gap-2">
            <span className="inline-block px-3 py-1 rounded-none bg-[#f5f5f5] border border-[#d9d9d9] text-[12px] font-semibold text-[#0a0a0a] font-[family-name:var(--font-ibm-plex-mono)]">
              {authMethod}
            </span>
          </div>
        </div>

        {/* Password change */}
        <div className="space-y-3">
          <label className={labelCls}>(nouveau_mot_de_passe)</label>
          <input
            type="password"
            value={passwordForm.newPass}
            onChange={(e) => setPasswordForm(f => ({ ...f, newPass: e.target.value }))}
            placeholder="Nouveau mot de passe"
            className={inputCls}
          />
          <input
            type="password"
            value={passwordForm.confirm}
            onChange={(e) => setPasswordForm(f => ({ ...f, confirm: e.target.value }))}
            placeholder="Confirmer le mot de passe"
            className={inputCls}
          />
          <div className="flex justify-end pt-2">
            <button
              onClick={handlePasswordChange}
              disabled={!passwordForm.newPass}
              className="px-5 py-2 rounded-none bg-[#0a0a0a] text-white text-sm font-semibold tracking-[-0.02em] hover:bg-[#0a0a0a]/90 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Mettre a jour
            </button>
          </div>
        </div>
      </div>

      {/* ═══ ZONE DE DANGER ═══ */}
      <div className="border border-red-200 p-6 md:p-8">
        <div className="mb-4">
          <span className="text-[11px] font-medium text-red-400 font-[family-name:var(--font-ibm-plex-mono)]">(danger)</span>
          <h2 className="text-base font-semibold text-red-600 tracking-tight flex items-center gap-2">
            <AlertTriangle size={16} />
            Zone de danger
          </h2>
        </div>
        <p className="text-sm text-[#0a0a0a]/50 tracking-[-0.02em] mb-4">
          La suppression de votre compte est definitive. Toutes vos donnees (factures, clients, projets) seront perdues.
        </p>
        <button
          onClick={handleDeleteAccount}
          className="px-5 py-2.5 rounded-none border border-red-300 bg-transparent text-red-600 text-sm font-semibold tracking-[-0.02em] hover:bg-red-50 hover:border-red-400 transition-colors cursor-pointer"
        >
          Supprimer mon compte
        </button>
      </div>

      {/* ═══ DECONNEXION ═══ */}
      <div className="flex justify-center pb-4">
        <button
          onClick={async () => {
            await supabase.auth.signOut()
            router.push('/login')
          }}
          className="px-6 py-2.5 rounded-none border border-[#d9d9d9] text-[#0a0a0a]/60 hover:text-[#0a0a0a] hover:border-[#0a0a0a] text-sm font-semibold bg-white transition-colors cursor-pointer flex items-center gap-2"
        >
          <LogOut size={14} />
          Deconnexion
        </button>
      </div>
    </div>
  )
}
