import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { renderToBuffer } from '@react-pdf/renderer'
import { render } from '@react-email/render'
import React from 'react'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getAuthUserId } from '@/lib/supabase/auth-helper'
import { InvoicePDFTemplate } from '@/lib/pdf/invoice-template'
import InvoiceEmail from '@/components/emails/InvoiceEmail'
import { calculateHT, calculateTTC, formatCurrency } from '@/lib/utils/calculations'
import { UuidParamSchema } from '@/lib/validations/api'
import { checkRateLimit } from '@/lib/security/rate-limit'
import { checkOrigin } from '@/lib/security/csrf'
import { sanitizeFilename } from '@/lib/security/sanitize'
import type { Invoice, Profile } from '@/types'

export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Security checks
    const originBlock = checkOrigin(_request)
    if (originBlock) return originBlock
    const rateLimitBlock = await checkRateLimit(_request, 'emails')
    if (rateLimitBlock) return rateLimitBlock
    // Validate route param
    const paramsParsed = UuidParamSchema.safeParse(params)
    if (!paramsParsed.success) {
      return NextResponse.json({ error: 'ID facture invalide' }, { status: 400 })
    }
    const invoiceId = paramsParsed.data.id

    // Verify Resend API key
    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: 'RESEND_API_KEY non configurée' },
        { status: 500 }
      )
    }

    const resend = new Resend(apiKey)
    const supabase = createServerSupabaseClient()

    // Auth check
    let userId: string
    try {
      userId = await getAuthUserId(supabase)
    } catch {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
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

    const inv = invoice as Invoice

    // Validate client email
    if (!inv.client?.email) {
      return NextResponse.json(
        { error: "Le client n'a pas d'adresse email configurée" },
        { status: 400 }
      )
    }

    // Fetch profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (!profile) {
      return NextResponse.json(
        { error: 'Profil introuvable. Completez votre profil avant d\'envoyer une facture.' },
        { status: 400 }
      )
    }

    const userProfile = profile as Profile

    // Calculate totals
    const items = inv.items ?? []
    const ht = calculateHT(items)
    const ttc = calculateTTC(ht, inv.tva_rate)

    // Generate PDF
    const pdfBuffer = await renderToBuffer(
      React.createElement(InvoicePDFTemplate, {
        invoice: inv,
        profile: userProfile,
      }) as any
    )

    // Format values for email
    const totalFormatted = formatCurrency(ttc)
    const dueDateFormatted = inv.due_date
      ? new Date(inv.due_date).toLocaleDateString('fr-FR', {
          day: '2-digit',
          month: 'long',
          year: 'numeric',
        })
      : 'À réception'

    const freelanceName =
      userProfile.company_name ?? userProfile.full_name ?? 'Freelance'

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    // Render email HTML
    const emailHtml = await render(
      React.createElement(InvoiceEmail, {
        freelanceName,
        clientName: inv.client.name,
        invoiceNumber: inv.invoice_number,
        totalAmount: totalFormatted,
        dueDate: dueDateFormatted,
        invoiceUrl: `${appUrl}/api/invoices/${invoiceId}/pdf`,
        paymentLink: (userProfile as any).payment_link || undefined,
        logoUrl: userProfile.invoice_logo_url ?? null,
        primaryColor: userProfile.invoice_primary_color ?? null,
      })
    )

    // Send email with PDF attachment
    const { error: sendError } = await resend.emails.send({
      from: 'Freelance by eCons <contact@econs-freelance.com>',
      to: inv.client.email,
      subject: `Facture ${inv.invoice_number} — ${totalFormatted}`,
      html: emailHtml,
      attachments: [
        {
          filename: sanitizeFilename(`Facture_${inv.invoice_number}`) + '.pdf',
          content: Buffer.from(pdfBuffer).toString('base64'),
        },
      ],
    })

    if (sendError) {
      console.error('Resend error:', sendError)
      return NextResponse.json(
        { error: "Erreur lors de l'envoi de l'email" },
        { status: 500 }
      )
    }

    // Update status: draft → sent + stamp issue_date
    const updates: Record<string, unknown> = {}
    if (inv.status === 'draft') {
      updates.status = 'sent'
      updates.issue_date = new Date().toISOString().slice(0, 10)
    }

    if (Object.keys(updates).length > 0) {
      await supabase.from('invoices').update(updates).eq('id', invoiceId)
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Email send error:', err)
    return NextResponse.json(
      { error: "Erreur lors de l'envoi de l'email" },
      { status: 500 }
    )
  }
}
