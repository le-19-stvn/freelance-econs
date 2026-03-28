import { SupabaseClient } from '@supabase/supabase-js'

export async function generateInvoiceNumber(
  supabase: SupabaseClient,
  userId: string
): Promise<string> {
  const year = new Date().getFullYear()
  const prefix = `FAC-${year}-`

  const { data, error } = await supabase
    .from('invoices')
    .select('invoice_number')
    .eq('user_id', userId)
    .like('invoice_number', `${prefix}%`)
    .order('invoice_number', { ascending: false })
    .limit(1)

  if (error) throw error

  let nextNum = 1
  if (data && data.length > 0) {
    const lastNumber = parseInt(data[0].invoice_number.split('-')[2], 10)
    nextNum = lastNumber + 1
  }

  return `${prefix}${String(nextNum).padStart(3, '0')}`
}
