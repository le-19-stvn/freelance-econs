import { NextRequest, NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import React from 'react'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getAuthUserId } from '@/lib/supabase/auth-helper'
import { InvoicePDFTemplate } from '@/lib/pdf/invoice-template'
import { checkRateLimit } from '@/lib/security/rate-limit'
import { sanitizeFilename } from '@/lib/security/sanitize'
import type { Invoice, Profile } from '@/types'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Rate limit check
    const rateLimitBlock = await checkRateLimit(request)
    if (rateLimitBlock) return rateLimitBlock

    const supabase = createServerSupabaseClient()

    // Auth check
    let userId: string
    try {
      userId = await getAuthUserId(supabase)
    } catch {
      return NextResponse.json({ error: 'Non autorise' }, { status: 401 })
    }

    const invoiceId = params.id
    if (!invoiceId) {
      return NextResponse.json({ error: 'ID facture requis' }, { status: 400 })
    }

    // Fetch invoice with relations
    const { data: invoice, error: invError } = await supabase
      .from('invoices')
      .select('*, client:clients(*), project:projects(*), items:invoice_items(*)')
      .eq('id', invoiceId)
      .eq('user_id', userId)
      .single()

    if (invError || !invoice) {
      return NextResponse.json({ error: 'Facture introuvable' }, { status: 404 })
    }

    // Fetch user profile — required, no fallback
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'Profil introuvable. Completez votre profil avant de generer un PDF.' },
        { status: 400 }
      )
    }

    // Generate PDF buffer
    const pdfBuffer = await renderToBuffer(
      React.createElement(InvoicePDFTemplate, {
        invoice: invoice as Invoice,
        profile: profile as Profile,
      }) as any
    )

    // Sanitize filename from invoice number
    const filename = sanitizeFilename(
      `Facture_${invoice.invoice_number || 'draft'}`
    ) + '.pdf'

    return new NextResponse(pdfBuffer as unknown as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    const stack = err instanceof Error ? err.stack : undefined
    console.error('PDF generation error:', message, stack)
    // Surface the real error so we can diagnose prod issues
    // (Vercel logs + Sentry are not always accessible mid-debug)
    return NextResponse.json(
      {
        error: 'Erreur lors de la generation du PDF',
        detail: message,
        ...(process.env.NODE_ENV !== 'production' ? { stack } : {}),
      },
      { status: 500 }
    )
  }
}
