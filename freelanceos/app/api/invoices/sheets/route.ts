import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getAuthUserId } from '@/lib/supabase/auth-helper'
import { appendInvoicesToSheet } from '@/lib/export/sheets'
import { generateInvoicesExcel } from '@/lib/export/excel'
import { SheetsExportSchema } from '@/lib/validations/api'
import { checkRateLimit } from '@/lib/security/rate-limit'
import { checkOrigin } from '@/lib/security/csrf'
import type { Invoice } from '@/types'

export async function POST(request: NextRequest) {
  try {
    // Security checks
    const originBlock = checkOrigin(request)
    if (originBlock) return originBlock
    const rateLimitBlock = await checkRateLimit(request)
    if (rateLimitBlock) return rateLimitBlock

    const supabase = createServerSupabaseClient()
    try {
      await getAuthUserId(supabase)
    } catch {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await request.json()
    const parsed = SheetsExportSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues.map(i => i.message).join(', ') }, { status: 400 })
    }
    const { spreadsheetId, accessToken, refreshToken } = parsed.data

    const { data: invoices, error: invError } = await supabase
      .from('invoices')
      .select('*, client:clients(*), project:projects(*), items:invoice_items(*)')
      .order('created_at', { ascending: false })

    if (invError) {
      console.error('Invoice fetch error:', invError.message)
      return NextResponse.json({ error: 'Erreur lors de la recuperation des factures' }, { status: 500 })
    }

    try {
      await appendInvoicesToSheet(
        spreadsheetId,
        accessToken,
        refreshToken,
        invoices as Invoice[]
      )
      return NextResponse.json({ success: true })
    } catch (sheetsError) {
      // Fallback to Excel download on Google Sheets failure
      console.error('Google Sheets push failed, falling back to Excel:', sheetsError)
      const buffer = generateInvoicesExcel(invoices as Invoice[])
      return new NextResponse(buffer as unknown as BodyInit, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="factures-${new Date().toISOString().split('T')[0]}.xlsx"`,
        },
      })
    }
  } catch (err) {
    console.error('Sheets export error:', err)
    return NextResponse.json({ error: 'Erreur lors de l\'export Google Sheets' }, { status: 500 })
  }
}
