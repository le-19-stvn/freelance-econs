import React from 'react'
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import type { Invoice, Profile } from '@/types'
import { calculateHT, calculateTVA, calculateTTC } from '@/lib/utils/calculations'

const c = {
  ink: '#0F1117',
  ink2: '#2C2F3A',
  muted: '#6B7280',
  line: '#E4E6ED',
  blue: '#1A3FA3',
  blueSurface: '#EBF2FA',
  bg: '#F6F7FA',
  white: '#FFFFFF',
}

const styles = StyleSheet.create({
  page: {
    padding: 48,
    paddingBottom: 80,
    fontSize: 9,
    fontFamily: 'Helvetica',
    color: c.ink,
    backgroundColor: c.white,
  },

  // ── Header ──
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 36,
    paddingBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: c.blue,
  },
  headerLeft: { maxWidth: '55%' },
  headerRight: { alignItems: 'flex-end', maxWidth: '40%' },
  brandName: { fontSize: 18, fontWeight: 'bold', color: c.blue, marginBottom: 2 },
  brandSub: { fontSize: 8, color: c.muted, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 8 },
  infoText: { fontSize: 9, color: c.ink2, lineHeight: 1.5 },
  infoMuted: { fontSize: 8, color: c.muted, lineHeight: 1.5 },

  // ── Invoice Meta ──
  metaSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  metaBlock: {},
  invoiceTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: c.ink,
    letterSpacing: 1,
    marginBottom: 4,
  },
  invoiceNumber: {
    fontSize: 11,
    color: c.blue,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  label: {
    fontSize: 7,
    color: c.muted,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 3,
    marginTop: 8,
  },
  clientName: { fontSize: 11, fontWeight: 'bold', color: c.ink, marginBottom: 2 },
  clientDetail: { fontSize: 9, color: c.ink2, lineHeight: 1.5 },

  // ── Table ──
  table: { marginBottom: 24 },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: c.blueSurface,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderBottomWidth: 1.5,
    borderBottomColor: c.blue,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 9,
    paddingHorizontal: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: c.line,
  },
  tableRowAlt: {
    backgroundColor: '#FAFBFD',
  },
  thText: { fontWeight: 'bold', fontSize: 8, color: c.blue, textTransform: 'uppercase', letterSpacing: 0.8 },
  tdText: { fontSize: 9, color: c.ink },
  colDesc: { flex: 4 },
  colQty: { flex: 1, textAlign: 'center' },
  colUnit: { flex: 1.2, textAlign: 'center' },
  colPrice: { flex: 1.3, textAlign: 'right' },
  colTotal: { flex: 1.3, textAlign: 'right' },

  // ── Totals ──
  totalsWrapper: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 24,
  },
  totalsBox: {
    width: 220,
    borderWidth: 1,
    borderColor: c.line,
    borderRadius: 6,
    overflow: 'hidden',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 7,
    paddingHorizontal: 14,
  },
  totalLabel: { fontSize: 9, color: c.muted },
  totalValue: { fontSize: 9, fontWeight: 'bold', color: c.ink },
  ttcRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: c.blue,
  },
  ttcLabel: { fontSize: 11, fontWeight: 'bold', color: c.white },
  ttcValue: { fontSize: 11, fontWeight: 'bold', color: c.white },

  // ── Notes ──
  notesBox: {
    marginTop: 8,
    padding: 14,
    backgroundColor: c.bg,
    borderRadius: 6,
    borderLeftWidth: 3,
    borderLeftColor: c.blue,
  },
  notesTitle: { fontSize: 8, fontWeight: 'bold', color: c.blue, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
  notesText: { fontSize: 9, color: c.ink2, lineHeight: 1.6 },

  // ── Footer ──
  footer: {
    position: 'absolute',
    bottom: 28,
    left: 48,
    right: 48,
    borderTopWidth: 1,
    borderTopColor: c.line,
    paddingTop: 10,
    textAlign: 'center',
  },
  footerText: { fontSize: 7, color: c.muted, lineHeight: 1.6 },
})

interface InvoicePDFProps {
  invoice: Invoice
  profile: Profile
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
}

function fmtEur(n: number): string {
  return n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' \u20AC'
}

const unitLabels: Record<string, string> = { h: 'Heure', forfait: 'Forfait', jour: 'Jour' }

