import type { InvoiceItem } from '@/types'

export function calculateHT(items: InvoiceItem[]): number {
  return items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0)
}

export function calculateTVA(ht: number, tvaRate: number): number {
  return ht * tvaRate / 100
}

export function calculateTTC(ht: number, tvaRate: number): number {
  return ht + calculateTVA(ht, tvaRate)
}

export function formatCurrency(amount: number): string {
  const formatted = new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
  // U+00A0 = non-breaking space, U+20AC = €
  return formatted + '\u00a0\u20ac'
}
