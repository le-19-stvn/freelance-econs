import { NextRequest, NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import React from 'react'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getAuthUserId } from '@/lib/supabase/auth-helper'
import { InvoicePDFTemplate } from '@/lib/pdf/invoice-template'
import type { Invoice, Profile } from '@/types'

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerSupabaseClient()

    // Auth check
    let userId: string
    try {
      userId = await getAuthUserId(supabase)
    } catch {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
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

    // Fetch user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    // Use a default profile if none found (demo mode)
    const userProfile: Profile = (profileError || !profile)
      ? {
          id: userId,
          full_name: 'Freelance',
          company_name: null,
          email: '',
          address: null,
          siret: null,
          tva_number: null,
          tva_rate: 20,
          iban: null,
          payment_link: null,
          logo_url: null,
          avatar_url: null,
          stripe_customer_id: null,
          stripe_subscription_id: null,
          plan_status: 'inactive' as const,
          plan_type: 'free' as const,
          onboarding_completed: false,
        }
      : (profile as Profile)

    // Generate PDF buffer
    const pdfBuffer = await renderToBuffer(
      React.createElement(InvoicePDFTemplate, {
        invoice: invoice as Invoice,
        profile: userProfile,
      }) as any
    )

    // Return as downloadable PDF
    const filename = `Facture_${invoice.invoice_number || 'draft'}.pdf`

    return new NextResponse(pdfBuffer as unknown as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (err) {
    console.error('PDF generation error:', err)
    return NextResponse.json(
      { error: 'Erreur lors de la génération du PDF' },
      { status: 500 }
    )
  }
}
