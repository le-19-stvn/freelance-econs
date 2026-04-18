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

const currencySymbols: Record<string, string> = {
  EUR: '\u20ac',  // €
  USD: '$',
  GBP: '\u00a3',  // £
  CHF: 'CHF',
}

export function formatCurrency(amount: number, currency: string = 'EUR'): string {
  const formatted = new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
  const symbol = currencySymbols[currency] ?? currency
  return formatted + '\u00a0' + symbol
}
