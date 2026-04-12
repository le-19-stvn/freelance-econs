import { NextRequest, NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import React from 'react'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getAuthUserId } from '@/lib/supabase/auth-helper'
import { InvoicePDFTemplate } from '@/lib/pdf/invoice-template'
import { PdfGenerateSchema } from '@/lib/validations/api'
import { checkRateLimit } from '@/lib/security/rate-limit'
import { checkOrigin } from '@/lib/security/csrf'
import type { Invoice, Profile } from '@/types'

export async function POST(request: NextRequest) {
  try {
    // Security checks
    const originBlock = checkOrigin(request)
    if (originBlock) return originBlock
    const rateLimitBlock = await checkRateLimit(request)
    if (rateLimitBlock) return rateLimitBlock

    const supabase = createServerSupabaseClient()
    let userId: string
    try {
      userId = await getAuthUserId(supabase)
    } catch {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await request.json()
    const parsed = PdfGenerateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues.map(i => i.message).join(', ') }, { status: 400 })
    }
    const { invoiceId } = parsed.data

    // Fetch invoice with items and client
    const { data: invoice, error: invError } = await supabase
      .from('invoices')
      .select('*, client:clients(*), project:projects(*), items:invoice_items(*)')
      .eq('id', invoiceId)
      .single()

    if (invError || !invoice) {
      return NextResponse.json({ error: 'Facture introuvable' }, { status: 404 })
    }

    // Fetch profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profil introuvable' }, { status: 404 })
    }

    // Generate PDF buffer
    const pdfBuffer = await renderToBuffer(
      React.createElement(InvoicePDFTemplate, {
        invoice: invoice as Invoice,
        profile: profile as Profile,
      }) as any
    )

    // Upload to Supabase Storage
    const filePath = `${userId}/${invoice.invoice_number}.pdf`
    const { error: uploadError } = await supabase.storage
      .from('invoices')
      .upload(filePath, pdfBuffer, {
        contentType: 'application/pdf',
        upsert: true,
      })

    if (uploadError) {
      return NextResponse.json({ error: 'Erreur upload: ' + uploadError.message }, { status: 500 })
    }

    // Get signed URL (1 hour)
    const { data: signedUrlData, error: urlError } = await supabase.storage
      .from('invoices')
      .createSignedUrl(filePath, 3600)

    if (urlError || !signedUrlData) {
      return NextResponse.json({ error: 'Erreur URL signée' }, { status: 500 })
    }

    // Update invoice with pdf_url
    await supabase
      .from('invoices')
      .update({ pdf_url: signedUrlData.signedUrl })
      .eq('id', invoiceId)

    return NextResponse.json({ url: signedUrlData.signedUrl })
  } catch (err) {
    console.error('PDF generation error:', err)
    return NextResponse.json({ error: 'Erreur lors de la génération du PDF' }, { status: 500 })
  }
}
