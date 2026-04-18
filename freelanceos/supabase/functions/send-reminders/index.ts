// deno-lint-ignore-file
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const TEMPLATES: Record<number, { subject: (n: string) => string; body: (name: string, n: string, a: string) => string }> = {
  1: {
    subject: (num) => `Petit rappel — Facture ${num}`,
    body: (name, num, amount) =>
      `Bonjour,\n\nPetit rappel concernant la facture ${num} d'un montant de ${amount} qui est arrivee a echeance.\n\nN'hesitez pas a nous contacter si vous avez des questions.\n\nCordialement,\n${name}`,
  },
  2: {
    subject: (num) => `Relance — Facture ${num} en attente`,
    body: (name, num, amount) =>
      `Bonjour,\n\nNous nous permettons de vous relancer concernant la facture ${num} d'un montant de ${amount}, toujours en attente de reglement.\n\nMerci de proceder au paiement dans les meilleurs delais.\n\nCordialement,\n${name}`,
  },
  3: {
    subject: (num) => `Dernier rappel — Facture ${num}`,
    body: (name, num, amount) =>
      `Bonjour,\n\nCeci est notre dernier rappel concernant la facture ${num} d'un montant de ${amount}.\n\nSans reglement de votre part sous 48h, nous serons contraints d'engager des demarches complementaires.\n\nCordialement,\n${name}`,
  },
}

Deno.serve(async () => {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

  const { data: reminders } = await supabase
    .from('invoice_reminders')
    .select('*, invoices(*, clients(*), items:invoice_items(*)), profiles:user_id(*)')
    .eq('status', 'pending')
    .lte('scheduled_at', new Date().toISOString())
    .limit(50)

  if (!reminders?.length) {
    return new Response(JSON.stringify({ processed: 0 }), { status: 200 })
  }

  let sent = 0

  for (const reminder of reminders) {
    const invoice = reminder.invoices
    const profile = reminder.profiles
    const client = invoice?.clients

    if (!invoice || invoice.status === 'paid' || !client?.email) {
      await supabase
        .from('invoice_reminders')
        .update({ status: 'failed' })
        .eq('id', reminder.id)
      continue
    }

    const template = TEMPLATES[reminder.sequence_step]
    if (!template) continue

    const freelanceName = profile?.company_name || profile?.full_name || 'Freelance'
    const ht = (invoice.items ?? []).reduce((s: number, i: { quantity: number; unit_price: number }) => s + i.quantity * i.unit_price, 0)
    const ttc = ht * (1 + (invoice.tva_rate ?? 0) / 100)
    const currency = invoice.currency ?? 'EUR'
    const symbols: Record<string, string> = { EUR: '\u20ac', USD: '$', GBP: '\u00a3', CHF: 'CHF' }
    const amount = new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(ttc) + '\u00a0' + (symbols[currency] ?? currency)

    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Freelance by eCons <contact@econs-freelance.com>',
          to: [client.email],
          subject: template.subject(invoice.invoice_number),
          text: template.body(freelanceName, invoice.invoice_number, amount),
        }),
      })

      if (res.ok) {
        await supabase
          .from('invoice_reminders')
          .update({ status: 'sent', sent_at: new Date().toISOString() })
          .eq('id', reminder.id)
        sent++
      } else {
        await supabase
          .from('invoice_reminders')
          .update({ status: 'failed' })
          .eq('id', reminder.id)
      }
    } catch {
      await supabase
        .from('invoice_reminders')
        .update({ status: 'failed' })
        .eq('id', reminder.id)
    }
  }

  return new Response(JSON.stringify({ processed: sent }), { status: 200 })
})
