import { google } from 'googleapis'
import type { Invoice } from '@/types'
import { calculateHT, calculateTVA, calculateTTC } from '@/lib/utils/calculations'

function getOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.NEXT_PUBLIC_APP_URL}/api/invoices/sheets/callback`
  )
}

export async function appendInvoicesToSheet(
  spreadsheetId: string,
  accessToken: string,
  refreshToken: string,
  invoices: Invoice[]
) {
  const oauth2Client = getOAuth2Client()
  oauth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
  })

  const sheets = google.sheets({ version: 'v4', auth: oauth2Client })

  const rows = invoices.map(inv => {
    const ht = calculateHT(inv.items)
    const tva = calculateTVA(ht, inv.tva_rate)
    const ttc = calculateTTC(ht, inv.tva_rate)
    const services = inv.items.map(i => i.description).join(', ')

    return [
      inv.invoice_number,
      inv.client?.name ?? '',
      inv.issue_date,
      inv.status,
      services,
      ht,
      tva,
      ttc,
      inv.notes ?? '',
    ]
  })

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: 'Factures!A:I',
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: rows },
  })
}