export function InvoicePDFTemplate({ invoice, profile }: InvoicePDFProps) {
  const items = invoice.items ?? []
  const ht = calculateHT(items)
  const tva = calculateTVA(ht, invoice.tva_rate)
  const ttc = calculateTTC(ht, invoice.tva_rate)

  return (
    <Document>
      <Page size="A4" style={styles.page}>

        {/* ═══ HEADER — Freelancer info ═══ */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.brandName}>{profile.company_name ?? profile.full_name ?? 'Freelance'}</Text>
            <Text style={styles.brandSub}>Freelance</Text>
            {profile.address && <Text style={styles.infoText}>{profile.address}</Text>}
            {profile.email && <Text style={styles.infoText}>{profile.email}</Text>}
            {profile.siret && <Text style={styles.infoMuted}>SIRET : {profile.siret}</Text>}
            {profile.tva_number && <Text style={styles.infoMuted}>N° TVA : {profile.tva_number}</Text>}
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.invoiceTitle}>FACTURE</Text>
            <Text style={styles.invoiceNumber}>N° {invoice.invoice_number}</Text>
            <Text style={styles.infoMuted}>Date : {formatDate(invoice.issue_date)}</Text>
            {invoice.due_date && (
              <Text style={styles.infoMuted}>Échéance : {formatDate(invoice.due_date)}</Text>
            )}
          </View>
        </View>

        {/* ═══ CLIENT BLOCK ═══ */}
        <View style={styles.metaSection}>
          <View style={styles.metaBlock}>
            <Text style={styles.label}>Facturé à</Text>
            <Text style={styles.clientName}>{invoice.client?.name ?? 'Client'}</Text>
            {invoice.client?.address && <Text style={styles.clientDetail}>{invoice.client.address}</Text>}
            {invoice.client?.email && <Text style={styles.clientDetail}>{invoice.client.email}</Text>}
            {invoice.client?.fiscal_id && (
              <Text style={styles.clientDetail}>ID Fiscal : {invoice.client.fiscal_id}</Text>
            )}
          </View>
          {invoice.project?.name && (
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.label}>Projet</Text>
              <Text style={{ fontSize: 10, fontWeight: 'bold', color: c.ink }}>{invoice.project.name}</Text>
            </View>
          )}
        </View>

        {/* ═══ ITEMS TABLE ═══ */}
        <View style={styles.table}>
          {/* Table Header */}
          <View style={styles.tableHeader}>
            <Text style={[styles.thText, styles.colDesc]}>Description</Text>
            <Text style={[styles.thText, styles.colQty]}>Qté</Text>
            <Text style={[styles.thText, styles.colUnit]}>Unité</Text>
            <Text style={[styles.thText, styles.colPrice]}>P.U. HT</Text>
            <Text style={[styles.thText, styles.colTotal]}>Total HT</Text>
          </View>
          {/* Table Rows */}
          {items.map((item, idx) => {
            const rowTotal = item.quantity * item.unit_price
            return (
              <View key={idx} style={[styles.tableRow, idx % 2 === 1 ? styles.tableRowAlt : {}]}>
                <Text style={[styles.tdText, styles.colDesc]}>{item.description}</Text>
                <Text style={[styles.tdText, styles.colQty]}>{item.quantity}</Text>
                <Text style={[styles.tdText, styles.colUnit]}>{unitLabels[item.unit_type] ?? item.unit_type}</Text>
                <Text style={[styles.tdText, styles.colPrice]}>{fmtEur(item.unit_price)}</Text>
                <Text style={[styles.tdText, styles.colTotal, { fontWeight: 'bold' }]}>{fmtEur(rowTotal)}</Text>
              </View>
            )
          })}
        </View>

        {/* ═══ TOTALS ═══ */}
        <View style={styles.totalsWrapper}>
          <View style={styles.totalsBox}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total HT</Text>
              <Text style={styles.totalValue}>{fmtEur(ht)}</Text>
            </View>
            <View style={[styles.totalRow, { borderTopWidth: 0.5, borderTopColor: c.line }]}>
              <Text style={styles.totalLabel}>TVA ({invoice.tva_rate}%)</Text>
              <Text style={styles.totalValue}>{fmtEur(tva)}</Text>
            </View>
            <View style={styles.ttcRow}>
              <Text style={styles.ttcLabel}>Total TTC</Text>
              <Text style={styles.ttcValue}>{fmtEur(ttc)}</Text>
            </View>
          </View>
        </View>

        {/* ═══ NOTES ═══ */}
        {invoice.notes && (
          <View style={styles.notesBox}>
            <Text style={styles.notesTitle}>Notes / Conditions</Text>
            <Text style={styles.notesText}>{invoice.notes}</Text>
          </View>
        )}

        {/* ═══ FOOTER — Legal mentions ═══ */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {profile.company_name ?? profile.full_name ?? 'eCons Freelance'} — {profile.email ?? ''}
          </Text>
          {profile.siret && (
            <Text style={styles.footerText}>
              SIRET : {profile.siret}{profile.tva_number ? ` | N° TVA : ${profile.tva_number}` : ''}
            </Text>
          )}
          <Text style={styles.footerText}>
            Paiement à réception de facture — En cas de retard, une pénalité de 3x le taux d'intérêt légal sera appliquée.
          </Text>
          <Text style={styles.footerText}>
            Indemnité forfaitaire pour frais de recouvrement : 40,00 €
          </Text>
        </View>

      </Page>
    </Document>
  )
}
