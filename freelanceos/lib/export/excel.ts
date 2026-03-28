import * as XLSX from 'xlsx'
import type { Invoice } from '@/types'
import { calculateHT, calculateTVA, calculateTTC } from '@/lib/utils/calculations'

export function generateInvoicesExcel(invoices: Invoice[]): Uint8Array {
  const rows = invoices.map(inv => {
    const ht = calculateHT(inv.items)
    const tva = calculateTVA(ht, inv.tva_rate)
    const ttc = calculateTTC(ht, inv.tva_rate)
    const services = inv.items.map(i => i.description).join(', ')

    return {
      'N° Facture': inv.invoice_number,
      'Client': inv.client?.name ?? '',
      'Date': inv.issue_date,
      'Statut': inv.status,
      'Services': services,
      'HT': ht,
      'TVA': tva,
      'TTC': ttc,
      'Notes': inv.notes ?? '',
    }
  })

  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.json_to_sheet(rows)

  // Set column widths
  ws['!cols'] = [
    { wch: 15 }, { wch: 20 }, { wch: 12 }, { wch: 10 },
    { wch: 30 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 30 },
  ]

  XLSX.utils.book_append_sheet(wb, ws, 'Factures')
  const buf = XLSX.write(wb, { type: 'array', bookType: 'xlsx' })
  return new Uint8Array(buf)
}
