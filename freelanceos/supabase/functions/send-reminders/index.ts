// deno-lint-ignore-file
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const CRON_SECRET = Deno.env.get('CRON_SECRET')!

/* ─────────── Tier config ─────────── */

type Tier = 1 | 2 | 3

const TIER_CONFIG: Record<Tier, {
  subject: (num: string) => string
  label: string          // pre-header / kicker
  headline: string
  intro: string
  closing: string
  accent: string         // hex — fallback when freelance has no primary color
  badgeBg: string
  badgeFg: string
  badgeText: string
}> = {
  1: {
    subject: (num) => `Petit rappel — Facture ${num}`,
    label: 'Rappel amical',
    headline: 'Un petit rappel pour votre facture',
    intro: "Nous attirons votre attention sur la facture ci-dessous, dont l'échéance vient d'être atteinte. Ce n'est peut-être qu'un oubli — merci de procéder au règlement lorsque vous le pourrez.",
    closing: "N'hésitez pas à nous contacter si vous avez la moindre question.",
    accent: '#1D4ED8',
    badgeBg: '#eff6ff',
    badgeFg: '#1d4ed8',
    badgeText: 'J+3',
  },
  2: {
    subject: (num) => `Relance — Facture ${num} en attente`,
    label: 'Relance',
    headline: 'Votre facture est toujours en attente',
    intro: "Nous n'avons pas encore reçu le règlement de la facture ci-dessous. Nous vous remercions par avance de bien vouloir procéder au paiement dans les meilleurs délais.",
    closing: "Si le paiement a été effectué récemment, merci d'ignorer ce message.",
    accent: '#B45309',
    badgeBg: '#fffbeb',
    badgeFg: '#b45309',
    badgeText: 'J+7',
  },
  3: {
    subject: (num) => `Dernier rappel — Facture ${num}`,
    label: 'Dernier rappel',
    headline: 'Dernier rappel avant procédure',
    intro: "Ceci est notre dernier rappel concernant la facture ci-dessous. Sans règlement de votre part sous 48 heures, nous serons contraints d'engager des démarches complémentaires (relance formelle, intérêts de retard, recouvrement).",
    closing: "Nous préférons largement régler cela à l'amiable — merci de votre réactivité.",
    accent: '#B91C1C',
    badgeBg: '#fef2f2',
    badgeFg: '#b91c1c',
    badgeText: 'J+15',
  },
}

/* ─────────── Helpers ─────────── */

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

function isValidHexColor(c: string | null | undefined): c is string {
  return !!c && /^#[0-9a-fA-F]{6}$/.test(c)
}

/* ─────────── Email render ─────────── */

