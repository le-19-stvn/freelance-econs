import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getAuthUserId } from '@/lib/supabase/auth-helper'
import { generateInvoicesExcel } from '@/lib/export/excel'
import type { Invoice } from '@/types'

export async function GET() {
  try {
    const supabase = createServerSupabaseClient()
    try {
      await getAuthUserId(supabase)
    } catch {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { data: invoices, error: invError } = await supabase
      .from('invoices')
      .select('*, client:clients(*), project:projects(*), items:invoice_items(*)')
      .order('created_at', { ascending: false })

    if (invError) {
      return NextResponse.json({ error: invError.message }, { status: 500 })
    }

    const buffer = generateInvoicesExcel(invoices as Invoice[])

    return new NextResponse(buffer as unknown as BodyInit, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="factures-${new Date().toISOString().split('T')[0]}.xlsx"`,
      },
    })
  } catch (err) {
    console.error('Excel export error:', err)
    return NextResponse.json({ error: 'Erreur lors de l\'export' }, { status: 500 })
  }
}