function renderHtml(opts: {
  tier: Tier
  clientName: string
  freelanceName: string
  invoiceNumber: string
  amount: string
  dueDate: string | null
  logoUrl: string | null
  primaryColor: string
  paymentLink: string | null
}): string {
  const t = TIER_CONFIG[opts.tier]
  const brand = opts.primaryColor || t.accent
  const {
    clientName, freelanceName, invoiceNumber, amount, dueDate,
    logoUrl, paymentLink,
  } = opts

  const fontStack =
    "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
  const monoStack =
    "'JetBrains Mono', 'SFMono-Regular', Menlo, Monaco, Consolas, 'Courier New', monospace"

  const logoBlock = logoUrl
    ? `<img src="${escapeHtml(logoUrl)}" alt="${escapeHtml(freelanceName)}" height="32" style="display:block;height:32px;width:auto;border:0;" />`
    : `<div style="display:inline-block;padding:6px 12px;border-radius:8px;background:${brand};color:#ffffff;font:600 13px/1 ${fontStack};letter-spacing:-0.01em;">${escapeHtml(freelanceName)}</div>`

  const ctaBlock = paymentLink
    ? `
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0 4px;">
        <tr>
          <td align="center" bgcolor="${brand}" style="border-radius:10px;">
            <a href="${escapeHtml(paymentLink)}"
               style="display:inline-block;padding:12px 24px;font:600 14px/1 ${fontStack};color:#ffffff;text-decoration:none;border-radius:10px;letter-spacing:-0.005em;">
              Payer maintenant →
            </a>
          </td>
        </tr>
      </table>
      <p style="margin:4px 0 0;font:400 11px/1.5 ${fontStack};color:#a1a1aa;">
        Paiement sécurisé via ${escapeHtml(freelanceName)}
      </p>
    `
    : ''

  const dueLine = dueDate
    ? `
      <tr>
        <td style="padding:6px 0;font:400 13px/1.5 ${fontStack};color:#71717a;">Échéance</td>
        <td align="right" style="padding:6px 0;font:500 13px/1.5 ${monoStack};color:#27272a;">
          ${escapeHtml(dueDate)}
        </td>
      </tr>
    `
    : ''

  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>${escapeHtml(t.subject(invoiceNumber))}</title>
</head>
<body style="margin:0;padding:0;background:#fafafa;font-family:${fontStack};-webkit-font-smoothing:antialiased;">

<!-- Preheader (hidden but shown in inbox preview) -->
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">
  ${escapeHtml(t.label)} — Facture ${escapeHtml(invoiceNumber)} · ${escapeHtml(amount)}
</div>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#fafafa;">
  <tr>
    <td align="center" style="padding:32px 16px;">

      <table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0"
             style="width:100%;max-width:560px;background:#ffffff;border-radius:16px;box-shadow:0 1px 3px rgba(0,0,0,0.04),0 8px 24px rgba(0,0,0,0.04);overflow:hidden;">

        <!-- Header -->
        <tr>
          <td style="padding:24px 32px 0;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td align="left">${logoBlock}</td>
                <td align="right">
                  <span style="display:inline-block;padding:4px 10px;border-radius:999px;background:${t.badgeBg};color:${t.badgeFg};font:600 11px/1 ${monoStack};letter-spacing:0.02em;">
                    ${t.badgeText}
                  </span>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Kicker + Title -->
        <tr>
          <td style="padding:28px 32px 0;">
            <p style="margin:0 0 8px;font:500 11px/1 ${fontStack};color:${t.badgeFg};letter-spacing:0.08em;text-transform:uppercase;">
              ${escapeHtml(t.label)}
            </p>
            <h1 style="margin:0;font:700 24px/1.2 ${fontStack};color:#18181b;letter-spacing:-0.02em;">
              ${escapeHtml(t.headline)}
            </h1>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:20px 32px 0;">
            <p style="margin:0 0 16px;font:400 15px/1.6 ${fontStack};color:#3f3f46;">
              Bonjour ${escapeHtml(clientName)},
            </p>
            <p style="margin:0 0 20px;font:400 15px/1.6 ${fontStack};color:#3f3f46;">
              ${escapeHtml(t.intro)}
            </p>
          </td>
        </tr>

        <!-- Invoice summary card -->
        <tr>
          <td style="padding:0 32px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
                   style="background:#fafafa;border:1px solid #e4e4e7;border-radius:12px;">
              <tr>
                <td style="padding:16px 18px;">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td style="padding:6px 0;font:400 13px/1.5 ${fontStack};color:#71717a;">Facture</td>
                      <td align="right" style="padding:6px 0;font:600 13px/1.5 ${monoStack};color:#27272a;">
                        ${escapeHtml(invoiceNumber)}
                      </td>
                    </tr>
                    ${dueLine}
                    <tr>
                      <td colspan="2" style="padding:10px 0 6px;border-top:1px solid #e4e4e7;"></td>
                    </tr>
                    <tr>
                      <td style="padding:6px 0;font:500 14px/1.3 ${fontStack};color:#18181b;">Montant dû</td>
                      <td align="right" style="padding:6px 0;font:600 20px/1.2 ${monoStack};color:${brand};letter-spacing:-0.01em;">
                        ${escapeHtml(amount)}
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- CTA -->
        <tr>
          <td align="center" style="padding:8px 32px 0;">
            ${ctaBlock}
          </td>
        </tr>

        <!-- Closing -->
        <tr>
          <td style="padding:24px 32px 0;">
            <p style="margin:0 0 20px;font:400 14px/1.6 ${fontStack};color:#52525b;">
              ${escapeHtml(t.closing)}
            </p>
            <p style="margin:0;font:400 14px/1.6 ${fontStack};color:#3f3f46;">
              Cordialement,<br/>
              <span style="color:#18181b;font-weight:600;">${escapeHtml(freelanceName)}</span>
            </p>
          </td>
        </tr>

        <!-- Spacer -->
        <tr><td style="padding:28px 32px;"></td></tr>

      </table>

      <!-- Footer -->
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0"
             style="width:100%;max-width:560px;margin-top:16px;">
        <tr>
          <td align="center" style="padding:0 16px;">
            <p style="margin:0;font:400 11px/1.5 ${fontStack};color:#a1a1aa;">
              Envoyé via Freelance by eCons · <a href="https://econs-freelance.com" style="color:#a1a1aa;text-decoration:underline;">econs-freelance.com</a>
            </p>
          </td>
        </tr>
      </table>

    </td>
  </tr>
</table>
</body>
</html>`
}

function renderText(opts: {
  tier: Tier
  clientName: string
  freelanceName: string
  invoiceNumber: string
  amount: string
  dueDate: string | null
  paymentLink: string | null
}): string {
  const t = TIER_CONFIG[opts.tier]
  const lines: string[] = []
  lines.push(`Bonjour ${opts.clientName},`)
  lines.push('')
  lines.push(t.intro)
  lines.push('')
  lines.push(`Facture : ${opts.invoiceNumber}`)
  if (opts.dueDate) lines.push(`Échéance : ${opts.dueDate}`)
  lines.push(`Montant dû : ${opts.amount}`)
  if (opts.paymentLink) {
    lines.push('')
    lines.push(`Payer maintenant : ${opts.paymentLink}`)
  }
  lines.push('')
  lines.push(t.closing)
  lines.push('')
  lines.push('Cordialement,')
  lines.push(opts.freelanceName)
  return lines.join('\n')
}

/* ─────────── Cron entrypoint ─────────── */

Deno.serve(async (req) => {
  // ── Auth: only pg_cron (with the shared secret) may invoke ──
  const authHeader = req.headers.get('Authorization') ?? ''
  const provided = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : ''
  if (!CRON_SECRET || !safeEqual(provided, CRON_SECRET)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

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

    const tier = (reminder.sequence_step as Tier) ?? 1
    if (!TIER_CONFIG[tier]) continue

    const freelanceName = profile?.company_name || profile?.full_name || 'Freelance'
    const clientName = client?.name || 'Bonjour'
    const logoUrl = profile?.invoice_logo_url ?? null
    const primaryColor = isValidHexColor(profile?.invoice_primary_color)
      ? (profile!.invoice_primary_color as string)
      : ''
    const paymentLink = (profile?.payment_link as string | undefined) ?? null

    const ht = (invoice.items ?? []).reduce(
      (s: number, i: { quantity: number; unit_price: number }) => s + i.quantity * i.unit_price,
      0
    )
    const ttc = ht * (1 + (invoice.tva_rate ?? 0) / 100)
    const currency = invoice.currency ?? 'EUR'
    const symbols: Record<string, string> = { EUR: '\u20ac', USD: '$', GBP: '\u00a3', CHF: 'CHF' }
    const amount =
      new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(ttc) +
      '\u00a0' +
      (symbols[currency] ?? currency)

    const dueDate = invoice.due_date
      ? new Date(invoice.due_date).toLocaleDateString('fr-FR', {
          day: '2-digit',
          month: 'long',
          year: 'numeric',
        })
      : null

    const t = TIER_CONFIG[tier]
    const subject = t.subject(invoice.invoice_number)

    const html = renderHtml({
      tier,
      clientName,
      freelanceName,
      invoiceNumber: invoice.invoice_number,
      amount,
      dueDate,
      logoUrl,
      primaryColor,
      paymentLink,
    })

    const text = renderText({
      tier,
      clientName,
      freelanceName,
      invoiceNumber: invoice.invoice_number,
      amount,
      dueDate,
      paymentLink,
    })

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
          subject,
          html,
          text,
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
